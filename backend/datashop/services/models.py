from django.db import models


class DataPlan(models.Model):
    NETWORK_CHOICES = [
        ('mtn', 'MTN'),
        ('airtel', 'Airtel'),
        ('glo', 'Glo'),
        ('9mobile', '9mobile'),
    ]
    VENDOR_CHOICES = [
        ('sme', 'SME'),
        ('gifting', 'Gifting'),
        ('corporate_gifting', 'Corporate Gifting'),
        ('corporate', 'Corporate'),
        ('reseller', 'Reseller'),
    ]

    network = models.CharField(max_length=20, choices=NETWORK_CHOICES)
    vendor_type = models.CharField(max_length=30, choices=VENDOR_CHOICES, default='sme')
    name = models.CharField(max_length=100)
    vtpass_id = models.CharField(max_length=100, blank=True)  # VTpass service/variation code
    size_mb = models.PositiveIntegerField()  # size in MB for sorting
    size_display = models.CharField(max_length=20)  # e.g. "1GB", "500MB"
    validity_days = models.PositiveIntegerField()
    validity_display = models.CharField(max_length=30)
    buy_price = models.DecimalField(max_digits=10, decimal_places=2)   # cost to us
    sell_price = models.DecimalField(max_digits=10, decimal_places=2)  # charged to user
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'data_plans'
        ordering = ['network', 'vendor_type', 'size_mb']
        unique_together = ['network', 'vendor_type', 'name']

    def __str__(self):
        return f'{self.get_network_display()} {self.size_display} - ₦{self.sell_price}'

    @property
    def profit_margin(self):
        if self.buy_price > 0:
            return round(((self.sell_price - self.buy_price) / self.sell_price) * 100, 2)
        return 0


class TVProvider(models.Model):
    name = models.CharField(max_length=50)  # DSTV, GOtv, Startimes, Showmax
    vtpass_service_id = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='tv_providers/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'tv_providers'

    def __str__(self):
        return self.name


class TVPlan(models.Model):
    provider = models.ForeignKey(TVProvider, on_delete=models.CASCADE, related_name='plans')
    name = models.CharField(max_length=100)
    vtpass_variation_code = models.CharField(max_length=100)
    duration_months = models.PositiveIntegerField(default=1)
    sell_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'tv_plans'
        ordering = ['provider', 'sell_price']

    def __str__(self):
        return f'{self.provider.name} {self.name} - ₦{self.sell_price}'


class ElectricityDisco(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    vtpass_service_id = models.CharField(max_length=100)
    state = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'electricity_discos'
        ordering = ['name']

    def __str__(self):
        return self.name


class ExamProduct(models.Model):
    BODY_CHOICES = [
        ('waec', 'WAEC'),
        ('jamb', 'JAMB'),
        ('neco', 'NECO'),
        ('nabteb', 'NABTEB'),
    ]

    body = models.CharField(max_length=20, choices=BODY_CHOICES)
    name = models.CharField(max_length=100)
    vtpass_variation_code = models.CharField(max_length=100)
    sell_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'exam_products'
        ordering = ['body', 'sell_price']

    def __str__(self):
        return f'{self.get_body_display()} - {self.name} ₦{self.sell_price}'


class ServiceConfig(models.Model):
    """Global on/off switches for each service type."""
    SERVICE_CHOICES = [
        ('data', 'Data Bundles'),
        ('airtime', 'Airtime'),
        ('electricity', 'Electricity'),
        ('tv', 'TV Subscription'),
        ('exam', 'Exam Pins'),
    ]

    service = models.CharField(max_length=20, choices=SERVICE_CHOICES, unique=True)
    is_enabled = models.BooleanField(default=True)
    maintenance_message = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service_configs'

    def __str__(self):
        return f'{self.get_service_display()} - {"ON" if self.is_enabled else "OFF"}'
