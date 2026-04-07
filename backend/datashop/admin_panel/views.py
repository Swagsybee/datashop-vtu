import logging
from decimal import Decimal
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .permissions import IsAdminUser, IsSuperAdmin, IsAdminOrFinance, IsAdminOrOps
from .serializers import (
    AdminUserListSerializer, AdminTransactionSerializer,
    AdminFundUserSerializer, SuspendUserSerializer, AdminUpdateRateSerializer,
)
from users.models import User, Notification
from users.serializers import AdminUserSerializer
from transactions.models import Transaction
from wallet.models import WalletFunding
from wallet.services import credit_wallet
from services.models import DataPlan, ServiceConfig
from users.utils import create_notification

logger = logging.getLogger('datashop')


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        week_ago = timezone.now() - timedelta(days=7)
        month_ago = timezone.now() - timedelta(days=30)

        # Users
        user_stats = User.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(is_active=True, is_suspended=False)),
            suspended=Count('id', filter=Q(is_suspended=True)),
            new_today=Count('id', filter=Q(created_at__date=today)),
            new_this_week=Count('id', filter=Q(created_at__gte=week_ago)),
        )
        total_wallet = User.objects.aggregate(t=Sum('wallet_balance'))

        # Transactions
        tx_stats = Transaction.objects.aggregate(
            total=Count('id'),
            success=Count('id', filter=Q(status='success')),
            failed=Count('id', filter=Q(status='failed')),
            pending=Count('id', filter=Q(status='pending')),
            total_revenue=Sum('amount', filter=Q(status='success')),
            today_revenue=Sum('amount', filter=Q(status='success', created_at__date=today)),
            today_count=Count('id', filter=Q(created_at__date=today)),
            week_revenue=Sum('amount', filter=Q(status='success', created_at__gte=week_ago)),
            month_revenue=Sum('amount', filter=Q(status='success', created_at__gte=month_ago)),
        )

        # Revenue by service
        by_service = {}
        for tx_type, label in Transaction.TYPE_CHOICES:
            r = Transaction.objects.filter(type=tx_type, status='success').aggregate(
                count=Count('id'),
                revenue=Sum('amount'),
            )
            by_service[tx_type] = {
                'label': label,
                'count': r['count'] or 0,
                'revenue': str(r['revenue'] or 0),
            }

        # Daily revenue for chart (last 7 days)
        daily_revenue = []
        for i in range(6, -1, -1):
            day = timezone.now() - timedelta(days=i)
            r = Transaction.objects.filter(
                status='success',
                created_at__date=day.date()
            ).aggregate(total=Sum('amount'))
            daily_revenue.append({
                'date': day.strftime('%a'),
                'revenue': str(r['total'] or 0),
            })

        return Response({
            'users': {
                'total': user_stats['total'],
                'active': user_stats['active'],
                'suspended': user_stats['suspended'],
                'new_today': user_stats['new_today'],
                'new_this_week': user_stats['new_this_week'],
            },
            'wallet': {
                'total_balance': str(total_wallet['t'] or 0),
            },
            'transactions': {
                'total': tx_stats['total'],
                'successful': tx_stats['success'],
                'failed': tx_stats['failed'],
                'pending': tx_stats['pending'],
                'total_revenue': str(tx_stats['total_revenue'] or 0),
                'today_revenue': str(tx_stats['today_revenue'] or 0),
                'today_count': tx_stats['today_count'],
                'week_revenue': str(tx_stats['week_revenue'] or 0),
                'month_revenue': str(tx_stats['month_revenue'] or 0),
            },
            'by_service': by_service,
            'daily_revenue': daily_revenue,
        })


class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdminOrOps]
    serializer_class = AdminUserListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_suspended', 'is_verified']
    search_fields = ['email', 'phone', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'wallet_balance', 'last_login']
    ordering = ['-created_at']
    queryset = User.objects.all()


class AdminUserDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminOrOps]
    serializer_class = AdminUserListSerializer
    queryset = User.objects.all()


class AdminFundUserView(APIView):
    permission_classes = [IsAdminOrFinance]

    def post(self, request):
        serializer = AdminFundUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        data = serializer.validated_data
        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        reason = data.get('reason', 'Admin manual top-up')
        credit_wallet(user, data['amount'], reason, reference=f'ADMIN-{request.user.id}')
        create_notification(
            user,
            type='wallet',
            title='Wallet Funded by Admin 💰',
            message=f'₦{data["amount"]:,.2f} added to your wallet. Reason: {reason}'
        )
        logger.info(f'Admin {request.user.email} funded {user.email} ₦{data["amount"]}')
        return Response({
            'message': f'₦{data["amount"]:,.2f} added to {user.email} wallet.',
            'new_balance': str(user.wallet_balance),
        })


class AdminSuspendUserView(APIView):
    permission_classes = [IsAdminOrOps]

    def post(self, request):
        serializer = SuspendUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        try:
            user = User.objects.get(id=serializer.validated_data['user_id'])
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        if user.role in ['admin', 'superadmin']:
            return Response({'error': 'Cannot suspend admin accounts.'}, status=403)

        user.is_suspended = True
        user.is_active = False
        user.suspension_reason = serializer.validated_data['reason']
        user.save(update_fields=['is_suspended', 'is_active', 'suspension_reason'])
        logger.info(f'Admin {request.user.email} suspended {user.email}')
        return Response({'message': f'{user.full_name} has been suspended.'})


class AdminActivateUserView(APIView):
    permission_classes = [IsAdminOrOps]

    def post(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        user.is_suspended = False
        user.is_active = True
        user.suspension_reason = ''
        user.save(update_fields=['is_suspended', 'is_active', 'suspension_reason'])
        create_notification(user, type='system',
            title='Account Reactivated',
            message='Your account has been reactivated. You can now make purchases.')
        logger.info(f'Admin {request.user.email} activated {user.email}')
        return Response({'message': f'{user.full_name} has been activated.'})


class AdminTransactionListView(generics.ListAPIView):
    permission_classes = [IsAdminOrFinance]
    serializer_class = AdminTransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'status', 'service_provider']
    search_fields = ['reference', 'user__email', 'user__phone', 'external_reference']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    queryset = Transaction.objects.select_related('user').all()


class AdminRefundView(APIView):
    permission_classes = [IsAdminOrFinance]

    def post(self, request, pk):
        try:
            tx = Transaction.objects.select_related('user').get(id=pk)
        except Transaction.DoesNotExist:
            return Response({'error': 'Transaction not found.'}, status=404)

        if tx.status == 'refunded':
            return Response({'error': 'Already refunded.'}, status=400)
        if tx.status not in ['success', 'failed']:
            return Response({'error': 'Only success or failed transactions can be refunded.'}, status=400)

        credit_wallet(tx.user, tx.amount, f'Refund for {tx.reference}', tx.reference)
        tx.status = 'refunded'
        tx.refunded_at = timezone.now()
        tx.save(update_fields=['status', 'refunded_at'])

        create_notification(tx.user, type='wallet',
            title='Transaction Refunded ↩',
            message=f'₦{tx.amount:,.2f} refunded for transaction {tx.reference}.')
        logger.info(f'Admin {request.user.email} refunded {tx.reference} ₦{tx.amount}')
        return Response({'message': f'₦{tx.amount:,.2f} refunded to {tx.user.email}.'})


class AdminUpdateDataRateView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        serializer = AdminUpdateRateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        try:
            plan = DataPlan.objects.get(id=serializer.validated_data['plan_id'])
        except DataPlan.DoesNotExist:
            return Response({'error': 'Data plan not found.'}, status=404)

        plan.buy_price = serializer.validated_data['buy_price']
        plan.sell_price = serializer.validated_data['sell_price']
        plan.save(update_fields=['buy_price', 'sell_price', 'updated_at'])
        logger.info(f'Admin updated rate for plan {plan.id}: buy={plan.buy_price} sell={plan.sell_price}')
        return Response({'message': f'Rate updated for {plan.name}.', 'plan': {
            'id': plan.id, 'name': plan.name,
            'buy_price': str(plan.buy_price),
            'sell_price': str(plan.sell_price),
            'margin': f'{plan.profit_margin}%',
        }})


class AdminToggleServiceView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, service):
        valid_services = ['data', 'airtime', 'electricity', 'tv', 'exam']
        if service not in valid_services:
            return Response({'error': 'Invalid service.'}, status=400)

        config, _ = ServiceConfig.objects.get_or_create(service=service)
        config.is_enabled = not config.is_enabled
        message = request.data.get('message', '')
        if not config.is_enabled and message:
            config.maintenance_message = message
        config.save()
        action = 'enabled' if config.is_enabled else 'disabled'
        logger.info(f'Admin {request.user.email} {action} {service} service')
        return Response({'service': service, 'is_enabled': config.is_enabled, 'message': f'{service.title()} {action}.'})


class AdminCreateUserView(APIView):
    permission_classes = [IsAdminOrOps]

    def post(self, request):
        from users.serializers import RegisterSerializer
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)
        user = serializer.save()
        initial_balance = Decimal(str(request.data.get('initial_balance', 0)))
        if initial_balance > 0:
            credit_wallet(user, initial_balance, 'Initial wallet funding by admin')
        logger.info(f'Admin {request.user.email} created user {user.email}')
        return Response({
            'message': f'User {user.full_name} created.',
            'user': AdminUserListSerializer(user).data,
        }, status=201)


@api_view(['GET'])
@permission_classes([IsAdminOrFinance])
def admin_wallet_stats(request):
    from wallet.models import WalletTransaction
    today = timezone.now().date()
    stats = {
        'total_wallet_value': str(User.objects.aggregate(t=Sum('wallet_balance'))['t'] or 0),
        'funded_today': str(WalletFunding.objects.filter(status='success', created_at__date=today).aggregate(t=Sum('amount'))['t'] or 0),
        'funding_count_today': WalletFunding.objects.filter(status='success', created_at__date=today).count(),
        'spent_today': str(Transaction.objects.filter(status='success', created_at__date=today).aggregate(t=Sum('amount'))['t'] or 0),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_activity_log(request):
    """Returns last 50 significant events across the platform."""
    from users.models import LoginLog
    logs = []

    # Recent transactions
    recent_tx = Transaction.objects.select_related('user').order_by('-created_at')[:20]
    for tx in recent_tx:
        logs.append({
            'type': 'transaction',
            'icon': '💳',
            'text': f'{tx.user.email} {tx.get_type_display()} ₦{tx.amount:,.0f} [{tx.status}]',
            'time': tx.created_at.isoformat(),
        })

    # Recent fundings
    recent_fundings = WalletFunding.objects.filter(status='success').select_related('user').order_by('-created_at')[:10]
    for f in recent_fundings:
        logs.append({
            'type': 'funding',
            'icon': '💰',
            'text': f'{f.user.email} funded wallet ₦{f.amount:,.0f}',
            'time': f.created_at.isoformat(),
        })

    # Recent logins
    recent_logins = LoginLog.objects.select_related('user').order_by('-created_at')[:10]
    for log in recent_logins:
        logs.append({
            'type': 'login',
            'icon': '🔐',
            'text': f'{log.user.email} logged in from {log.ip_address}',
            'time': log.created_at.isoformat(),
        })

    # Sort all by time
    logs.sort(key=lambda x: x['time'], reverse=True)
    return Response(logs[:50])
