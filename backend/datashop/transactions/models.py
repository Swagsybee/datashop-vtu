import uuid
import random
import string
from django.db import models
from django.conf import settings


def generate_reference():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=10))
    return f'DSH-{suffix}'


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('data', 'Data Bundle'),
        ('airtime', 'Airtime'),
        ('electricity', 'Electricity'),
        ('tv', 'TV Subscription'),
        ('exam', 'Exam Pin'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    service_provider = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference = models.CharField(max_length=50, unique=True, default=generate_reference)
    external_reference = models.CharField(max_length=200, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['reference']),
            models.Index(fields=['type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.reference} | {self.user.email} | {self.type} | ₦{self.amount} | {self.status}'

    @property
    def type_icon(self):
        icons = {'data': '📶', 'airtime': '📞', 'electricity': '⚡', 'tv': '📺', 'exam': '📝'}
        return icons.get(self.type, '💸')


class ScheduledTransaction(models.Model):
    RECURRENCE_CHOICES = [
        ('once', 'One Time'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('executed', 'Executed'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scheduled_transactions')
    type = models.CharField(max_length=20, choices=Transaction.TYPE_CHOICES)
    payload = models.JSONField()  # Full purchase payload
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    scheduled_at = models.DateTimeField()
    recurrence = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, default='once')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_executed_at = models.DateTimeField(null=True, blank=True)
    execution_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'scheduled_transactions'
        ordering = ['scheduled_at']

    def __str__(self):
        return f'{self.user.email} {self.type} scheduled {self.scheduled_at}'
