# TransitOps — Smart Transport Operations Platform 🚛

![TransitOps](https://img.shields.io/badge/Status-100%25%20Complete-success?style=for-the-badge)
![Odoo Hackathon](https://img.shields.io/badge/Odoo%20Hackathon-2026-purple?style=for-the-badge)

**TransitOps** is a comprehensive, modern, and highly secure fleet management and transport operations platform. Built for the Odoo Hackathon 2026, it enables transport companies to manage their vehicles, dispatch trips, track operational costs, monitor driver safety, and generate real-time analytics with ease.

---

### 🚀 Live Deployment
<<<<<<< HEAD
**[transitops-brown.vercel.app](https://transitops-brown.vercel.app)**
=======
**[transitops-brown.vercel.app](https://transitops-brown.vercel.app)** *(Placeholder - replace with actual link)*
>>>>>>> dev

---

## ✨ Core Features

### 🔐 Enterprise-Grade Security & RBAC
- **Next-Auth (Auth.js v5):** Secure credential-based authentication.
- **Strict Role-Based Access Control:** Granular access across 5 distinct roles (`FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`, and `DRIVER`).
- **Middleware Protection:** Edge middleware (`proxy.ts`) completely blocks unauthorized access, ensuring drivers can only access their portal and staff can only access their designated modules.

### 🚚 Fleet & Trip Management
- **Vehicle Registry:** Complete CRUD operations for the fleet. Track Max Load Capacity, Odometer readings, and Acquisition Costs.
- **Trip Dispatching:** Create "Draft" trips and dispatch them. The system **automatically validates cargo weight against vehicle capacity** and prevents dispatching unavailable vehicles or drivers.
- **Atomic State Updates:** Dispatching a trip automatically marks the vehicle and driver as `ON_TRIP`. Completing it frees them up as `AVAILABLE` and updates the vehicle's odometer.

### 👤 Driver Portal & Safety
- **Dedicated Driver View:** Drivers get a focused mobile-friendly portal to view their active trip, update completion status, and check license expiry warnings.
- **Safety Dashboard:** Safety Officers can track driver safety scores, monitor license expirations (with visual warnings for 30/60/90 days), and take administrative actions.

### 💰 Financials & Maintenance
- **Maintenance Logs:** Logging maintenance automatically puts a vehicle `IN_SHOP`, preventing it from being dispatched until marked as completed.
- **Fuel & Expenses:** Granular tracking of fuel purchases and trip tolls.
- **Financial Analytics:** Real-time dashboards calculating total Operational Expenditures (OpEx).

---

## 🌟 Advanced "Bonus" Features Implemented

We didn't stop at the minimum requirements. TransitOps includes several premium features to provide a world-class user experience:

- 📊 **Visual Analytics (Recharts):** Interactive charts displaying a 6-month historical trend of fuel, maintenance, and trip expenses.
- 📄 **True PDF Generation:** Not just printing HTML—we use `jsPDF` and `autoTable` to generate downloadable, perfectly formatted **PDF Trip Manifests** and **Monthly Expense Reports**.
- 🔍 **Advanced State Filtering:** Every major data table includes intuitive "Pill" filters (e.g., Filter by `AVAILABLE`, `ON_TRIP`, `IN_SHOP`) that work synchronously with full-text search.
- 💾 **Native CSV Exports:** One-click CSV exports for all datasets directly from the tables.
- 🎬 **Premium UI/UX:** Built with `shadcn/ui` and enhanced with `framer-motion` for buttery smooth page transitions, staggered list renders, and beautiful modal animations. Fully responsive Dark/Light mode support.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router), React 19
- **Database:** PostgreSQL (Containerized via Docker)
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Authentication:** Auth.js (Next-Auth v5)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui, Radix UI, Lucide Icons
- **Data Visualization:** Recharts
- **PDF Generation:** jsPDF + jspdf-autotable
- **Animations:** Framer Motion

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://www.docker.com/) (for the PostgreSQL database)

### 2. Clone and Install
```bash
git clone https://github.com/CSEAnuragChandra/OH-2026-Transitops.git
cd OH-2026-Transitops
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/transitops?schema=public"
AUTH_SECRET="your-super-secret-key-at-least-32-chars"
```

### 4. Start the Database
```bash
docker compose up -d db
```

### 5. Setup Database & Seed
Push the Prisma schema and seed the database with mock data and test users:
```bash
npm run db:push
npm run db:seed
```

### 6. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Accounts
You can log in with the following seeded accounts (Password for all is `password123`):

- **Fleet Manager:** `manager@transitops.com`
- **Dispatcher:** `dispatcher@transitops.com`
- **Safety Officer:** `safety@transitops.com`
- **Financial Analyst:** `finance@transitops.com`
- **Driver:** `driver@transitops.com` 

---
*Built with ❤️ for Odoo Hackathon 2026*
