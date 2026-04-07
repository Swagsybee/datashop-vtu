import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger('datashop')


def create_notification(user, type, title, message, data=None):
    from .models import Notification
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        data=data or {}
    )


def send_welcome_email(user):
    try:
        send_mail(
            subject=f'Welcome to {settings.PLATFORM_NAME}!',
            message=f'Hi {user.first_name},\n\nYour account has been created successfully.\n\nReferral Code: {user.referral_code}\n\nBest regards,\n{settings.PLATFORM_NAME} Team',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True
        )
    except Exception as e:
        logger.error(f'Failed to send welcome email to {user.email}: {e}')


def send_transaction_email(user, transaction):
    try:
        status_emoji = '✅' if transaction.status == 'success' else '❌'
        send_mail(
            subject=f'{status_emoji} {settings.PLATFORM_NAME} Transaction {transaction.status.title()}',
            message=f'Hi {user.first_name},\n\nYour {transaction.get_type_display()} transaction of ₦{transaction.amount:,.2f} was {transaction.status}.\n\nReference: {transaction.reference}\n\nBest regards,\n{settings.PLATFORM_NAME} Team',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True
        )
    except Exception as e:
        logger.error(f'Failed to send transaction email: {e}')


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
