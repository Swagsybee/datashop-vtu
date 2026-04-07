from rest_framework import serializers
from .models import WalletFunding, WalletTransaction
from django.conf import settings


class InitiateFundingSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    callback_url = serializers.URLField(required=False, allow_blank=True)

    def validate_amount(self, value):
        min_amount = settings.MIN_WALLET_FUNDING
        if value < min_amount:
            raise serializers.ValidationError(f'Minimum funding amount is ₦{min_amount:,}.')
        if value > 1_000_000:
            raise serializers.ValidationError('Maximum single funding is ₦1,000,000.')
        return value


class WalletFundingSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletFunding
        fields = ['id', 'amount', 'paystack_reference', 'status', 'channel', 'created_at']
        read_only_fields = ['id', 'status', 'channel', 'created_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ['id', 'type', 'amount', 'balance_before', 'balance_after', 'description', 'reference', 'created_at']
        read_only_fields = '__all__'
