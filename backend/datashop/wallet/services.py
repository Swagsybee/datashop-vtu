"""
Wallet Service Layer
All wallet operations go through here — atomic, logged, safe.
"""
import logging
import hashlib
import hmac
import json
import requests
from decimal import Decimal
from django.db import transaction as db_transaction
from django.conf import settings
from .models import WalletFunding, WalletTransaction

logger = logging.getLogger('datashop')


def credit_wallet(user, amount, description, reference='', commit=True):
    """
    Safely credit a user's wallet.
    ALWAYS use this function — never update wallet_balance directly.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError('Credit amount must be positive.')

    with db_transaction.atomic():
        # Lock the user row to prevent race conditions
        from users.models import User
        user = User.objects.select_for_update().get(id=user.id)
        balance_before = user.wallet_balance
        user.wallet_balance += amount
        user.save(update_fields=['wallet_balance'])

        WalletTransaction.objects.create(
            user=user,
            type='credit',
            amount=amount,
            balance_before=balance_before,
            balance_after=user.wallet_balance,
            description=description,
            reference=reference,
        )
        logger.info(f'Wallet credited: {user.email} +₦{amount} | Balance: ₦{user.wallet_balance}')
        return user.wallet_balance


def debit_wallet(user, amount, description, reference=''):
    """
    Safely debit a user's wallet.
    Raises InsufficientFunds if balance is too low.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError('Debit amount must be positive.')

    with db_transaction.atomic():
        from users.models import User
        user = User.objects.select_for_update().get(id=user.id)

        if user.wallet_balance < amount:
            raise InsufficientFundsError(
                f'Insufficient wallet balance. Balance: ₦{user.wallet_balance}, Required: ₦{amount}'
            )

        balance_before = user.wallet_balance
        user.wallet_balance -= amount
        user.save(update_fields=['wallet_balance'])

        WalletTransaction.objects.create(
            user=user,
            type='debit',
            amount=amount,
            balance_before=balance_before,
            balance_after=user.wallet_balance,
            description=description,
            reference=reference,
        )
        logger.info(f'Wallet debited: {user.email} -₦{amount} | Balance: ₦{user.wallet_balance}')
        return user.wallet_balance


class InsufficientFundsError(Exception):
    pass


# ─── PAYSTACK ────────────────────────────────────────────────────────────────
class PaystackService:
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.base_url = settings.PAYSTACK_BASE_URL
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }

    def initialize_transaction(self, user, amount, callback_url=None):
        """
        Initialize a Paystack payment.
        Amount in NAIRA (we convert to kobo internally).
        """
        import uuid
        reference = f'DSH-FUND-{uuid.uuid4().hex[:12].upper()}'
        amount_kobo = int(Decimal(str(amount)) * 100)  # Convert to kobo

        payload = {
            'email': user.email,
            'amount': amount_kobo,
            'reference': reference,
            'currency': 'NGN',
            'metadata': {
                'user_id': str(user.id),
                'user_name': user.full_name,
                'custom_fields': [
                    {'display_name': 'User', 'variable_name': 'user', 'value': user.full_name}
                ]
            },
        }
        if callback_url:
            payload['callback_url'] = callback_url

        try:
            resp = requests.post(
                f'{self.base_url}/transaction/initialize',
                headers=self.headers,
                json=payload,
                timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            if data['status']:
                return {
                    'reference': reference,
                    'authorization_url': data['data']['authorization_url'],
                    'access_code': data['data']['access_code'],
                }
            raise PaystackError(data.get('message', 'Unknown error'))
        except requests.RequestException as e:
            logger.error(f'Paystack initialize error: {e}')
            raise PaystackError(f'Payment gateway error: {str(e)}')

    def verify_transaction(self, reference):
        """Verify a Paystack transaction by reference."""
        try:
            resp = requests.get(
                f'{self.base_url}/transaction/verify/{reference}',
                headers=self.headers,
                timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            if data['status'] and data['data']['status'] == 'success':
                return {
                    'status': 'success',
                    'amount': Decimal(str(data['data']['amount'])) / 100,  # Convert from kobo
                    'reference': reference,
                    'channel': data['data']['channel'],
                    'customer_email': data['data']['customer']['email'],
                }
            return {'status': 'failed', 'reference': reference}
        except requests.RequestException as e:
            logger.error(f'Paystack verify error: {e}')
            raise PaystackError(f'Verification failed: {str(e)}')

    def verify_webhook_signature(self, payload_bytes, signature):
        """Verify that the webhook came from Paystack."""
        expected = hmac.new(
            self.secret_key.encode('utf-8'),
            payload_bytes,
            hashlib.sha512
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


class PaystackError(Exception):
    pass


def process_wallet_funding_webhook(reference, verified_amount):
    """
    Called by webhook handler AFTER Paystack confirms payment.
    This is the ONLY safe place to credit a wallet from Paystack.
    """
    try:
        funding = WalletFunding.objects.get(
            paystack_reference=reference,
            status='pending'
        )
    except WalletFunding.DoesNotExist:
        logger.warning(f'Webhook: Funding not found or already processed: {reference}')
        return False

    with db_transaction.atomic():
        funding.status = 'success'
        funding.save(update_fields=['status'])

        credit_wallet(
            user=funding.user,
            amount=verified_amount,
            description=f'Wallet funding via Paystack',
            reference=reference,
        )

        from users.utils import create_notification
        create_notification(
            funding.user,
            type='wallet',
            title='Wallet Funded! 💰',
            message=f'₦{verified_amount:,.2f} has been added to your wallet.'
        )

        logger.info(f'Webhook processed: {reference} ₦{verified_amount} → {funding.user.email}')
        return True
