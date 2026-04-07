import json
import logging
from decimal import Decimal
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import WalletFunding, WalletTransaction
from .serializers import InitiateFundingSerializer, WalletFundingSerializer, WalletTransactionSerializer
from .services import PaystackService, PaystackError, process_wallet_funding_webhook
from users.utils import get_client_ip

logger = logging.getLogger('datashop')


class InitiateFundingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiateFundingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        amount = serializer.validated_data['amount']
        callback_url = serializer.validated_data.get('callback_url', '')
        user = request.user

        try:
            paystack = PaystackService()
            result = paystack.initialize_transaction(user, amount, callback_url)

            # Create pending funding record
            funding = WalletFunding.objects.create(
                user=user,
                amount=amount,
                paystack_reference=result['reference'],
                paystack_access_code=result['access_code'],
                authorization_url=result['authorization_url'],
                status='pending',
                ip_address=get_client_ip(request),
            )

            return Response({
                'message': 'Payment initialized.',
                'reference': result['reference'],
                'authorization_url': result['authorization_url'],
                'access_code': result['access_code'],
                'amount': str(amount),
            })
        except PaystackError as e:
            logger.error(f'Paystack init error for {user.email}: {e}')
            return Response({'error': str(e)}, status=502)


class VerifyFundingView(APIView):
    """
    Called by frontend after user returns from Paystack.
    DO NOT credit wallet here — wait for webhook.
    This just checks status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        try:
            funding = WalletFunding.objects.get(
                paystack_reference=reference,
                user=request.user
            )
        except WalletFunding.DoesNotExist:
            return Response({'error': 'Transaction not found.'}, status=404)

        if funding.status == 'success':
            return Response({'status': 'success', 'amount': str(funding.amount)})

        # Check with Paystack directly
        try:
            paystack = PaystackService()
            result = paystack.verify_transaction(reference)
            if result['status'] == 'success' and funding.status == 'pending':
                # Webhook may have been delayed — process now
                process_wallet_funding_webhook(reference, result['amount'])
                funding.refresh_from_db()
            return Response({'status': funding.status, 'amount': str(funding.amount)})
        except PaystackError as e:
            return Response({'error': str(e)}, status=502)


@method_decorator(csrf_exempt, name='dispatch')
class PaystackWebhookView(APIView):
    """
    Paystack sends POST here when payment is confirmed.
    This is the REAL money — handle with care.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')
        payload_bytes = request.body

        # Verify signature
        paystack = PaystackService()
        if not paystack.verify_webhook_signature(payload_bytes, signature):
            logger.warning('Invalid Paystack webhook signature received.')
            return Response({'error': 'Invalid signature.'}, status=400)

        try:
            payload = json.loads(payload_bytes)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON.'}, status=400)

        event = payload.get('event')
        data = payload.get('data', {})

        logger.info(f'Paystack webhook received: {event}')

        if event == 'charge.success':
            reference = data.get('reference')
            amount_kobo = data.get('amount', 0)
            amount_naira = Decimal(str(amount_kobo)) / 100

            success = process_wallet_funding_webhook(reference, amount_naira)
            if success:
                logger.info(f'Webhook: Successfully processed {reference}')
            else:
                logger.warning(f'Webhook: Could not process {reference}')

        # Always return 200 to Paystack regardless
        return Response({'status': 'ok'})


class WalletHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        return WalletTransaction.objects.filter(user=self.request.user)


class FundingHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WalletFundingSerializer

    def get_queryset(self):
        return WalletFunding.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wallet_balance(request):
    return Response({
        'balance': str(request.user.wallet_balance),
        'email': request.user.email,
    })
