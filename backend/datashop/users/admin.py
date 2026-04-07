from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Notification, LoginLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'phone', 'role', 'wallet_balance', 'is_active', 'is_suspended', 'created_at']
    list_filter = ['role', 'is_active', 'is_suspended', 'is_verified', 'created_at']
    search_fields = ['email', 'phone', 'first_name', 'last_name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'referral_code', 'created_at', 'updated_at', 'last_login']

    fieldsets = (
        ('Account', {'fields': ('id', 'email', 'password', 'role')}),
        ('Personal', {'fields': ('first_name', 'last_name', 'phone', 'date_of_birth', 'gender', 'avatar')}),
        ('Wallet', {'fields': ('wallet_balance', 'referral_code', 'referred_by', 'referral_bonus_earned')}),
        ('Security', {'fields': ('transaction_pin', 'pin_set', 'failed_pin_attempts', 'pin_locked_until')}),
        ('Status', {'fields': ('is_active', 'is_suspended', 'suspension_reason', 'is_verified', 'is_staff', 'is_superuser')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'last_login')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    actions = ['suspend_users', 'activate_users', 'fund_wallets']

    def suspend_users(self, request, queryset):
        queryset.update(is_suspended=True, is_active=False)
        self.message_user(request, f'{queryset.count()} users suspended.')
    suspend_users.short_description = 'Suspend selected users'

    def activate_users(self, request, queryset):
        queryset.update(is_suspended=False, is_active=True)
        self.message_user(request, f'{queryset.count()} users activated.')
    activate_users.short_description = 'Activate selected users'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read']
    search_fields = ['user__email', 'title']


@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'success', 'created_at']
    list_filter = ['success']
    search_fields = ['user__email', 'ip_address']
