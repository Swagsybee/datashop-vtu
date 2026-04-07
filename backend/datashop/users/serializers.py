from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Notification


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    referral_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'phone', 'first_name', 'last_name', 'password', 'password2', 'referral_code']

    def validate_phone(self, value):
        cleaned = value.replace(' ', '').replace('-', '').replace('+234', '0')
        if len(cleaned) != 11:
            raise serializers.ValidationError('Enter a valid 11-digit Nigerian phone number.')
        if not cleaned.startswith('0'):
            raise serializers.ValidationError('Phone number must start with 0.')
        if User.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError('Phone number already registered.')
        return cleaned

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        referral_code_input = validated_data.pop('referral_code', None)
        validated_data.pop('password2')
        password = validated_data.pop('password')

        referred_by = None
        if referral_code_input:
            try:
                referred_by = User.objects.get(referral_code=referral_code_input.upper())
            except User.DoesNotExist:
                pass

        user = User.objects.create_user(
            **validated_data,
            password=password,
            referred_by=referred_by
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password')
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        if user.is_suspended:
            raise serializers.ValidationError(f'Account suspended. Reason: {user.suspension_reason}')
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    initials = serializers.ReadOnlyField()
    total_transactions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name', 'full_name',
            'initials', 'role', 'wallet_balance', 'referral_code',
            'referral_bonus_earned', 'date_of_birth', 'gender', 'avatar',
            'pin_set', 'is_active', 'is_suspended', 'is_verified',
            'total_transactions', 'created_at',
        ]
        read_only_fields = [
            'id', 'email', 'role', 'wallet_balance', 'referral_code',
            'referral_bonus_earned', 'pin_set', 'is_active', 'is_suspended',
            'is_verified', 'created_at',
        ]

    def get_total_transactions(self, obj):
        return obj.transactions.filter(status='success').count()


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'gender']

    def validate_phone(self, value):
        cleaned = value.replace(' ', '').replace('-', '')
        if len(cleaned) != 11:
            raise serializers.ValidationError('Enter a valid 11-digit phone number.')
        # Check uniqueness excluding self
        if User.objects.filter(phone=cleaned).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError('Phone number already in use.')
        return cleaned


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


class SetPinSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=4, max_length=4)
    pin2 = serializers.CharField(min_length=4, max_length=4)
    password = serializers.CharField(write_only=True)

    def validate_pin(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('PIN must be 4 digits.')
        return value

    def validate(self, attrs):
        if attrs['pin'] != attrs['pin2']:
            raise serializers.ValidationError({'pin': 'PINs do not match.'})
        user = self.context['request'].user
        if not user.check_password(attrs['password']):
            raise serializers.ValidationError({'password': 'Password is incorrect.'})
        return attrs


class ChangePinSerializer(serializers.Serializer):
    old_pin = serializers.CharField(min_length=4, max_length=4)
    new_pin = serializers.CharField(min_length=4, max_length=4)
    new_pin2 = serializers.CharField(min_length=4, max_length=4)

    def validate_new_pin(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('PIN must be 4 digits.')
        return value

    def validate(self, attrs):
        if attrs['new_pin'] != attrs['new_pin2']:
            raise serializers.ValidationError({'new_pin': 'PINs do not match.'})
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'data', 'created_at']
        read_only_fields = ['id', 'created_at']


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_transactions = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name', 'full_name',
            'role', 'wallet_balance', 'referral_code', 'referral_bonus_earned',
            'is_active', 'is_suspended', 'suspension_reason', 'is_verified',
            'pin_set', 'total_transactions', 'total_spent', 'created_at',
        ]

    def get_total_transactions(self, obj):
        return obj.transactions.count()

    def get_total_spent(self, obj):
        from django.db.models import Sum
        result = obj.transactions.filter(status='success').aggregate(total=Sum('amount'))
        return result['total'] or 0
