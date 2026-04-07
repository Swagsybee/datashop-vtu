"""
Management command to seed all initial platform data.
Run once after first migration: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from services.models import DataPlan, TVProvider, TVPlan, ElectricityDisco, ExamProduct, ServiceConfig
from users.models import User


class Command(BaseCommand):
    help = 'Seeds the database with initial service data'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Seeding Datashop platform data...\n')
        self._seed_data_plans()
        self._seed_tv()
        self._seed_electricity()
        self._seed_exam()
        self._seed_service_configs()
        self._create_superadmin()
        self.stdout.write(self.style.SUCCESS('\n✅ All data seeded successfully!\n'))

    def _seed_data_plans(self):
        self.stdout.write('📶 Seeding data plans...')
        plans = [
            # MTN SME
            ('mtn','sme','MTN SME 500MB','mtn-sme-500mb',500,'500MB',7,'7 Days',270,349),
            ('mtn','sme','MTN SME 1GB','mtn-sme-1gb',1024,'1GB',7,'7 Days',340,440),
            ('mtn','sme','MTN SME 2GB','mtn-sme-2gb',2048,'2GB',30,'30 Days',620,800),
            ('mtn','sme','MTN SME 5GB','mtn-sme-5gb',5120,'5GB',30,'30 Days',1400,1800),
            ('mtn','sme','MTN SME 10GB','mtn-sme-10gb',10240,'10GB',30,'30 Days',2350,3000),
            ('mtn','sme','MTN SME 20GB','mtn-sme-20gb',20480,'20GB',30,'30 Days',4200,5500),
            # MTN Gifting
            ('mtn','gifting','MTN Gift 1GB','mtn-gift-1gb',1024,'1GB',7,'7 Days',370,480),
            ('mtn','gifting','MTN Gift 5GB','mtn-gift-5gb',5120,'5GB',30,'30 Days',1550,2000),
            # Airtel SME
            ('airtel','sme','Airtel 150MB','airtel-150mb',150,'150MB',1,'1 Day',35,48),
            ('airtel','sme','Airtel 300MB','airtel-300mb',300,'300MB',2,'2 Days',75,97),
            ('airtel','sme','Airtel 1GB','airtel-1gb',1024,'1GB',7,'7 Days',270,350),
            ('airtel','sme','Airtel 2GB','airtel-2gb',2048,'2GB',30,'30 Days',540,700),
            ('airtel','sme','Airtel 5GB','airtel-5gb',5120,'5GB',30,'30 Days',1160,1500),
            ('airtel','sme','Airtel 10GB','airtel-10gb',10240,'10GB',30,'30 Days',1930,2500),
            # Glo SME
            ('glo','sme','Glo 1GB Daily','glo-1gb-daily',1024,'1GB',2,'2 Days',230,300),
            ('glo','sme','Glo 3GB Daily','glo-3gb-daily',3072,'3GB',3,'3 Days',695,900),
            ('glo','sme','Glo 5GB Monthly','glo-5gb',5120,'5GB',30,'30 Days',1160,1500),
            ('glo','sme','Glo 10GB Monthly','glo-10gb',10240,'10GB',30,'30 Days',1930,2500),
            ('glo','sme','Glo 50GB Monthly','glo-50gb',51200,'50GB',30,'30 Days',6160,8000),
            # 9mobile SME
            ('9mobile','sme','9mobile 500MB','9mobile-500mb',500,'500MB',7,'7 Days',155,200),
            ('9mobile','sme','9mobile 1GB','9mobile-1gb',1024,'1GB',30,'30 Days',232,300),
            ('9mobile','sme','9mobile 2GB','9mobile-2gb',2048,'2GB',30,'30 Days',387,500),
            ('9mobile','sme','9mobile 5GB','9mobile-5gb',5120,'5GB',30,'30 Days',930,1200),
        ]
        created = 0
        for (net, vendor, name, vtpass_id, size_mb, size_disp, val_days,
             val_disp, buy_price, sell_price) in plans:
            _, c = DataPlan.objects.get_or_create(
                network=net, vendor_type=vendor, name=name,
                defaults={
                    'vtpass_id': vtpass_id, 'size_mb': size_mb, 'size_display': size_disp,
                    'validity_days': val_days, 'validity_display': val_disp,
                    'buy_price': buy_price, 'sell_price': sell_price,
                }
            )
            if c:
                created += 1
        self.stdout.write(f'   → {created} data plans created')

    def _seed_tv(self):
        self.stdout.write('📺 Seeding TV providers and plans...')
        providers_data = [
            ('DSTV', 'dstv', [
                ('DStv Padi', 'padi', 1, 2500),
                ('DStv Yanga', 'yanga', 1, 3500),
                ('DStv Confam', 'confam', 1, 6200),
                ('DStv Compact', 'compact', 1, 15700),
                ('DStv Compact Plus', 'compact-plus', 1, 25000),
                ('DStv Premium', 'premium', 1, 37000),
            ]),
            ('GOtv', 'gotv', [
                ('GOtv Smallie', 'smallie', 1, 1575),
                ('GOtv Jinja', 'jinja', 1, 2460),
                ('GOtv Jolli', 'jolli', 1, 4150),
                ('GOtv Max', 'max', 1, 6200),
                ('GOtv Supa', 'supa', 1, 9600),
            ]),
            ('Startimes', 'startimes', [
                ('Startimes Nova', 'nova', 1, 900),
                ('Startimes Basic', 'basic', 1, 1850),
                ('Startimes Smart', 'smart', 1, 2100),
                ('Startimes Classic', 'classic', 1, 2500),
            ]),
            ('Showmax', 'showmax', [
                ('Showmax Mobile', 'mobile', 1, 2900),
                ('Showmax Standard', 'standard', 1, 3600),
                ('Showmax Pro', 'pro', 1, 7200),
            ]),
        ]
        for prov_name, service_id, plans in providers_data:
            provider, _ = TVProvider.objects.get_or_create(
                name=prov_name, defaults={'vtpass_service_id': service_id}
            )
            for plan_name, var_code, duration, price in plans:
                TVPlan.objects.get_or_create(
                    provider=provider, name=plan_name,
                    defaults={'vtpass_variation_code': var_code, 'duration_months': duration, 'sell_price': price}
                )
        self.stdout.write('   → TV providers and plans created')

    def _seed_electricity(self):
        self.stdout.write('⚡ Seeding electricity DISCOs...')
        discos = [
            ('AEDC – Abuja Electric', 'aedc', 'aedc', 'FCT/Niger/Kogi/Nasarawa'),
            ('EKEDC – Eko Electric', 'ekedc', 'ekedc', 'Lagos (Eko)'),
            ('IKEDC – Ikeja Electric', 'ikedc', 'ikeja-electric', 'Lagos (Ikeja)'),
            ('PHEDC – PortHarcourt Electric', 'phedc', 'phed', 'Rivers/Bayelsa/AkwaIbom/Cross River'),
            ('IBEDC – Ibadan Electric', 'ibedc', 'ibedc', 'Oyo/Ogun/Osun/Kwara'),
            ('EEDC – Enugu Electric', 'eedc', 'enugu-electric', 'Enugu/Anambra/Imo/Abia/Ebonyi'),
            ('BEDC – Benin Electric', 'bedc', 'bedc', 'Edo/Delta/Ekiti/Ondo'),
            ('KAEDCO – Kaduna Electric', 'kaedco', 'kaduna-electric', 'Kaduna/Kebbi/Sokoto/Zamfara'),
            ('JEDC – Jos Electric', 'jedc', 'jos-electric', 'Plateau/Benue/Gombe/Bauchi/Yobe/Adamawa'),
            ('YEDC – Yola Electric', 'yedc', 'yola-electric', 'Adamawa/Taraba'),
            ('ASEDC – Aba Electric', 'asedc', 'aba-electric', 'Aba/Abia'),
        ]
        created = 0
        for name, code, service_id, state in discos:
            _, c = ElectricityDisco.objects.get_or_create(
                code=code, defaults={'name': name, 'vtpass_service_id': service_id, 'state': state}
            )
            if c:
                created += 1
        self.stdout.write(f'   → {created} DISCOs created')

    def _seed_exam(self):
        self.stdout.write('📝 Seeding exam products...')
        products = [
            ('waec', 'WAEC Result Checker', 'waec-result-checker', 3000),
            ('waec', 'WAEC Direct Registration', 'waec-registration', 22000),
            ('jamb', 'JAMB UTME e-PIN', 'jamb-utme', 3500),
            ('jamb', 'JAMB DE e-PIN', 'jamb-de', 3500),
            ('neco', 'NECO Result Checker', 'neco-result-checker', 2500),
            ('nabteb', 'NABTEB Result Checker', 'nabteb-result-checker', 2000),
        ]
        created = 0
        for body, name, code, price in products:
            _, c = ExamProduct.objects.get_or_create(
                body=body, name=name,
                defaults={'vtpass_variation_code': code, 'sell_price': price}
            )
            if c:
                created += 1
        self.stdout.write(f'   → {created} exam products created')

    def _seed_service_configs(self):
        self.stdout.write('⚙️  Seeding service configs...')
        for service, _ in ServiceConfig.SERVICE_CHOICES:
            ServiceConfig.objects.get_or_create(service=service, defaults={'is_enabled': True})
        self.stdout.write('   → Service configs created')

    def _create_superadmin(self):
        self.stdout.write('👤 Creating superadmin...')
        if not User.objects.filter(email='admin@datashop.ng').exists():
            User.objects.create_superuser(
                email='admin@datashop.ng',
                phone='08000000000',
                password='Admin@datashop123',
                first_name='Super',
                last_name='Admin',
            )
            self.stdout.write(self.style.WARNING(
                '   → Superadmin created: admin@datashop.ng / Admin@datashop123\n'
                '   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!'
            ))
        else:
            self.stdout.write('   → Superadmin already exists')
        if not User.objects.filter(email='demo@datashop.ng').exists():
            demo = User.objects.create_user(
                email='demo@datashop.ng',
                phone='08012345678',
                password='demo1234',
                first_name='John',
                last_name='Doe',
            )
            demo.wallet_balance = 5000
            demo.save()
            demo.set_transaction_pin('1234')
            self.stdout.write('   → Demo user created: demo@datashop.ng / demo1234 (PIN: 1234)')
