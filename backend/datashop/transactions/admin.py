from django.contrib import admin
from .models import Transaction, ScheduledTransaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference', 'user', 'type', 'service_provider', 'amount', 'status', 'created_at']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['reference', 'external_reference', 'user__email', 'user__phone']
    readonly_fields = ['id', 'reference', 'created_at', 'updated_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    actions = ['mark_refunded']

    def mark_refunded(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='refunded', refunded_at=timezone.now())
        self.message_user(request, f'{queryset.count()} transactions marked as refunded.')
    mark_refunded.short_description = 'Mark selected as Refunded'


@admin.register(ScheduledTransaction)
class ScheduledTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'amount', 'scheduled_at', 'recurrence', 'status']
    list_filter = ['type', 'status', 'recurrence']
    search_fields = ['user__email']
