# TransitOps — Build Plan & Tech Stack

## 0. Spec Analysis Summary

**Typo confirmed:** Section 2 (Target Users) lists "Driver" as a role responsible for "creates trips, assigns vehicles and drivers, monitors active deliveries." Every other reference (login mockup role dropdown, §3.1, the RBAC matrix on the Settings screen) calls this role **Dispatcher**. "Driver" is a separate data entity (the person operating a vehicle, managed under Driver Management). Section 2 should read **Dispatcher**, not Driver.

**The 4 real roles are:**
| Role | Access (from Settings/RBAC mockup) |
|---|---|
| Fleet Manager | Fleet ✅, Drivers ✅, Trips —, Fuel/Exp —, Analytics ✅ |
| Dispatcher | Fleet (view), Drivers —, Trips ✅, Fuel/Exp —, Analytics — |
| Safety Officer | Fleet —, Drivers ✅, Trips (view), Fuel/Exp —, Analytics — |
| Financial Analyst | Fleet (view), Drivers —, Trips —, Fuel/Exp ✅, Analytics ✅ |

**Core entities (from §6 + mockups):** User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense — Role can be an enum on User rather than its own table for an 8-hour build.

**Key state machines to encode as backend logic (not just UI):**
- Vehicle: `Available → On Trip → Available` / `Available → In Shop → Available` / `→ Retired` (terminal)
- Driver: `Available → On Trip → Available` / `→ Suspended` / `→ Off Duty`
- Trip: `Draft → Dispatched → Completed` / `Draft/Dispatched → Cancelled`

**Hard validation rules (§4) — these are the ones graders/testers will actually poke at:**
1. Vehicle registration number unique
2. Retired/In Shop vehicles excluded from dispatch vehicle picker
3. Expired-license or Suspended drivers excluded from dispatch driver picker
4. A vehicle/driver already "On Trip" can't be double-booked
5. `cargoWeight > vehicle.maxLoadCapacity` blocks dispatch (this is literally shown as an error state in the Trip Dispatcher mockup)
6. Dispatch → vehicle & driver flip to On Trip (atomic)
7. Complete → both flip back to Available (atomic), triggers odometer/fuel capture
8. Cancel (from Dispatched) → both restored to Available
9. Create active maintenance record → vehicle → In Shop (atomic)
10. Close maintenance → vehicle → Available, **unless** Retired

Rules 6–10 are exactly the kind of thing that breaks under concurrent requests or gets forgotten in a rushed build — do these as single Prisma `$transaction` calls, not sequential updates from the client.

---

## 1. Recommended Tech Stack

Your picks (Next.js, Prisma/Postgres, Tailwind, shadcn/ui, Framer Motion) are the right call for an 8-hour build — server actions cut out a whole API layer, and shadcn gets you the exact dark, dense, data-table-heavy look in your mockups almost for free. Additions below fill the gaps your stack doesn't cover on its own.

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Confirmed. Use Server Actions for all mutations — skip building a separate REST/tRPC layer, no time for it. |
| DB / ORM | PostgreSQL + Prisma | Confirmed. Use **Neon** or **Supabase** (free, instant connection string, no local Postgres setup wasting hackathon time). |
| Styling | Tailwind CSS + shadcn/ui | Confirmed. shadcn gives you Table, Dialog, Select, Badge, Sidebar, Chart components matching the mockup's exact aesthetic. |
| Motion | Framer Motion | Confirmed. Use sparingly: page transitions, KPI card mount, status-badge color transitions. Don't animate tables — perf risk under time pressure. |
| Auth | **Auth.js (NextAuth v5) — Credentials provider** | You need email+password + custom roles, not social login. Credentials provider + JWT session with `role` claim is the fastest path to real RBAC. Roll your own only if Auth.js setup friction outweighs its value — for 8 hours, don't. |
| Password hashing | bcryptjs | Standard, zero-config. |
| Forms & validation | react-hook-form + Zod | Validates cargo-weight-vs-capacity, license-expiry, required fields client-side *and* re-validates server-side in the Server Action (never trust the client for rule #5). |
| Tables | TanStack Table (via shadcn `data-table` recipe) | Sorting/filtering/search on Fleet, Drivers, Trips lists — matches the search bars in every mockup. |
| Charts | Recharts (shadcn `chart` wrapper) | Monthly Revenue bar chart, Top Costliest Vehicles bar — shadcn's chart primitives are Recharts under the hood, styling matches your dark theme automatically. |
| Toasts/feedback | sonner | Dispatch-blocked errors, save confirmations — matches the red error-state boxes in your mockups. |
| Icons | lucide-react | Ships with shadcn, zero extra install. |
| Dates | date-fns | License expiry comparisons, trip ETA formatting. |
| CSV export | papaparse or native `Array.join` + Blob | Simple enough to hand-roll; papaparse if you want it bulletproof. |
| Deployment | Vercel + Neon Postgres | Push-to-deploy, matches Next.js natively, free tier is enough for a demo. |

**Skip for 8 hours (bonus-list items, not core):** email reminders (needs a cron/queue — out of scope), PDF export (optional per spec), document upload/storage (needs blob storage setup — time sink for low grading value).

---

## 2. Database Schema (Prisma sketch)

```prisma
enum Role {
  FLEET_MANAGER
  DISPATCHER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  name     String
  role     Role
  createdAt DateTime @default(now())
}

model Vehicle {
  id              String        @id @default(cuid())
  regNumber       String        @unique
  name            String
  type            String
  maxLoadCapacity Float
  odometer        Float         @default(0)
  acquisitionCost Float
  status          VehicleStatus @default(AVAILABLE)
  trips           Trip[]
  maintenance     MaintenanceLog[]
  fuelLogs        FuelLog[]
}

model Driver {
  id              String       @id @default(cuid())
  name            String
  licenseNumber   String       @unique
  licenseCategory String
  licenseExpiry   DateTime
  contact         String
  safetyScore     Int          @default(100)
  status          DriverStatus @default(AVAILABLE)
  trips           Trip[]
}

model Trip {
  id              String     @id @default(cuid())
  code            String     @unique // TR001 etc
  source          String
  destination     String
  vehicleId       String?
  vehicle         Vehicle?   @relation(fields: [vehicleId], references: [id])
  driverId        String?
  driver          Driver?    @relation(fields: [driverId], references: [id])
  cargoWeight     Float
  plannedDistance Float
  finalOdometer   Float?
  fuelConsumed    Float?
  status          TripStatus @default(DRAFT)
  expenses        Expense[]
  createdAt       DateTime   @default(now())
}

model MaintenanceLog {
  id        String   @id @default(cuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  serviceType String
  cost      Float
  date      DateTime
  status    String   // "In Shop" | "Completed"
}

model FuelLog {
  id        String   @id @default(cuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  date      DateTime
  liters    Float
  cost      Float
}

model Expense {
  id     String  @id @default(cuid())
  tripId String
  trip   Trip    @relation(fields: [tripId], references: [id])
  toll   Float   @default(0)
  other  Float   @default(0)
}
```

---

## 3. Hour-by-Hour Plan (8 hours)

| Time | Block | Deliverable |
|---|---|---|
| **0:00–0:30** | Setup | `create-next-app`, Tailwind + shadcn `init`, Prisma `init`, Neon/Supabase connection string wired, repo pushed, Vercel project linked (deploy early so deploy issues surface now, not at 7:45). |
| **0:30–1:30** | Auth + RBAC skeleton | Prisma `User` model, seed script creating one user per role, Auth.js Credentials provider, login page matching mockup (email/password/role display, error states for invalid creds), middleware that reads `session.role` and redirects/gates routes. |
| **1:30–2:30** | Full schema + seed | Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense models + migration. Seed script populating ~5 vehicles, ~4 drivers, ~4 trips matching the mockup's sample data so every screen looks populated in the demo. |
| **2:30–3:30** | Shell + Dashboard | Sidebar nav (role-aware — hide/disable tabs per RBAC matrix), topbar with role badge, KPI cards (Active/Available/In Maintenance vehicles, Active/Pending Trips, Drivers on Duty, Fleet Utilization %), filters (vehicle type/status/region), Recent Trips table, Vehicle Status bars. |
| **3:30–4:30** | Vehicle Registry + Driver Management | CRUD forms + tables for both, status badges, "Add Driver" flow, toggle-status buttons on Drivers screen, license expiry displayed with visual flag if expired. |
| **4:30–5:30** | Trip Dispatcher (the highest-risk screen) | Trip lifecycle stepper UI, create-trip form with **available-only** vehicle/driver dropdowns (filtered server-side), live capacity check (450kg vs 500kg style validation with the red error box exactly like the mockup), Live Board list, dispatch/cancel/complete Server Actions wrapped in `prisma.$transaction`. |
| **5:30–6:30** | Maintenance + Fuel & Expenses | Log Service Record form → auto-flips vehicle to In Shop; Service Log table; Fuel Logs + Other Expenses tables; auto-computed Total Operational Cost (Fuel + Maintenance) per vehicle. |
| **6:30–7:30** | Analytics + Settings | KPI cards (Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI formula from §3.8), Monthly Revenue bar chart, Top Costliest Vehicles bar chart, CSV export button, Settings page rendering the static RBAC matrix + general depot settings form. |
| **7:30–8:00** | Polish + demo prep | Framer Motion micro-transitions (KPI card fade-in, sidebar active state), responsive pass, walk through the exact Example Workflow in §5 end-to-end once to catch broken state transitions, prep 2-minute demo script. |

**If you're running short on time, cut in this order:** CSV export → Analytics charts (keep the KPI numbers, drop the charts) → Framer Motion polish → region filter. Never cut the Trip Dispatcher validation logic — it's the centerpiece business rule and the one thing every reviewer will test.

---

## 4. RBAC Enforcement — Do It in 2 Places, Not 1

- **Route-level:** middleware or a layout-level check per role, matching the matrix on the Settings screen (e.g., Safety Officer gets read-only Trips, no Fuel/Expenses at all).
- **Server Action–level:** even if a UI element is hidden, the Server Action itself must re-check `session.role` before mutating — otherwise a Dispatcher can hit a Financial Analyst's server action directly. This is a 10-minute add per action and closes the most common RBAC hole in fast builds.

---

## 5. Suggested Folder Structure

```
app/
  (auth)/login/page.tsx
  (dashboard)/
    layout.tsx          # sidebar + topbar + role gate
    dashboard/page.tsx
    fleet/page.tsx
    drivers/page.tsx
    trips/page.tsx
    maintenance/page.tsx
    fuel-expenses/page.tsx
    analytics/page.tsx
    settings/page.tsx
lib/
  auth.ts               # Auth.js config
  prisma.ts             # singleton client
  rbac.ts               # role -> permitted routes/actions map
  validations.ts        # Zod schemas
actions/
  vehicles.ts
  drivers.ts
  trips.ts              # dispatch/complete/cancel transactions
  maintenance.ts
  fuel-expenses.ts
prisma/
  schema.prisma
  seed.ts
```

---

Want me to scaffold the actual Next.js project (Prisma schema file, seed script, and the Trip Dispatcher validation logic) next, or start with the login/RBAC flow first since everything else sits behind it?
