# EV Power Energy CRM

ระบบ CRM สำหรับจัดการลูกค้า, ลีด, การขาย, และคลังสินค้าสำหรับธุรกิจพลังงาน EV

## 📋 สารบัญ

- [ภาพรวม](#ภาพรวม)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [การติดตั้ง](#การติดตั้ง)
- [การใช้งาน](#การใช้งาน)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [API Documentation](#api-documentation)
- [การ Deploy](#การ-deploy)

---

## 🎯 ภาพรวม

EV Power Energy CRM เป็นระบบจัดการลูกค้าสัมพันธ์ (CRM) ที่ออกแบบมาสำหรับธุรกิจพลังงาน EV โดยครอบคลุมฟีเจอร์หลัก:

- **Lead Management** - จัดการลีด, ติดตาม, และแปลงเป็นลูกค้า
- **Sales Management** - จัดการทีมขาย, คำสั่งซื้อ, และรายงานยอดขาย
- **Inventory Management** - จัดการคลังสินค้า, สินค้า, และคำสั่งซื้อ
- **Customer Service** - จัดการบริการลูกค้า, นัดหมาย, และการเยี่ยมชม
- **Dashboard & Analytics** - แดชบอร์ดสำหรับผู้บริหารและทีมขาย

---

## 🏗️ Architecture

### Frontend (Client-Side)

**Framework & Library:**
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **React Router** - Client-side Routing
- **TanStack Query (React Query)** - Server State Management & Caching

**UI Components:**
- **shadcn/ui** - Component Library (built on Radix UI)
- **TailwindCSS** - Utility-first CSS Framework
- **Radix UI** - Accessible UI Primitives
- **Lucide React** - Icon Library

**Charts & Visualization:**
- **ECharts** - Advanced Charts
- **Recharts** - React Chart Library
- **Victory** - Data Visualization

**Forms & Validation:**
- **React Hook Form** - Form Management
- **Zod** - Schema Validation

### Backend (Server-Side)

**API Architecture:**
- **Supabase Edge Functions** (Production) - Serverless Functions บน Supabase
  - ใช้ **Deno Runtime**
  - รองรับ TypeScript
  - Auto-scaling
  - Deploy ผ่าน Supabase CLI

- **Vite API Plugin** (Development) - Local API Server สำหรับพัฒนา
  - ใช้ **Node.js Native HTTP** (ไม่ใช้ Express)
  - Hot Reload
  - Proxy ไปยัง Edge Functions

**API Structure:**
```
/api/endpoints/
├── core/          # Core business APIs (Priority 1)
├── additional/    # Extended functionality (Priority 2)
└── system/        # System & utilities (Priority 3)
```

**Total: 34 API Endpoints**

### Database

**Database System:**
- **Supabase PostgreSQL** - Cloud-hosted PostgreSQL Database
  - Real-time Subscriptions
  - Row Level Security (RLS)
  - Auto-generated REST API
  - Database Functions & Triggers

**Database Features:**
- **Migrations** - Version-controlled schema changes
- **Views** - Materialized views สำหรับ performance
- **Functions** - PostgreSQL functions สำหรับ business logic
- **Triggers** - Auto-update timestamps, data validation

### Authentication & Authorization

- **Supabase Auth** - Built-in Authentication System
  - Email/Password
  - OAuth Providers
  - JWT Tokens
  - Session Management

- **Role-Based Access Control (RBAC)**
  - User Roles: Admin, Sales, Manager, etc.
  - Row Level Security (RLS) policies
  - Permission-based UI rendering

### Deployment & Hosting

**Frontend:**
- **Vercel** - Static Site Hosting
  - Automatic deployments
  - Edge Network
  - Serverless Functions support

**Backend:**
- **Supabase Cloud** - Database & Edge Functions Hosting
  - Global CDN
  - Auto-scaling
  - Built-in monitoring

**Infrastructure:**
- **Vercel** - Frontend hosting + API routes
- **Supabase** - Database + Edge Functions + Auth

---

## 🛠️ Tech Stack

### Core Technologies

| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend Framework** | React | 18.3.1 |
| **Language** | TypeScript | 5.5.3 |
| **Build Tool** | Vite | 5.4.1 |
| **UI Framework** | TailwindCSS | 3.4.11 |
| **Component Library** | shadcn/ui (Radix UI) | Latest |
| **State Management** | TanStack Query | 5.56.2 |
| **Routing** | React Router | 6.26.2 |
| **Forms** | React Hook Form | 7.53.0 |
| **Validation** | Zod | 3.23.8 |

### Backend & Database

| Category | Technology | Version |
|----------|-----------|---------|
| **Database** | PostgreSQL (Supabase) | Latest |
| **Backend Runtime** | Deno (Edge Functions) | Latest |
| **API Framework** | Supabase Edge Functions | Latest |
| **ORM/Client** | Supabase JS Client | 2.50.0 |

### Development Tools

| Category | Technology |
|----------|-----------|
| **Package Manager** | npm / bun |
| **Linter** | ESLint |
| **Type Checker** | TypeScript |
| **Version Control** | Git |

---

## 🚀 การติดตั้ง

### Prerequisites

- **Node.js** >= 18.x
- **npm** หรือ **bun**
- **Supabase CLI** (สำหรับ Edge Functions)
- **Git**

### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd ev-power-energy-crm
```

2. **Install Dependencies**
```bash
npm install
# หรือ
bun install
```

3. **Setup Environment Variables**
```bash
cp .env.example .env.local
```

แก้ไข `.env.local` และใส่ค่าจริง (อย่างน้อยค่าที่จำเป็น):
- **Required:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Server (Vercel):** `SUPABASE_SERVICE_ROLE_KEY` สำหรับ keep-alive / API
- ตัวแปรอื่นดูได้จาก `.env.example` และ [docs/setup/ENV_LOCAL_EXAMPLE.md](docs/setup/ENV_LOCAL_EXAMPLE.md)

4. **Start Development Server**
```bash
npm run dev
```

แอปจะรันที่ `http://localhost:8080`

---

## 💻 การใช้งาน

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate OpenAPI documentation
npm run gen:openapi

# View API documentation
npm run docs
# เปิด http://localhost:8080/api-docs

# Lint code
npm run lint
```

### Supabase Commands

```bash
# Start local Supabase (optional)
npm run dev:supabase

# Serve Edge Function locally
npm run dev:function
```

### Project root layout

```
ev-power-energy-crm/
├── src/                    # Frontend source code
├── api/                    # Local API endpoints (dev only)
├── server/                 # Server-side code & endpoints
├── supabase/               # Supabase config, functions, migrations
├── docs/                   # All documentation (see docs/README.md)
├── scripts/                # Utility scripts
├── database-debug/         # DB debug scripts & queries
├── public/                 # Static assets
├── index.html
├── package.json, vite.config.ts, tsconfig.json, etc.
├── README.md               # This file
└── LICENSE
```

### Project Structure (detail)

```
ev-power-energy-crm/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── integrations/      # Third-party integrations
│
├── api/                   # Local API endpoints (dev only)
│   └── endpoints/         # API route handlers
│
├── supabase/              # Supabase configuration
│   ├── functions/         # Edge Functions (production)
│   └── migrations/        # Database migrations
│
├── public/                # Static assets
├── docs/                  # Documentation
├── scripts/               # Utility scripts
└── server/                # Server-side code
```

---

## 📁 โครงสร้างโปรเจค

### Frontend Structure

```
src/
├── components/           # UI Components
│   ├── ui/               # shadcn/ui components
│   ├── charts/           # Chart components
│   └── forms/            # Form components
│
├── pages/                # Page Components
│   ├── marketing/        # Marketing pages
│   ├── inventory/        # Inventory pages
│   └── ...
│
├── hooks/                # Custom Hooks
│   ├── useAppDataAPI.ts  # Main data hooks
│   └── ...
│
├── utils/                # Utilities
│   ├── leadValidation.ts
│   └── ...
│
└── integrations/         # Integrations
    └── supabase/         # Supabase client
```

### Backend Structure

```
supabase/functions/
├── core-*/               # Core business functions
│   ├── leads/            # Lead management
│   ├── sales-team/       # Sales team
│   └── inventory/        # Inventory
│
├── additional-*/         # Additional features
│   ├── products/         # Products
│   └── customer/         # Customer services
│
└── system-*/             # System functions
    ├── management/       # Management APIs
    └── service/          # Service operations
```

---

## 📚 API Documentation

### API Overview

ระบบมี **34 API Endpoints** แบ่งเป็น 3 หมวดหมู่:

1. **Core APIs** (15 endpoints) - ฟีเจอร์หลัก
2. **Additional APIs** (9 endpoints) - ฟีเจอร์เสริม
3. **System APIs** (10 endpoints) - ระบบและยูทิลิตี้

### View API Documentation

```bash
# Generate OpenAPI spec
npm run gen:openapi

# View in browser
npm run docs
# เปิด http://localhost:8080/api-docs
```

### API Endpoints

**Core APIs:**
- `GET /api/core/leads/leads-list` - รายการลีด
- `POST /api/core/leads/lead-mutations` - สร้าง/แก้ไขลีด
- `GET /api/core/sales-team/sales-team` - รายการทีมขาย
- `GET /api/core/inventory/inventory` - ข้อมูลคลังสินค้า

**Additional APIs:**
- `GET /api/additional/products/products` - รายการสินค้า
- `GET /api/additional/customer/customer-services` - บริการลูกค้า

**System APIs:**
- `GET /api/system/health` - Health check
- `POST /api/system/management/sales-team-management` - จัดการทีมขาย

ดูรายละเอียดเพิ่มเติม: [`api/README.md`](./api/README.md)

---

## 🚢 การ Deploy

### Frontend Deployment (Vercel)

1. **Connect Repository** ไปยัง Vercel
2. **Configure Environment Variables** ใน Vercel Dashboard
3. **Deploy** - Vercel จะ deploy อัตโนมัติเมื่อ push code

### Backend Deployment (Supabase Edge Functions)

```bash
# Deploy single function
supabase functions deploy <function-name>

# Deploy all functions
supabase functions deploy
```

### Database Migrations

```bash
# Create new migration
supabase migration new <migration-name>

# Apply migrations
supabase db push
```

ดูรายละเอียดเพิ่มเติม: [`docs/setup/DEPLOY_INSTRUCTIONS.md`](./docs/setup/DEPLOY_INSTRUCTIONS.md)

---

## 📖 Documentation

- **API Documentation**: [`api/README.md`](./api/README.md)
- **API Endpoints & Client**: [`docs/api/API_ENDPOINTS_DOCUMENTATION.md`](./docs/api/API_ENDPOINTS_DOCUMENTATION.md), [`docs/api/API_CLIENT_COMPARISON.md`](./docs/api/API_CLIENT_COMPARISON.md)
- **Code Quality & Analysis**: [`docs/analysis/CODE_QUALITY_ANALYSIS.md`](./docs/analysis/CODE_QUALITY_ANALYSIS.md)
- **Supabase URL Flow**: [`docs/setup/SUPABASE_URL_EXPLANATION.md`](./docs/setup/SUPABASE_URL_EXPLANATION.md)
- **Project Structure**: [`docs/project/structure.md`](./docs/project/structure.md)
- **Deployment Guide**: [`docs/setup/DEPLOY_INSTRUCTIONS.md`](./docs/setup/DEPLOY_INSTRUCTIONS.md)
- **Development Workflow**: [`server/docs/development/`](./server/docs/development/)
- **All docs index**: [`docs/README.md`](./docs/README.md)

---

## 🔧 Development

### Adding New Features

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Develop Feature**
   - สร้าง components ใน `src/components/`
   - สร้าง pages ใน `src/pages/`
   - สร้าง hooks ใน `src/hooks/`

3. **Add API Endpoints** (ถ้าจำเป็น)
   - สร้าง Edge Function ใน `supabase/functions/`
   - หรือสร้าง Local API ใน `api/endpoints/` (dev only)

4. **Test & Document**
   - ทดสอบฟีเจอร์
   - อัปเดต documentation

5. **Create Pull Request**

### Code Style

- ใช้ **TypeScript** สำหรับ type safety
- ใช้ **ESLint** สำหรับ code quality
- ใช้ **Prettier** สำหรับ code formatting (ถ้ามี)
- ใช้ **Conventional Commits** สำหรับ commit messages

---

## 📝 License

ดูไฟล์ [`LICENSE`](./LICENSE) สำหรับรายละเอียด

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

## 📞 Support

สำหรับคำถามหรือปัญหา:
- เปิด Issue ใน GitHub
- ติดต่อทีมพัฒนา

---

**Built with ❤️ using React, TypeScript, and Supabase**
