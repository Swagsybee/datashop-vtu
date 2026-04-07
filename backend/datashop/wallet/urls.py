from django.urls import path
from . import views

urlpatterns = [
    path('balance/', views.wallet_balance, name='wallet_balance'),
    path('fund/initiate/', views.InitiateFundingView.as_view(), name='initiate_funding'),
    path('fund/verify/<str:reference>/', views.VerifyFundingView.as_view(), name='verify_funding'),
    path('fund/history/', views.FundingHistoryView.as_view(), name='funding_history'),
    path('history/', views.WalletHistoryView.as_view(), name='wallet_history'),
    path('webhook/paystack/', views.PaystackWebhookView.as_view(), name='paystack_webhook'),
]
