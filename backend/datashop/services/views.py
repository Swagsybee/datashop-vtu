import logging
from decimal import Decimal
from django.db import transaction as db_transaction
from django.conf import settings
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DataPlan, TVProvider, TVPlan, ElectricityDisco, ExamProduct, ServiceConfig
from .serializers import (
    DataPlanSerializer, TVProviderSerializer, ElectricityDiscoSerializer,
    ExamProductSerializer, ServiceConfigSerializer,
    BuyDataSerializer, BuyAirtimeSerializer, BuyElectricitySerializer,
    BuyTVSerializer, BuyExamPinSerializer, VerifyMeterSerializer, VerifySmartcardSerializer,
)
from .vtpass_service import VTpassService, VTpassError
from wallet.services import debit_wallet, credit_wallet, InsufficientFundsError
from transactions.models import Transaction
from users.utils import create_notification

logger = logging.getLogger('datashop')


def check_service_enabled(service_type):
    """Returns (is_enabled, message)."""
    try:
        config = ServiceConfig.objects.get(service=service_type)
        if not config.is_enabled:
            return False, config.maintenance_message or f'{service_type.title()} service is temporarily unavailable.'
    except ServiceConfig.DoesNotExist:
        pass
    return True, ''


def verify_pin(user, pin):
    """Returns (valid, error_message)."""
    if not user.pin_set:
        return False, 'Transaction PIN not set. Please set your PIN in settings.'
    try:
        valid = user.verify_transaction_pin(pin)
        return valid, '' if valid else 'Incorrect transaction PIN.'
    except ValueError as e:
        return False, str(e)


# ─── CATALOGUE ENDPOINTS ──────────────────────────────────────────────────────

class DataPlansView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DataPlanSerializer

    def get_queryset(self):
        qs = DataPlan.objects.filter(is_active=True)
        network = self.request.query_params.get('network')
        vendor = self.request.query_params.get('vendor_type', 'sme')
        if network:
            qs = qs.filter(network=network.lower())
        if vendor:
            qs = qs.filter(vendor_type=vendor.lower())
        return qs


class TVProvidersView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TVProviderSerializer
    queryset = TVProvider.objects.filter(is_active=True).prefetch_related('plans')


class ElectricityDiscosView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ElectricityDiscoSerializer
    queryset = ElectricityDisco.objects.filter(is_active=True)


class ExamProductsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExamProductSerializer

    def get_queryset(self):
        qs = ExamProduct.objects.filter(is_active=True)
        body = self.request.query_params.get('body')
        if body:
            qs = qs.filter(body=body.lower())
        return qs


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_status(request):
    configs = ServiceConfig.objects.all()
    return Response(ServiceConfigSerializer(configs, many=True).data)


# ─── VERIFICATION ENDPOINTS ───────────────────────────────────────────────────

class VerifyMeterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyMeterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)
        try:
            disco = ElectricityDisco.objects.get(id=serializer.validated_data['disco_id'], is_active=True)
        except ElectricityDisco.DoesNotExist:
            return Response({'error': 'Invalid DISCO selected.'}, status=400)
        try:
            vtpass = VTpassService()
            result = vtpass.verify_meter(
                serializer.validated_data['meter_number'],
                disco.vtpass_service_id,
                serializer.validated_data['meter_type']
            )
            return Response(result)
        except VTpassError as e:
            return Response({'error': str(e)}, status=502)


class VerifySmartcardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifySmartcardSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)
        try:
            provider = TVProvider.objects.get(id=serializer.validated_data['provider_id'], is_active=True)
        except TVProvider.DoesNotExist:
            return Response({'error': 'Invalid TV provider.'}, status=400)
        try:
            vtpass = VTpassService()
            result = vtpass.verify_smartcard(serializer.validated_data['smartcard_number'], provider.vtpass_service_id)
            return Response(result)
        except VTpassError as e:
            return Response({'error': str(e)}, status=502)


# ─── PURCHASE ENDPOINTS ───────────────────────────────────────────────────────

class BuyDataView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        enabled, msg = check_service_enabled('data')
        if not enabled:
            return Response({'error': msg}, status=503)

        serializer = BuyDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        user = request.user
        data = serializer.validated_data

        # Verify PIN
        valid, error = verify_pin(user, data['transaction_pin'])
        if not valid:
            return Response({'error': error}, status=400)

        # Get plan
        plan = DataPlan.objects.get(id=data['plan_id'])

        # Check balance
        if user.wallet_balance < plan.sell_price:
            return Response({'error': f'Insufficient balance. You need ₦{plan.sell_price:,.2f}.'}, status=400)

        # Create transaction record (pending)
        tx = Transaction.objects.create(
            user=user,
            type='data',
            service_provider=plan.network.upper(),
            amount=plan.sell_price,
            status='pending',
            metadata={
                'phone': data['phone'],
                'plan_name': plan.name,
                'size': plan.size_display,
                'validity': plan.validity_display,
                'network': plan.network,
                'vendor_type': plan.vendor_type,
                'gift_email': data.get('gift_email', ''),
            }
        )

        try:
            with db_transaction.atomic():
                # Debit wallet FIRST
                debit_wallet(
                    user=user,
                    amount=plan.sell_price,
                    description=f'{plan.network.upper()} {plan.size_display} Data',
                    reference=tx.reference,
                )

                # Call VTpass
                vtpass = VTpassService()
                result = vtpass.buy_data(
                    phone=data['phone'],
                    network=plan.network,
                    variation_code=plan.vtpass_id,
                    amount=plan.buy_price,
                    request_id=tx.reference,
                )

                if result['status'] == 'success':
                    tx.status = 'success'
                    tx.external_reference = result.get('transaction_id', '')
                    tx.save(update_fields=['status', 'external_reference'])

                    create_notification(
                        user,
                        type='transaction',
                        title=f'Data Purchase Successful ✅',
                        message=f'{plan.size_display} {plan.network.upper()} data sent to {data["phone"]}.',
                        data={'transaction_id': str(tx.id)},
                    )
                    logger.info(f'Data purchase success: {user.email} {plan.size_display} → {data["phone"]}')
                    return Response({
                        'message': f'{plan.size_display} data sent to {data["phone"]} successfully.',
                        'transaction': {
                            'reference': tx.reference,
                            'amount': str(plan.sell_price),
                            'status': 'success',
                        }
                    })
                else:
                    # VTpass failed — refund wallet
                    raise VTpassError(result['message'])

        except (VTpassError, Exception) as e:
            # Refund wallet
            tx.status = 'failed'
            tx.save(update_fields=['status'])
            try:
                credit_wallet(user, plan.sell_price, f'Refund: Failed data purchase', tx.reference)
            except Exception as refund_err:
                logger.critical(f'REFUND FAILED for {tx.reference}: {refund_err}')
            logger.error(f'Data purchase failed for {user.email}: {e}')
            return Response({'error': f'Purchase failed. ₦{plan.sell_price:,.2f} refunded to your wallet.'}, status=502)


class BuyAirtimeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        enabled, msg = check_service_enabled('airtime')
        if not enabled:
            return Response({'error': msg}, status=503)

        serializer = BuyAirtimeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        user = request.user
        data = serializer.validated_data

        valid, error = verify_pin(user, data['transaction_pin'])
        if not valid:
            return Response({'error': error}, status=400)

        if user.wallet_balance < data['amount']:
            return Response({'error': f'Insufficient balance. You need ₦{data["amount"]:,.2f}.'}, status=400)

        tx = Transaction.objects.create(
            user=user,
            type='airtime',
            service_provider=data['network'].upper(),
            amount=data['amount'],
            status='pending',
            metadata={'phone': data['phone'], 'network': data['network']},
        )

        try:
            with db_transaction.atomic():
                debit_wallet(user, data['amount'], f'{data["network"].upper()} Airtime', tx.reference)
                vtpass = VTpassService()
                result = vtpass.buy_airtime(data['phone'], data['network'], data['amount'], tx.reference)

                if result['status'] == 'success':
                    tx.status = 'success'
                    tx.external_reference = result.get('transaction_id', '')
                    tx.save(update_fields=['status', 'external_reference'])
                    create_notification(user, type='transaction',
                        title='Airtime Purchase Successful ✅',
                        message=f'₦{data["amount"]:,.2f} {data["network"].upper()} airtime sent to {data["phone"]}.',
                        data={'transaction_id': str(tx.id)})
                    return Response({'message': f'₦{data["amount"]:,.2f} airtime sent to {data["phone"]}.',
                                     'transaction': {'reference': tx.reference, 'status': 'success'}})
                else:
                    raise VTpassError(result['message'])

        except (VTpassError, Exception) as e:
            tx.status = 'failed'
            tx.save(update_fields=['status'])
            try:
                credit_wallet(user, data['amount'], 'Refund: Failed airtime purchase', tx.reference)
            except Exception as re:
                logger.critical(f'REFUND FAILED {tx.reference}: {re}')
            return Response({'error': f'Purchase failed. ₦{data["amount"]:,.2f} refunded.'}, status=502)


class BuyElectricityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        enabled, msg = check_service_enabled('electricity')
        if not enabled:
            return Response({'error': msg}, status=503)

        serializer = BuyElectricitySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        user = request.user
        data = serializer.validated_data

        valid, error = verify_pin(user, data['transaction_pin'])
        if not valid:
            return Response({'error': error}, status=400)

        try:
            disco = ElectricityDisco.objects.get(id=data['disco_id'], is_active=True)
        except ElectricityDisco.DoesNotExist:
            return Response({'error': 'Invalid DISCO selected.'}, status=400)

        if user.wallet_balance < data['amount']:
            return Response({'error': f'Insufficient balance. You need ₦{data["amount"]:,.2f}.'}, status=400)

        tx = Transaction.objects.create(
            user=user, type='electricity', service_provider=disco.name,
            amount=data['amount'], status='pending',
            metadata={
                'meter_number': data['meter_number'], 'meter_type': data['meter_type'],
                'disco': disco.name, 'phone': data['phone'],
            },
        )

        try:
            with db_transaction.atomic():
                debit_wallet(user, data['amount'], f'{disco.name} Electricity Token', tx.reference)
                vtpass = VTpassService()
                result = vtpass.buy_electricity(
                    data['meter_number'], disco.vtpass_service_id,
                    data['meter_type'], data['amount'], data['phone'], tx.reference,
                )
                if result['status'] == 'success':
                    tx.status = 'success'
                    tx.external_reference = result.get('transaction_id', '')
                    tx.metadata['token'] = result.get('token', '')
                    tx.save(update_fields=['status', 'external_reference', 'metadata'])
                    create_notification(user, type='transaction',
                        title='Electricity Token Purchased ✅',
                        message=f'₦{data["amount"]:,.2f} electricity token for meter {data["meter_number"]}. Token: {result.get("token", "Check your meter")}',
                        data={'transaction_id': str(tx.id)})
                    return Response({'message': 'Electricity token purchased.',
                                     'token': result.get('token', ''),
                                     'transaction': {'reference': tx.reference, 'status': 'success'}})
                else:
                    raise VTpassError(result['message'])
        except (VTpassError, Exception) as e:
            tx.status = 'failed'
            tx.save(update_fields=['status'])
            try:
                credit_wallet(user, data['amount'], 'Refund: Failed electricity purchase', tx.reference)
            except Exception as re:
                logger.critical(f'REFUND FAILED {tx.reference}: {re}')
            return Response({'error': f'Purchase failed. ₦{data["amount"]:,.2f} refunded.'}, status=502)


class BuyTVView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        enabled, msg = check_service_enabled('tv')
        if not enabled:
            return Response({'error': msg}, status=503)

        serializer = BuyTVSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        user = request.user
        data = serializer.validated_data

        valid, error = verify_pin(user, data['transaction_pin'])
        if not valid:
            return Response({'error': error}, status=400)

        plan = TVPlan.objects.select_related('provider').get(id=data['plan_id'])

        if user.wallet_balance < plan.sell_price:
            return Response({'error': f'Insufficient balance. You need ₦{plan.sell_price:,.2f}.'}, status=400)

        tx = Transaction.objects.create(
            user=user, type='tv', service_provider=plan.provider.name,
            amount=plan.sell_price, status='pending',
            metadata={'smartcard': data['smartcard_number'], 'plan': plan.name, 'provider': plan.provider.name},
        )

        try:
            with db_transaction.atomic():
                debit_wallet(user, plan.sell_price, f'{plan.provider.name} {plan.name}', tx.reference)
                vtpass = VTpassService()
                result = vtpass.buy_tv_subscription(
                    data['smartcard_number'], plan.provider.vtpass_service_id,
                    plan.vtpass_variation_code, plan.sell_price, data['phone'], tx.reference,
                )
                if result['status'] == 'success':
                    tx.status = 'success'
                    tx.external_reference = result.get('transaction_id', '')
                    tx.save(update_fields=['status', 'external_reference'])
                    create_notification(user, type='transaction',
                        title='TV Subscription Successful ✅',
                        message=f'{plan.provider.name} {plan.name} subscribed for smartcard {data["smartcard_number"]}.',
                        data={'transaction_id': str(tx.id)})
                    return Response({'message': f'{plan.provider.name} {plan.name} subscription successful.',
                                     'transaction': {'reference': tx.reference, 'status': 'success'}})
                else:
                    raise VTpassError(result['message'])
        except (VTpassError, Exception) as e:
            tx.status = 'failed'
            tx.save(update_fields=['status'])
            try:
                credit_wallet(user, plan.sell_price, 'Refund: Failed TV subscription', tx.reference)
            except Exception as re:
                logger.critical(f'REFUND FAILED {tx.reference}: {re}')
            return Response({'error': f'Subscription failed. ₦{plan.sell_price:,.2f} refunded.'}, status=502)


class BuyExamPinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        enabled, msg = check_service_enabled('exam')
        if not enabled:
            return Response({'error': msg}, status=503)

        serializer = BuyExamPinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        user = request.user
        data = serializer.validated_data
        product = ExamProduct.objects.get(id=data['product_id'])
        total_amount = product.sell_price * data['quantity']

        valid, error = verify_pin(user, data['transaction_pin'])
        if not valid:
            return Response({'error': error}, status=400)

        if user.wallet_balance < total_amount:
            return Response({'error': f'Insufficient balance. You need ₦{total_amount:,.2f}.'}, status=400)

        tx = Transaction.objects.create(
            user=user, type='exam', service_provider=product.body.upper(),
            amount=total_amount, status='pending',
            metadata={'product': product.name, 'quantity': data['quantity'], 'email': data['email']},
        )

        try:
            with db_transaction.atomic():
                debit_wallet(user, total_amount, f'{product.body.upper()} {product.name}', tx.reference)
                vtpass = VTpassService()
                result = vtpass.buy_exam_pin(
                    product.body, product.vtpass_variation_code,
                    total_amount, data['phone'], data['quantity'], tx.reference,
                )
                if result['status'] == 'success':
                    tx.status = 'success'
                    tx.metadata['pins'] = result.get('pins', [])
                    tx.save(update_fields=['status', 'metadata'])
                    create_notification(user, type='transaction',
                        title='Exam Pin Purchase Successful ✅',
                        message=f'{product.body.upper()} {product.name} pin(s) sent to {data["email"]}.',
                        data={'transaction_id': str(tx.id)})
                    return Response({'message': 'Exam pin purchased. Check your email.',
                                     'pins': result.get('pins', []),
                                     'transaction': {'reference': tx.reference, 'status': 'success'}})
                else:
                    raise VTpassError(result['message'])
        except (VTpassError, Exception) as e:
            tx.status = 'failed'
            tx.save(update_fields=['status'])
            try:
                credit_wallet(user, total_amount, 'Refund: Failed exam pin purchase', tx.reference)
            except Exception as re:
                logger.critical(f'REFUND FAILED {tx.reference}: {re}')
            return Response({'error': f'Purchase failed. ₦{total_amount:,.2f} refunded.'}, status=502)
