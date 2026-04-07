from django.contrib import admin
from .models import WalletFunding, WalletTransaction


@admin.register(WalletFunding)
class WalletFundingAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'paystack_reference', 'status', 'channel', 'created_at']
    list_filter = ['status', 'channel']
    search_fields = ['user__email', 'paystack_reference']
    readonly_fields = ['id', 'paystack_reference', 'paystack_access_code', 'authorization_url', 'created_at', 'updated_at']


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'amount', 'balance_before', 'balance_after', 'description', 'created_at']
    list_filter = ['type']
    search_fields = ['user__email', 'description', 'reference']
    readonly_fields = ['id', 'created_at']
