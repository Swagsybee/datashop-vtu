from rest_framework import serializers
from .models import DataPlan, TVProvider, TVPlan, ElectricityDisco, ExamProduct, ServiceConfig


class DataPlanSerializer(serializers.ModelSerializer):
    profit_margin = serializers.ReadOnlyField()

    class Meta:
        model = DataPlan
        fields = [
            'id', 'network', 'vendor_type', 'name', 'size_display',
            'size_mb', 'validity_display', 'validity_days',
            'sell_price', 'is_active', 'profit_margin'
        ]


class TVPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = TVPlan
        fields = ['id', 'name', 'vtpass_variation_code', 'duration_months', 'sell_price', 'is_active']


class TVProviderSerializer(serializers.ModelSerializer):
    plans = TVPlanSerializer(many=True, read_only=True)

    class Meta:
        model = TVProvider
        fields = ['id', 'name', 'vtpass_service_id', 'is_active', 'plans']


class ElectricityDiscoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectricityDisco
        fields = ['id', 'name', 'code', 'vtpass_service_id', 'state', 'is_active']


class ExamProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamProduct
        fields = ['id', 'body', 'name', 'vtpass_variation_code', 'sell_price', 'is_active']


class ServiceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceConfig
        fields = ['service', 'is_enabled', 'maintenance_message', 'updated_at']


# ─── Purchase Request Serializers ─────────────────────────────────────────────

class BuyDataSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    phone = serializers.CharField(max_length=15)
    transaction_pin = serializers.CharField(min_length=4, max_length=4, write_only=True)
    gift_email = serializers.EmailField(required=False, allow_blank=True)
    quantity = serializers.IntegerField(default=1, min_value=1, max_value=50)

    def validate_phone(self, value):
        cleaned = value.replace(' ', '').replace('-', '')
        if len(cleaned) != 11 or not cleaned.isdigit():
            raise serializers.ValidationError('Enter a valid 11-digit phone number.')
        return cleaned

    def validate_transaction_pin(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('PIN must be digits only.')
        return value

    def validate_plan_id(self, value):
        if not DataPlan.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Selected data plan is not available.')
        return value


class BuyAirtimeSerializer(serializers.Serializer):
    network = serializers.ChoiceField(choices=['mtn', 'airtel', 'glo', '9mobile'])
    phone = serializers.CharField(max_length=15)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    transaction_pin = serializers.CharField(min_length=4, max_length=4, write_only=True)

    def validate_phone(self, value):
        cleaned = value.replace(' ', '').replace('-', '')
        if len(cleaned) != 11 or not cleaned.isdigit():
            raise serializers.ValidationError('Enter a valid 11-digit phone number.')
        return cleaned

    def validate_amount(self, value):
        if value < 50:
            raise serializers.ValidationError('Minimum airtime purchase is ₦50.')
        if value > 50000:
            raise serializers.ValidationError('Maximum airtime purchase is ₦50,000.')
        return value


class BuyElectricitySerializer(serializers.Serializer):
    disco_id = serializers.IntegerField()
    meter_number = serializers.CharField(max_length=20)
    meter_type = serializers.ChoiceField(choices=['prepaid', 'postpaid'])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    phone = serializers.CharField(max_length=15)
    transaction_pin = serializers.CharField(min_length=4, max_length=4, write_only=True)

    def validate_amount(self, value):
        if value < 1000:
            raise serializers.ValidationError('Minimum electricity purchase is ₦1,000.')
        if value > 100000:
            raise serializers.ValidationError('Maximum electricity purchase is ₦100,000.')
        return value

    def validate_phone(self, value):
        cleaned = value.replace(' ', '').replace('-', '')
        if len(cleaned) != 11:
            raise serializers.ValidationError('Enter a valid 11-digit phone number.')
        return cleaned


class BuyTVSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    smartcard_number = serializers.CharField(max_length=20)
    phone = serializers.CharField(max_length=15)
    transaction_pin = serializers.CharField(min_length=4, max_length=4, write_only=True)

    def validate_plan_id(self, value):
        if not TVPlan.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Selected TV plan is not available.')
        return value

    def validate_phone(self, value):
        cleaned = value.replace(' ', '').replace('-', '')
        if len(cleaned) != 11:
            raise serializers.ValidationError('Enter a valid 11-digit phone number.')
        return cleaned


class BuyExamPinSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    phone = serializers.CharField(max_length=15)
    email = serializers.EmailField()
    quantity = serializers.IntegerField(default=1, min_value=1, max_value=10)
    transaction_pin = serializers.CharField(min_length=4, max_length=4, write_only=True)

    def validate_product_id(self, value):
        if not ExamProduct.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Selected exam product is not available.')
        return value

    def validate_phone(self, value):
        cleaned = value.replace(' ', '').replace('-', '')
        if len(cleaned) != 11:
            raise serializers.ValidationError('Enter a valid 11-digit phone number.')
        return cleaned


class VerifyMeterSerializer(serializers.Serializer):
    meter_number = serializers.CharField(max_length=20)
    disco_id = serializers.IntegerField()
    meter_type = serializers.ChoiceField(choices=['prepaid', 'postpaid'])


class VerifySmartcardSerializer(serializers.Serializer):
    smartcard_number = serializers.CharField(max_length=20)
    provider_id = serializers.IntegerField()
