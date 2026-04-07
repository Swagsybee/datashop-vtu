# Datashop VTU – React Frontend

Production-ready React app for the Datashop VTU Platform.

## Stack
- React 18 + Vite
- React Router v6
- TanStack Query (server state)
- Zustand (client state)
- Tailwind CSS v3
- React Hook Form
- Axios (with JWT auto-refresh)
- Recharts (admin charts)
- React Hot Toast

## Quick Start

```bash
npm install
cp .env .env.local
# Set VITE_API_URL to your Django backend URL
npm run dev
```

## Demo Credentials
- **User**: demo@datashop.ng / demo1234 (PIN: 1234)
- **Admin**: admin@datashop.ng / Admin@datashop123

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable in Vercel dashboard:
# VITE_API_URL = https://your-render-app.onrender.com/api
```

## Pages Built
- ✅ Login / Register
- ✅ Dashboard (wallet banner, services, quick buy, recent transactions)
- ✅ Data Bundles (vendor flow → network → plan → buy)
- ✅ Airtime (all networks, quick amounts)
- ✅ Electricity (meter verify → buy → token display)
- ✅ TV Subscription (smartcard verify → plan select → subscribe)
- ✅ Exam Pins (body → product → email delivery)
- ✅ Transactions (filter, search, detail view)
- ✅ Profile (edit, bank info, PIN set/change)
- ✅ Referrals (code, share link, how-it-works)
- ✅ Settings (notification toggles, security, logout)
- ✅ Admin Dashboard (charts, recent tx, activity)
- ✅ Admin Users (list, search, fund wallet, suspend/activate)
