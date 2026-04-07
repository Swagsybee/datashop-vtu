from rest_framework import serializers
from .models import Transaction, ScheduledTransaction


class TransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_icon = serializers.ReadOnlyField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'type', 'type_display', 'type_icon', 'service_provider',
            'amount', 'status', 'status_display', 'reference',
            'external_reference', 'metadata', 'failure_reason',
            'refunded_at', 'created_at',
        ]
        read_only_fields = '__all__'


class ScheduledTransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = ScheduledTransaction
        fields = [
            'id', 'type', 'type_display', 'amount', 'scheduled_at',
            'recurrence', 'status', 'last_executed_at', 'execution_count', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'last_executed_at', 'execution_count', 'created_at']


class CreateScheduledTransactionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['data', 'airtime', 'electricity', 'tv', 'exam'])
    payload = serializers.JSONField()
    scheduled_at = serializers.DateTimeField()
    recurrence = serializers.ChoiceField(choices=['once', 'daily', 'weekly', 'monthly'], default='once')

    def validate_scheduled_at(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError('Scheduled time must be in the future.')
        return value
