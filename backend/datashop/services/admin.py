from django.contrib import admin
from .models import DataPlan, TVProvider, TVPlan, ElectricityDisco, ExamProduct, ServiceConfig


@admin.register(DataPlan)
class DataPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'network', 'vendor_type', 'size_display', 'buy_price', 'sell_price', 'profit_margin', 'is_active']
    list_filter = ['network', 'vendor_type', 'is_active']
    search_fields = ['name', 'vtpass_id']
    list_editable = ['buy_price', 'sell_price', 'is_active']
    ordering = ['network', 'vendor_type', 'size_mb']


@admin.register(TVProvider)
class TVProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'vtpass_service_id', 'is_active']
    list_editable = ['is_active']


@admin.register(TVPlan)
class TVPlanAdmin(admin.ModelAdmin):
    list_display = ['provider', 'name', 'sell_price', 'is_active']
    list_filter = ['provider', 'is_active']
    list_editable = ['sell_price', 'is_active']


@admin.register(ElectricityDisco)
class ElectricityDiscoAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'state', 'vtpass_service_id', 'is_active']
    list_editable = ['is_active']


@admin.register(ExamProduct)
class ExamProductAdmin(admin.ModelAdmin):
    list_display = ['body', 'name', 'sell_price', 'is_active']
    list_editable = ['sell_price', 'is_active']


@admin.register(ServiceConfig)
class ServiceConfigAdmin(admin.ModelAdmin):
    list_display = ['service', 'is_enabled', 'updated_at']
    list_editable = ['is_enabled']
