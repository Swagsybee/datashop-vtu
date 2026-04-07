# Datashop VTU Platform — Django Backend

Production-ready REST API for a Nigerian VTU (Virtual Top-Up) platform.

## Stack
- **Framework**: Django 5.0 + Django REST Framework
- **Auth**: JWT (djangorestframework-simplejwt)
- **Database**: SQLite (dev) → PostgreSQL via Supabase (production)
- **Payments**: Paystack
- **VTU Provider**: VTpass
- **Deploy**: Render.com

---

## Quick Start (Local)

```bash
# 1. Clone and enter project
cd datashop

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env .env.local
# Edit .env with your Paystack and VTpass keys

# 5. Run migrations
python manage.py migrate

# 6. Seed initial data (plans, DISCOs, exam products, admin user)
python manage.py seed_data

# 7. Start server
python manage.py runserver
```

**API is now running at:** `http://localhost:8000`

---

## Demo Credentials

| Role       | Email                  | Password          | PIN  |
|------------|------------------------|-------------------|------|
| Super Admin| admin@datashop.ng      | Admin@datashop123 | N/A  |
| Demo User  | demo@datashop.ng       | demo1234          | 1234 |

**⚠️ Change admin password immediately in production!**

---

## API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| POST   | `register/`           | No   | Create new account       |
| POST   | `login/`              | No   | Login, get JWT tokens    |
| POST   | `logout/`             | Yes  | Blacklist refresh token  |
| POST   | `token/refresh/`      | No   | Refresh access token     |
| GET    | `profile/`            | Yes  | Get user profile         |
| PATCH  | `profile/`            | Yes  | Update profile           |
| POST   | `change-password/`    | Yes  | Change password          |
| POST   | `pin/set/`            | Yes  | Set transaction PIN      |
| POST   | `pin/change/`         | Yes  | Change transaction PIN   |
| GET    | `notifications/`      | Yes  | List notifications       |
| POST   | `notifications/read/` | Yes  | Mark all as read         |
| GET    | `dashboard/`          | Yes  | Full dashboard summary   |

### Wallet (`/api/wallet/`)
| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| GET    | `balance/`                  | Yes  | Get wallet balance       |
| POST   | `fund/initiate/`            | Yes  | Start Paystack payment   |
| GET    | `fund/verify/<reference>/`  | Yes  | Verify payment status    |
| POST   | `webhook/paystack/`         | No   | Paystack webhook handler |
| GET    | `fund/history/`             | Yes  | Funding history          |
| GET    | `history/`                  | Yes  | Wallet transaction log   |

### Services (`/api/services/`)
| Method | Endpoint                          | Auth | Description               |
|--------|-----------------------------------|------|---------------------------|
| GET    | `data/plans/?network=mtn`         | Yes  | List data plans           |
| GET    | `tv/providers/`                   | Yes  | TV providers + plans      |
| GET    | `electricity/discos/`             | Yes  | All DISCOs                |
| GET    | `exam/products/?body=waec`        | Yes  | Exam products             |
| GET    | `status/`                         | Yes  | Service on/off status     |
| POST   | `electricity/verify-meter/`       | Yes  | Verify meter number       |
| POST   | `tv/verify-smartcard/`            | Yes  | Verify TV smartcard       |
| POST   | `data/buy/`                       | Yes  | Purchase data bundle      |
| POST   | `airtime/buy/`                    | Yes  | Purchase airtime          |
| POST   | `electricity/buy/`                | Yes  | Buy electricity token     |
| POST   | `tv/buy/`                         | Yes  | TV subscription           |
| POST   | `exam/buy/`                       | Yes  | Buy exam pin              |

### Transactions (`/api/transactions/`)
| Method | Endpoint                        | Auth | Description               |
|--------|---------------------------------|------|---------------------------|
| GET    | `/`                             | Yes  | List user transactions    |
| GET    | `<id>/`                         | Yes  | Transaction detail        |
| GET    | `stats/`                        | Yes  | Transaction statistics    |
| GET    | `scheduled/`                    | Yes  | List scheduled payments   |
| POST   | `scheduled/`                    | Yes  | Create scheduled payment  |
| DELETE | `scheduled/<id>/cancel/`        | Yes  | Cancel scheduled payment  |

### Admin (`/api/admin/`) — Requires admin role
| Method | Endpoint                           | Role       | Description             |
|--------|------------------------------------|------------|-------------------------|
| GET    | `stats/`                           | Admin      | Platform statistics     |
| GET    | `activity/`                        | Admin      | Activity log            |
| GET    | `users/`                           | Admin/Ops  | All users list          |
| POST   | `users/create/`                    | Admin/Ops  | Create user             |
| POST   | `users/fund/`                      | Admin/Fin  | Fund user wallet        |
| POST   | `users/suspend/`                   | Admin/Ops  | Suspend user            |
| POST   | `users/<id>/activate/`             | Admin/Ops  | Activate user           |
| GET    | `transactions/`                    | Admin/Fin  | All transactions        |
| POST   | `transactions/<id>/refund/`        | Admin/Fin  | Refund transaction      |
| POST   | `services/<service>/toggle/`       | Admin      | Enable/disable service  |
| POST   | `rates/update/`                    | SuperAdmin | Update data rates       |

---

## Request/Response Examples

### Register
```json
POST /api/auth/register/
{
  "email": "user@example.com",
  "phone": "08012345678",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123",
  "password2": "SecurePass123",
  "referral_code": "DSH-ABC123"
}
```

### Buy Airtime
```json
POST /api/services/airtime/buy/
Authorization: Bearer <token>
{
  "network": "mtn",
  "phone": "08012345678",
  "amount": 500,
  "transaction_pin": "1234"
}
```

### Fund Wallet (Paystack)
```json
POST /api/wallet/fund/initiate/
Authorization: Bearer <token>
{
  "amount": 5000,
  "callback_url": "https://yourapp.com/wallet/callback"
}
// Returns: authorization_url to redirect user to Paystack
```

---

## Deploy to Render

1. Push to GitHub
2. Go to render.com → New Web Service
3. Connect your repo
4. Set environment variables (from `.env`)
5. Build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py seed_data`
6. Start command: `gunicorn core.wsgi:application`

---

## Project Structure
```
datashop/
├── core/               # Django project settings + root URLs
├── users/              # Auth, profiles, notifications, PIN
├── wallet/             # Funding, Paystack webhook, balance
├── services/           # Data plans, VTpass integration, all purchases
├── transactions/       # Transaction history, scheduled payments
├── admin_panel/        # Admin-only stats, user management, rates
├── requirements.txt
├── render.yaml         # Render deployment config
├── Procfile
└── .env                # Environment variables (never commit this)
```

---

## Security Notes
- JWT access tokens expire in 24 hours, refresh tokens in 30 days
- Transaction PIN is bcrypt-hashed — never stored plain
- PIN locks after 5 failed attempts for 30 minutes
- Paystack webhook signature verified before any wallet credit
- Wallet balance uses database-level row locking (SELECT FOR UPDATE)
- All money operations are wrapped in atomic transactions
- Insufficient funds check happens before any VTU API call
- Refund is automatic if VTU API call fails after wallet debit

---

## Next Steps
1. ✅ Django backend (done)
2. ⏳ React frontend → Vercel
3. ⏳ Supabase PostgreSQL (swap DATABASE_URL)
4. ⏳ Connect real Paystack live keys
5. ⏳ Connect real VTpass production keys
6. ⏳ Custom domain
