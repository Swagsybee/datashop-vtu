from django.urls import path
from . import views

urlpatterns = [
    path('', views.TransactionListView.as_view(), name='transaction_list'),
    path('<uuid:pk>/', views.TransactionDetailView.as_view(), name='transaction_detail'),
    path('stats/', views.transaction_stats, name='transaction_stats'),
    path('scheduled/', views.ScheduledTransactionListView.as_view(), name='scheduled_list'),
    path('scheduled/<uuid:pk>/cancel/', views.cancel_scheduled, name='cancel_scheduled'),
]
