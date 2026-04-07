import logging
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from .models import User, Notification, LoginLog
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer,
    SetPinSerializer, ChangePinSerializer, NotificationSerializer,
)
from .utils import create_notification, send_welcome_email, get_client_ip

logger = logging.getLogger('datashop')


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create welcome notification
            create_notification(
                user,
                type='system',
                title='Welcome to Datashop! 🎉',
                message='Your account is ready. Fund your wallet to start buying data, airtime and more.'
            )
            # Grant referral bonus if applicable
            if user.referred_by:
                from django.conf import settings
                bonus = settings.REFERRAL_BONUS_AMOUNT
                referrer = user.referred_by
                referrer.wallet_balance += bonus
                referrer.referral_bonus_earned += bonus
                referrer.save(update_fields=['wallet_balance', 'referral_bonus_earned'])
                create_notification(
                    referrer,
                    type='wallet',
                    title='Referral Bonus Earned! 💰',
                    message=f'You earned ₦{bonus:,} for referring {user.full_name}.'
                )
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            # Send welcome email
            send_welcome_email(user)
            logger.info(f'New user registered: {user.email}')
            return Response({
                'message': 'Account created successfully.',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            # Log login
            LoginLog.objects.create(
                user=user,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=True
            )
            logger.info(f'User logged in: {user.email}')
            return Response({
                'message': 'Login successful.',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })
        # Log failed attempt
        logger.warning(f'Failed login for: {request.data.get("email", "unknown")}')
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            logger.info(f'User logged out: {request.user.email}')
            return Response({'message': 'Logged out successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        response = super().update(request, *args, **kwargs)
        return Response({
            'message': 'Profile updated successfully.',
            'user': UserProfileSerializer(request.user).data
        })


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            create_notification(
                request.user,
                type='security',
                title='Password Changed',
                message='Your password was changed successfully. If this was not you, contact support immediately.'
            )
            return Response({'message': 'Password changed successfully.'})
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class SetPinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SetPinSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_transaction_pin(serializer.validated_data['pin'])
            create_notification(
                request.user,
                type='security',
                title='Transaction PIN Set',
                message='Your 4-digit transaction PIN has been set successfully.'
            )
            return Response({'message': 'Transaction PIN set successfully.'})
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ChangePinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.pin_set:
            return Response({'error': 'PIN not set. Use /auth/pin/set/ first.'}, status=400)
        serializer = ChangePinSerializer(data=request.data)
        if serializer.is_valid():
            try:
                verified = user.verify_transaction_pin(serializer.validated_data['old_pin'])
            except ValueError as e:
                return Response({'error': str(e)}, status=400)
            if not verified:
                return Response({'error': 'Current PIN is incorrect.'}, status=400)
            user.set_transaction_pin(serializer.validated_data['new_pin'])
            create_notification(
                user,
                type='security',
                title='Transaction PIN Changed',
                message='Your transaction PIN was changed. Contact support if this was not you.'
            )
            return Response({'message': 'PIN changed successfully.'})
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class NotificationsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Returns all data needed for the dashboard in one call."""
    user = request.user
    from django.db.models import Sum, Count
    from transactions.models import Transaction

    tx_stats = Transaction.objects.filter(user=user).aggregate(
        total_count=Count('id'),
        success_count=Count('id', filter=models.Q(status='success')),
        total_spent=Sum('amount', filter=models.Q(status='success')),
    )

    recent_tx = Transaction.objects.filter(user=user).order_by('-created_at')[:5]
    from transactions.serializers import TransactionSerializer

    unread_notifs = Notification.objects.filter(user=user, is_read=False).count()

    return Response({
        'wallet_balance': str(user.wallet_balance),
        'total_spent': str(tx_stats['total_spent'] or 0),
        'total_transactions': tx_stats['total_count'] or 0,
        'success_transactions': tx_stats['success_count'] or 0,
        'referral_bonus_earned': str(user.referral_bonus_earned),
        'unread_notifications': unread_notifs,
        'recent_transactions': TransactionSerializer(recent_tx, many=True).data,
    })


# Missing import fix

