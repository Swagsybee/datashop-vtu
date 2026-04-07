from rest_framework import serializers
from users.models import User
from transactions.models import Transaction
from wallet.models import WalletFunding


class AdminUserListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_transactions = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'full_name', 'first_name', 'last_name',
            'role', 'wallet_balance', 'referral_code', 'referral_bonus_earned',
            'is_active', 'is_suspended', 'suspension_reason', 'is_verified',
            'total_transactions', 'total_spent', 'created_at', 'last_login',
        ]

    def get_total_transactions(self, obj):
        return obj.transactions.count()

    def get_total_spent(self, obj):
        from django.db.models import Sum
        r = obj.transactions.filter(status='success').aggregate(t=Sum('amount'))
        return str(r['t'] or 0)


class AdminTransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'user_email', 'user_name', 'type', 'type_display',
            'service_provider', 'amount', 'status', 'status_display',
            'external_reference', 'metadata', 'failure_reason', 'refunded_at', 'created_at',
        ]


class AdminFundUserSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    reason = serializers.CharField(max_length=255, required=False, default='Admin manual top-up')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be positive.')
        if value > 10_000_000:
            raise serializers.ValidationError('Maximum single funding is ₦10,000,000.')
        return value


class SuspendUserSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    reason = serializers.CharField(max_length=500)


class AdminUpdateRateSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    buy_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    sell_price = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate(self, attrs):
        if attrs['sell_price'] <= attrs['buy_price']:
            raise serializers.ValidationError('Sell price must be greater than buy price.')
        return attrs


class AdminStatsSerializer(serializers.Serializer):
    """Used only for documentation purposes."""
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    suspended_users = serializers.IntegerField()
    total_transactions = serializers.IntegerField()
    successful_transactions = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_wallet_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    today_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_transactions = serializers.IntegerField()
