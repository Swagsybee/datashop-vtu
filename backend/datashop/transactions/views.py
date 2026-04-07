import logging
from django.db.models import Sum, Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Transaction, ScheduledTransaction
from .serializers import TransactionSerializer, ScheduledTransactionSerializer, CreateScheduledTransactionSerializer

logger = logging.getLogger('datashop')


class TransactionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'status', 'service_provider']
    search_fields = ['reference', 'external_reference', 'service_provider']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class TransactionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_stats(request):
    user = request.user
    qs = Transaction.objects.filter(user=user)
    stats = qs.aggregate(
        total=Count('id'),
        success=Count('id', filter=Q(status='success')),
        failed=Count('id', filter=Q(status='failed')),
        total_spent=Sum('amount', filter=Q(status='success')),
    )

    by_type = {}
    for tx_type, _ in Transaction.TYPE_CHOICES:
        type_stats = qs.filter(type=tx_type).aggregate(
            count=Count('id'),
            total=Sum('amount', filter=Q(status='success')),
        )
        by_type[tx_type] = {'count': type_stats['count'], 'total': str(type_stats['total'] or 0)}

    return Response({
        'total_transactions': stats['total'],
        'successful': stats['success'],
        'failed': stats['failed'],
        'total_spent': str(stats['total_spent'] or 0),
        'by_type': by_type,
    })


class ScheduledTransactionListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateScheduledTransactionSerializer
        return ScheduledTransactionSerializer

    def get_queryset(self):
        return ScheduledTransaction.objects.filter(user=self.request.user, status='active')

    def perform_create(self, serializer):
        data = serializer.validated_data
        # Get amount from payload based on type
        payload = data['payload']
        amount = payload.get('amount', 0)
        ScheduledTransaction.objects.create(
            user=self.request.user,
            type=data['type'],
            payload=payload,
            amount=amount,
            scheduled_at=data['scheduled_at'],
            recurrence=data.get('recurrence', 'once'),
        )
        return Response({'message': 'Payment scheduled successfully.'}, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_scheduled(request, pk):
    try:
        scheduled = ScheduledTransaction.objects.get(id=pk, user=request.user, status='active')
        scheduled.status = 'cancelled'
        scheduled.save()
        return Response({'message': 'Scheduled payment cancelled.'})
    except ScheduledTransaction.DoesNotExist:
        return Response({'error': 'Scheduled payment not found.'}, status=404)
