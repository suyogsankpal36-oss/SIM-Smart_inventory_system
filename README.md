# Smart Business Management Software

Manage Products, Inventory, Customers, Sales & Business Reports in One Place.

A full-stack business management system for small and medium businesses, built with
**Django REST Framework + MySQL** on the backend and **React (Vite)** on the frontend.

This project is being built **phase by phase**, following the MVP plan (P0 → P1 → P2).
This delivery contains **Phase 1 (Project Setup)** and **Phase 2-3 (Database Design +
Django Models)**. See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for the full ER
overview and table-by-table field reference. REST APIs, auth, and UI pages are added in
the phases that follow.

## Project Structure

```
smart-business/
├── backend/
│   ├── manage.py
│   ├── config/                  # settings, root urls, wsgi/asgi
│   ├── apps/
│   │   ├── accounts/            # users, auth, roles (Phase 5, 19)
│   │   ├── products/            # products, categories & barcode/QR engine (Phase 8, 22)
│   │   ├── inventory/           # stock, inventory transactions (Phase 9)
│   │   ├── customers/           # customers (Phase 10)
│   │   ├── sales/               # POS, orders, invoices & scanner integration (Phase 11-12, 22)
│   │   ├── expenses/            # expense tracking (Phase 13)
│   │   ├── suppliers/           # suppliers & vendor ledger (Phase 18)
│   │   ├── notifications/       # low-stock & payment alerts (Phase 20)
│   │   ├── audit_logs/          # system audit trail (Phase 21)
│   │   ├── reports/             # sales/inventory/expense/profit reports (Phase 15)
│   │   ├── dashboard/           # dashboard aggregate API (Phase 7)
│   │   └── settings_app/        # business settings (Phase 17)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── layouts/
    │   ├── services/             # api.js — axios client
    │   ├── context/              # AuthContext.jsx
    │   ├── hooks/
    │   ├── utils/
    │   ├── routes/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

## Technology Stack

**Frontend:** React 18, Vite, React Router, Axios, React Hook Form, Recharts, Lucide icons
**Backend:** Django 5, Django REST Framework, SimpleJWT, django-cors-headers, django-filter
**Database:** MySQL (SQLite fallback available for quick local testing — set `DB_ENGINE=sqlite`)

## Quick Start

You can start both backend and frontend servers with a single click:
- Run `start_dev.bat` from the root directory.
- Or start them individually using `run_backend.bat` and `run_frontend.bat`.

### Default Admin Credentials
- **URL:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
- **Username:** `admin`
- **Password:** `admin123`
- **Database:** `smart_inventory_db` (MySQL on port 3306)

## Setup

### Backend

```bash
cd backend
# Database and migrations are already configured for smart_inventory_db
python manage.py runserver
```

All models (User with roles, Category, Product, InventoryTransaction, Customer, Order,
OrderItem, Invoice, Expense, BusinessSettings) are registered in the Django admin at
`/admin/`, so you can create records by hand and sanity-check the schema before the REST
API phase connects the frontend.

> **Note on `mysqlclient`:** it requires MySQL's C client headers to build.
> - Ubuntu/Debian: `sudo apt-get install python3-dev default-libmysqlclient-dev build-essential pkg-config`
> - macOS (Homebrew): `brew install mysql-client pkg-config`
> - If you just want to run the project quickly without installing MySQL, set
>   `DB_ENGINE=sqlite` in `.env` — no extra system packages needed.

Backend runs at `http://127.0.0.1:8000/`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://127.0.0.1:5173/` and proxies `/api` requests to the Django backend.

## Development Roadmap & Feature Matrix

| Phase | Feature / Component | Priority | Status |
|---|---|---|---|
| 1 | Project setup & architecture | — | ✅ Done |
| 2-3 | Database schema & Django ORM models | P0 | ✅ Done |
| 4-5 | REST APIs, JWT authentication & RBAC | P0 | ✅ Done |
| 6-7 | React frontend shell & interactive Dashboard | P0 | ✅ Done |
| 8-9 | Products, Categories & Inventory management | P0 | ✅ Done |
| 10 | Customer CRM & transaction ledger | P0 | ✅ Done |
| 11 | POS Terminal with real-time stock deduction | P0 | ✅ Done |
| 12 | Orders & Invoices (PDF generator) | P0 | ✅ Done |
| 13 | Expense Tracking & classification | P1 | ✅ Done |
| 15 | Business Reports & financial analytics | P1 | ✅ Done |
| 17 | Business settings (currency, tax, low-stock) | P1 | ✅ Done |
| 18 | Suppliers & Vendor management | P2 | ✅ Done |
| 19 | Staff & Employee management (RBAC) | P2 | ✅ Done |
| 20 | Notification Center & low-stock alerts | P2 | ✅ Done |
| 21 | Audit Logs & security activity trail | P2 | ✅ Done |
| 22 | Barcode & QR Code Label Printing Studio | P2 | ✅ Done |
| 23-30 | Luxury Dark Gold Animation & Three.js Studio | P2 | ✅ Done |
| 31-32 | Reel-matched Embossed Auth & CSS Pipeline | P2 | ✅ Done |
| Production | Docker, Gunicorn, WhiteNoise & Production Ready | — | ✅ Done |

## Production Deployment

For comprehensive, step-by-step production deployment instructions, see [**`DEPLOYMENT.md`**](./DEPLOYMENT.md).

### Quick 1-Command Docker Deployment

```bash
docker compose up -d --build
```

### Production Pre-Flight Checklist

```bash
# 1. System checks
cd backend && python manage.py check
# 2. Deployment security verification
python manage.py check --deploy
# 3. Static assets compilation
python manage.py collectstatic --noinput
# 4. Frontend production build
cd ../frontend && npm run build
```

- **Healthcheck Endpoint:** `http://127.0.0.1:8000/api/health/` returns `200 OK`
- **Frontend SPA Production Bundle:** `frontend/dist/`

## License

For portfolio / educational use.
