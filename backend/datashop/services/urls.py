from django.urls import path
from . import views

urlpatterns = [
    # Catalogue
    path('data/plans/', views.DataPlansView.as_view(), name='data_plans'),
    path('tv/providers/', views.TVProvidersView.as_view(), name='tv_providers'),
    path('electricity/discos/', views.ElectricityDiscosView.as_view(), name='electricity_discos'),
    path('exam/products/', views.ExamProductsView.as_view(), name='exam_products'),
    path('status/', views.service_status, name='service_status'),
    # Verify
    path('electricity/verify-meter/', views.VerifyMeterView.as_view(), name='verify_meter'),
    path('tv/verify-smartcard/', views.VerifySmartcardView.as_view(), name='verify_smartcard'),
    # Purchase
    path('data/buy/', views.BuyDataView.as_view(), name='buy_data'),
    path('airtime/buy/', views.BuyAirtimeView.as_view(), name='buy_airtime'),
    path('electricity/buy/', views.BuyElectricityView.as_view(), name='buy_electricity'),
    path('tv/buy/', views.BuyTVView.as_view(), name='buy_tv'),
    path('exam/buy/', views.BuyExamPinView.as_view(), name='buy_exam'),
]
