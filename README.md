# CoreInventory IMS

> Full-stack Inventory Management System for **Bharat Steel & Manufacturing Pvt. Ltd.** (Surat, Gujarat)

---

## Live Demo

| Role | Email | Password |
|---|---|---|
| Admin (Manager) | admin@bharatsteel.com | Demo@1234 |
| Warehouse Staff | warehouse@bharatsteel.com | Demo@1234 |
| Manager 2 | manager2@bharatsteel.com | Demo@1234 |

**Demo URL:** http://localhost:5173

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **State** | Zustand + React Query v5 |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Routing** | React Router v6 |
| **Backend** | Node.js + Express + TypeScript |
| **ORM** | Prisma v5 |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 (dashboard aggregations, 30s TTL) |
| **Email** | Nodemailer + Gmail SMTP |
| **Real-time** | Socket.io |
| **Auth** | JWT (access 15min + refresh 7d) + bcrypt |

---

## Features

- 🔐 **Auth** — Register, login, JWT refresh token rotation, OTP email verification, forgot/reset password
- 📦 **Products** — CRUD, categories, reorder rules, stock map, sparkline history, QR code generation
- 🏭 **Warehouses & Locations** — Multi-warehouse management with zones
- 📥 **Receipts** — Incoming stock: draft → confirm → validate, auto-backorder on partial, batch validate
- 📤 **Deliveries** — Outgoing stock: draft → confirm (reserve) → validate (deduct) → cancel
- 🔄 **Transfers** — Atomic internal stock moves between locations
- ⚖️ **Adjustments** — Staff submits count, manager approve/reject with reason
- 📊 **Stock Ledger** — Full audit trail, filterable by product/location/type/date, CSV + PDF export
- 📈 **Dashboard** — KPI cards, real-time alerts, recent operations (Redis cached, Socket.io push)
- 💰 **Stock Valuation** — Pie chart + top 10 table + PDF export in INR
- 🔔 **Alerts** — Auto low-stock alerts, real-time push to manager's room
- 📤 **Exports** — CSV + PDF for products, receipts, deliveries, ledger
- 🎯 **Demo Banner** — Role switcher for easy demo/testing

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Step 1 — Clone & Install

```bash
git clone <your-repo-url> CoreInventory
cd CoreInventory/server && npm install
cd ../client && npm install
```

### Step 2 — Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env with your credentials (see Environment Variables section below)
```

### Step 3 — Database Setup

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### Step 4 — Start Servers

```bash
# Terminal 1 — Backend (port 4000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

### Step 5 — Open & Login

Go to **http://localhost:5173** and log in as `admin@bharatsteel.com` / `Demo@1234`

### Optional: Start PostgreSQL & Redis via Docker

```bash
docker-compose up -d
```

---

## Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/ims_db` |
| `JWT_SECRET` | ✅ | Access token signing secret (32+ chars) | `super-secret-key...` |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret (32+ chars) | `another-secret...` |
| `JWT_EXPIRES_IN` | | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | | Refresh token TTL | `7d` |
| `PORT` | | Server port | `4000` |
| `NODE_ENV` | | Environment | `development` |
| `CLIENT_URL` | ✅ | Frontend URL for CORS | `http://localhost:5173` |
| `REDIS_URL` | ✅ | Redis connection string | `redis://localhost:6379` |
| `SMTP_HOST` | ✅ | SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | | SMTP port | `587` |
| `SMTP_SECURE` | | Use TLS (false for STARTTLS) | `false` |
| `SMTP_USER` | ✅ | Gmail address | `you@gmail.com` |
| `SMTP_PASS` | ✅ | Gmail App Password (no spaces) | `abcdefghijklmnop` |
| `SMTP_FROM` | | From name in emails | `"IMS <you@gmail.com>"` |
| `OTP_EXPIRY_MINUTES` | | OTP validity in minutes | `10` |

---

## API Overview

| Module | Method | Path | Description |
|---|---|---|---|
| Auth | POST | `/api/auth/register` | Register (sends verification OTP) |
| Auth | POST | `/api/auth/login` | Login → access + refresh tokens |
| Auth | POST | `/api/auth/refresh` | Rotate refresh token |
| Auth | POST | `/api/auth/logout` | Revoke refresh token |
| Auth | POST | `/api/auth/verify-email` | Verify OTP → issue tokens |
| Auth | POST | `/api/auth/forgot-password` | Send password reset OTP |
| Auth | POST | `/api/auth/reset-password` | Reset password with OTP |
| Products | GET/POST | `/api/products` | List / Create |
| Products | GET/PUT/DELETE | `/api/products/:id` | Detail / Update / Archive |
| Products | GET | `/api/products/:id/qrcode` | PNG QR code |
| Products | GET | `/api/products/:id/stock` | Stock by location |
| Products | GET | `/api/products/:id/history` | Ledger history |
| Receipts | GET/POST | `/api/receipts` | List / Create |
| Receipts | POST | `/api/receipts/:id/confirm` | DRAFT → CONFIRMED |
| Receipts | POST | `/api/receipts/:id/validate` | CONFIRMED → DONE |
| Receipts | POST | `/api/receipts/batch-validate` | Batch validate up to 20 |
| Deliveries | GET/POST | `/api/deliveries` | List / Create |
| Deliveries | POST | `/api/deliveries/:id/confirm` | Reserve stock |
| Deliveries | POST | `/api/deliveries/:id/validate` | Deduct stock |
| Deliveries | POST | `/api/deliveries/:id/cancel` | Release reservations |
| Transfers | GET/POST | `/api/transfers` | List / Create |
| Transfers | POST | `/api/transfers/:id/validate` | Atomic src↓ dest↑ |
| Adjustments | GET/POST | `/api/adjustments` | List / Create |
| Adjustments | POST | `/api/adjustments/:id/approve` | PENDING → APPROVED |
| Adjustments | POST | `/api/adjustments/:id/reject` | PENDING → REJECTED |
| Ledger | GET | `/api/stock-ledger` | Paginated audit trail |
| Dashboard | GET | `/api/dashboard` | KPIs + alerts (Redis cached) |
| Reports | GET | `/api/reports/stock-valuation` | Inventory value breakdown |
| Reports | GET | `/api/reports/stock-valuation/export` | PDF export |
| Alerts | GET | `/api/alerts` | My alerts |
| Alerts | PUT | `/api/alerts/:id/seen` | Mark as seen |

---

## Project Structure

```
CoreInventory/
├── docker-compose.yml          # PostgreSQL 15 + Redis 7
├── client/                     # React 18 frontend
│   ├── src/
│   │   ├── pages/              # Route pages
│   │   │   ├── auth/           # Login, Register, Verify Email, OTP, Reset
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── receipts/
│   │   │   ├── deliveries/
│   │   │   ├── transfers/
│   │   │   ├── adjustments/
│   │   │   ├── reports/        # Stock valuation
│   │   │   └── history/        # Stock ledger
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, Sidebar, Topbar
│   │   │   ├── ui/             # Button, Card, Table, Modal, Badge...
│   │   │   ├── DemoBanner.tsx  # Role switcher for demo
│   │   │   └── ErrorBoundary.tsx
│   │   ├── store/              # Zustand auth store
│   │   ├── lib/                # API client, queryClient, utils
│   │   └── types/              # TypeScript interfaces
└── server/                     # Node.js + Express backend
    ├── prisma/
    │   ├── schema.prisma        # 17 models
    │   ├── seed.ts              # Bharat Steel — 50 products, 5 users
    │   └── migrations/
    ├── src/
    │   ├── controllers/         # Auth, Products, Receipts, Deliveries...
    │   ├── routes/              # Express routers
    │   ├── middleware/          # Auth, Role, Validate, Sanitize, Rate limit
    │   ├── services/            # Email, OTP, Alert, Export
    │   └── lib/                 # Prisma, Redis, Socket.io
    └── .env.example
```

---

## Database Schema

| Model | Description |
|---|---|
| `Organisation` | Multi-tenant root |
| `User` | Auth + roles (MANAGER / STAFF) |
| `RefreshToken` | JWT refresh token rotation store |
| `Warehouse` | Physical warehouse |
| `Location` | Zone/rack/shelf within a warehouse |
| `Category` | Product category |
| `Product` | Product with SKU, cost, unitCost, min stock |
| `StockQuant` | Current qty + reserved qty per product per location |
| `Receipt` | Incoming stock operation |
| `ReceiptLine` | Per-product line on a receipt |
| `DeliveryOrder` | Outgoing stock operation |
| `DeliveryLine` | Per-product line on a delivery |
| `Transfer` | Internal stock move |
| `TransferLine` | Per-product line on a transfer |
| `Adjustment` | Stock count correction (pending manager approval) |
| `StockLedger` | Immutable audit trail of all stock movements |
| `ReorderRule` | Min/max/reorder qty trigger per product |
| `Alert` | Low-stock / out-of-stock alerts |

---

## Seed Data (Bharat Steel)

- **5 users** — 2 managers, 3 staff (`Demo@1234` for all)
- **3 warehouses** — Main Plant, Secondary, Transit
- **11 locations** across zones
- **5 categories** — Steel Bars, Pipes, Sheets, Fasteners, Tools
- **50 products** with realistic SKUs, unitCost, and minStockLevel
- Sample receipts, deliveries, transfers, adjustments, ledger entries, and alerts pre-loaded


## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State | Zustand + React Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Routing | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma (PostgreSQL 15) |
| Cache | Redis 7 (30s TTL on dashboard) |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Export | PDFKit + csv-writer |

## Prerequisites

- **Node.js** 18+
- **Docker** + Docker Compose (for PostgreSQL & Redis)
- **npm** or **yarn**

## Quick Start

### 1. Clone and setup

```bash
git clone <repo>
cd CoreInventory
```

### 2. Start the database and Redis

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 15 on port `5432`
- Redis 7 on port `6379`

### 3. Configure the server

```bash
cd server
cp .env.example .env
# Edit .env if needed (DB credentials match docker-compose defaults)
```

### 4. Initialize the database

```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed  # (via ts-node)
# OR
npm run prisma:migrate
npm run prisma:seed
```

### 5. Start the backend

```bash
cd server
npm run dev
# Server runs on http://localhost:4000
```

### 6. Start the frontend

```bash
cd client
npm install
npm run dev
# App runs on http://localhost:5173
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | admin@acme.com | demo1234 |
| Staff | staff@acme.com | demo1234 |

## Environment Variables (Server)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://ims_user:ims_password@localhost:5432/ims_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

## Project Structure

```
CoreInventory/
├── docker-compose.yml          # PostgreSQL 15 + Redis 7
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # All database models
│   │   └── seed.ts             # Seed data (50 products, users, operations)
│   └── src/
│       ├── controllers/        # Business logic per module
│       ├── middleware/         # auth, roleCheck, validate, errorHandler, rateLimiter
│       ├── routes/             # Express routes per module
│       ├── services/           # alert.service, export.service
│       ├── lib/                # prisma, redis, socket
│       └── index.ts            # App entry point
└── client/
    └── src/
        ├── components/
        │   ├── ui/             # Button, Input, Card, Modal, Badge, GlobalSearch
        │   ├── layout/         # Sidebar, Topbar, BottomTabBar, AppLayout
        │   └── tables/         # Table, Pagination
        ├── hooks/              # useAuth, useSocket
        ├── lib/                # api.ts, queryClient.ts, utils.ts
        ├── pages/              # All 25+ page components
        ├── store/              # Zustand auth store
        └── types/              # TypeScript interfaces
```

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### Products
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id          (soft delete / archive)
GET    /api/products/:id/stock
GET    /api/products/:id/history
GET    /api/products/export?format=csv|pdf
GET    /api/products/search?q=...
```

### Receipts
```
GET  /api/receipts
POST /api/receipts
GET  /api/receipts/:id
PUT  /api/receipts/:id
POST /api/receipts/:id/confirm
POST /api/receipts/:id/validate
GET  /api/receipts/export
```

### Deliveries
```
GET  /api/deliveries
POST /api/deliveries
GET  /api/deliveries/:id
PUT  /api/deliveries/:id
POST /api/deliveries/:id/confirm
POST /api/deliveries/:id/validate
POST /api/deliveries/:id/cancel
GET  /api/deliveries/:id/pick-list
GET  /api/deliveries/export
```

### Transfers
```
GET  /api/transfers
POST /api/transfers
GET  /api/transfers/:id
POST /api/transfers/:id/confirm
POST /api/transfers/:id/validate
```

### Adjustments
```
GET  /api/adjustments
POST /api/adjustments
GET  /api/adjustments/:id
POST /api/adjustments/:id/approve
POST /api/adjustments/:id/reject
```

### Other
```
GET /api/stock-ledger
GET /api/stock-ledger/export
GET /api/dashboard
GET /api/alerts
PUT /api/alerts/:id/seen
GET /api/warehouses
GET /api/locations
GET /api/categories
GET /api/reorder-rules
GET /api/users        (MANAGER only)
```

## Key Features

### Stock Reservation
`StockQuant` tracks `qty` (total) and `reservedQty` (held for deliveries). Available to pick = `qty - reservedQty`.

### Status Machine
All operations follow strict state transitions:
- Receipt: `DRAFT → CONFIRMED → DONE` (or `BACKORDER`)
- Delivery: `DRAFT → WAITING → READY → DONE`
- Transfer: `DRAFT → READY → DONE`
- Adjustment: `PENDING → APPROVED|REJECTED`

### Real-time Updates
Socket.io emits `dashboard:update` after any stock change. The dashboard auto-refreshes without page reload. Low-stock alerts emit `alert:new` to all MANAGER clients.

### Global Search
Press `Cmd+K` (or `Ctrl+K`) to open a command palette for searching products by name/SKU and operations by reference number.

### Exports
All major lists support CSV and PDF export via the Export button.

### Seed Data
- **Organisation**: Acme Manufacturing Ltd
- **Warehouses**: Main Store, Production Floor, Finished Goods Store
- **50 Products**: Raw Materials (RM-001–020), Packaging (PK-001–010), Spare Parts (SP-001–008), Electronics (EL-001–007), Consumables (CN-001–005)
- **10 Completed Receipts**, **8 Completed + 2 Pending Deliveries**, **5 Transfers**, **3 Approved Adjustments**

## Development

```bash
# Server development (with hot reload)
cd server && npm run dev

# Client development
cd client && npm run dev

# Prisma Studio (DB browser)
cd server && npm run prisma:studio

# Build for production
cd server && npm run build
cd client && npm run build
```
