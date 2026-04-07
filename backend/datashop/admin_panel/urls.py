from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('stats/', views.AdminStatsView.as_view(), name='admin_stats'),
    path('activity/', views.admin_activity_log, name='admin_activity'),
    path('wallet-stats/', views.admin_wallet_stats, name='admin_wallet_stats'),
    # Users
    path('users/', views.AdminUserListView.as_view(), name='admin_users'),
    path('users/<uuid:pk>/', views.AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('users/create/', views.AdminCreateUserView.as_view(), name='admin_create_user'),
    path('users/fund/', views.AdminFundUserView.as_view(), name='admin_fund_user'),
    path('users/suspend/', views.AdminSuspendUserView.as_view(), name='admin_suspend_user'),
    path('users/<uuid:pk>/activate/', views.AdminActivateUserView.as_view(), name='admin_activate_user'),
    # Transactions
    path('transactions/', views.AdminTransactionListView.as_view(), name='admin_transactions'),
    path('transactions/<uuid:pk>/refund/', views.AdminRefundView.as_view(), name='admin_refund'),
    # Services
    path('services/<str:service>/toggle/', views.AdminToggleServiceView.as_view(), name='admin_toggle_service'),
    path('rates/update/', views.AdminUpdateDataRateView.as_view(), name='admin_update_rate'),
]
