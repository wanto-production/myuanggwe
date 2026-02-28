# MyUangGwe - Personal & Business Finance Management Application

---

## 📋 Project Overview

**MyUangGwe** is a modern, full-stack finance management application built with SvelteKit 5 and Svelte 5 Runes. It provides a robust platform for tracking personal and business finances, featuring multi-organization support, real-time transaction management with atomic balance updates, and a sophisticated server-side caching layer.

---

## 🏗️ Tech Stack

### **Frontend**
- **Framework**: SvelteKit 5 (Svelte 5 with Runes: `$state`, `$derived`, `$effect`, `snippet`)
- **State Management**: 
  - **TanStack Query v6**: For server state synchronization, caching, and optimistic updates.
  - **Svelte Runes**: For reactive client-side state.
- **Forms**: **TanStack Form v1.28** + **Zod** for schema-based validation.
- **Styling**: **Tailwind CSS v4** (Modern, high-performance styling engine).
- **UI Components**: shadcn-svelte (Radix UI primitives via bits-ui).
- **Animations**: GSAP (GreenSock Animation Platform) and `tw-animate-css`.
- **Icons**: Lucide Svelte (via custom wrapper).

### **Backend**
- **API Framework**: **Elysia.js v1.4+** (High-performance, Bun-powered, end-to-end type safety).
- **API Client**: **Eden Treaty** (Typesafe communication between SvelteKit and Elysia).
- **Database**: **Turso (LibSQL/SQLite)** - Edge-ready distributed database.
- **ORM**: **Drizzle ORM v0.45+** (Typesafe SQL builder with relations support).
- **Authentication**: **Better Auth v1.4+** (Session-based, with Organization and Username plugins).
- **Cache**: **Upstash Redis** (Serverless Redis for high-speed data caching).

### **Infrastructure**
- **Runtime**: Bun
- **Deployment**: Vercel (SvelteKit Adapter)
- **Database Hosting**: Turso
- **Cache Hosting**: Upstash

---

## 📂 Project Structure

```
myuanggwe/
├── src/
│   ├── lib/
│   │   ├── @types/                    # Global TypeScript interfaces
│   │   ├── assets/                    # Static UI assets (SVG, images)
│   │   ├── auth/                      # Better Auth config (auth.ts & auth-client.ts)
│   │   ├── components/                # UI and Feature components
│   │   │   ├── forms/                 # CRUD forms for all features
│   │   │   ├── layout/                # Sidebar, Header, Navigation
│   │   │   ├── tables/                # Data listing components
│   │   │   ├── ui/                    # Base UI (Radix/shadcn-svelte)
│   │   │   └── utils/                 # Icons and Shared Layout Wrappers
│   │   ├── composables/               # Shared logic (currency, eden, queries)
│   │   ├── eden.ts                    # Eden Treaty client initialization
│   │   ├── hooks/                     # Custom Svelte hooks
│   │   ├── redis/                     # Upstash Redis (Server & SvelteKit locals)
│   │   ├── schemas.ts                 # Zod validation schemas
│   │   ├── server/                    # Backend server-only logic
│   │   │   └── db/                    # Drizzle ORM (schema.ts & index.ts)
│   │   ├── stores.ts                  # Reactive Svelte stores
│   │   └── utils.ts                   # UI utility functions (cn)
│   ├── routes/
│   │   ├── (auth)/                    # Auth routes (Login, Register)
│   │   ├── (auth-only)/               # Protected app routes
│   │   │   ├── categories/            # Category management
│   │   │   ├── dashboard/             # Financial overview
│   │   │   ├── organizations/         # Org management
│   │   │   │   ├── invitations/       # Invite members
│   │   │   │   └── manage/            # Member management
│   │   │   ├── transactions/          # Transaction management
│   │   │   └── wallets/               # Wallet management
│   │   ├── api/
│   │   │   └── [...all]/
│   │   │       └── +server.ts         # Elysia API (Core backend logic)
│   │   ├── +layout.svelte             # Root layout with Query provider
│   │   └── +page.svelte               # Landing page
│   ├── types/                         # Auto-generated Unplugin types (d.ts)
│   ├── app.d.ts                       # Global types and SvelteKit Locals
│   ├── hooks.server.ts                # Server hooks for Auth and Redis
│   └── app.css                        # Tailwind CSS 4 entry point
├── drizzle/                           # Database migration files
├── static/                            # Static assets
└── .env                               # Environment variables
```

---

## 🗄️ Database Schema & Data Logic

### **Core Features**
- **Atomic Transactions**: Wallet balances are updated within Drizzle database transactions to ensure consistency during Income, Expense, and Transfer operations.
- **Transfers**: Built-in support for moving funds between wallets (Wallet Source → Wallet Destination).
- **Row-Level Scoping**: Data is scoped by `userId` and optionally `organizationId`. Personal data has `organizationId = NULL`.
- **Hybrid Timestamps**: Uses `timestamp_ms` for Auth tables and unix `timestamp` for App tables.

### **Tables**
- **User/Session/Account**: Better Auth managed tables.
- **Organization/Member/Invitation**: Multi-tenant support.
- **Wallets**: Financial accounts (Cash, Bank, Credit Card).
- **Categories**: Income/Expense categorization with icons.
- **Transactions**: Ledger records linked to Wallets and Categories.

---

## 🚀 Key Features & Data Flow

### **1. Real-Time Server Caching**
- Powered by **Upstash Redis**.
- **`withBackendCache`**: A wrapper that handles Cache-Hit/Miss logic with automatic logging.
- **Vite-Style Logging**: Beautifully formatted terminal logs for cache operations (HIT, MISS, SET, INVALIDATE).
- **Smart Invalidation**: Mutations in Wallets, Transactions, or Categories trigger a targeted invalidation of related cache keys (Layout, Dashboard, etc.).

### **2. Multi-Organization Switcher**
- Users can switch between "Personal" and "Organization" contexts.
- Context is stored in `session.activeOrganizationId`.
- API endpoint `/api/changeOrgs/:id` handles the switch and clears relevant cache.

### **3. Typesafe API with Elysia + Eden**
- **Elysia Macros**: Simplified auth checks using `.macro({ auth: true })`.
- **Eden Treaty**: Provides full TypeScript intellisense for API calls in Svelte components.
- **Middleware**: `userData` middleware derives organization context for all API requests.

### **4. Modern UI/UX**
- **Svelte 5 Runes**: Leveraging the latest reactivity model for high performance.
- **Tailwind 4**: Native CSS-first approach with better performance and simplified config.
- **GSAP**: Smooth, professional animations for dashboard transitions.

### **5. DX & Automation (Unplugin)**
- **`unplugin-auto-import`**: Automatically imports Svelte lifecycle hooks (`$state`, `$derived`, etc.), TanStack Query hooks, and custom composables.
  - **Namespace Mapping**: Multi-part UI components (e.g., `Card`, `Dialog`, `Select`) are automatically mapped as namespaces, allowing usage like `<Card.Root>` without manual imports.
- **`unplugin-svelte-components`**: Automatically discovers and registers base UI components from `src/lib/components/ui` and `src/lib/components/utils`.
- **Type Safety**: Both plugins generate d.ts files in `src/types/` to maintain full TypeScript intellisense.

---

## 🔧 API Reference (Elysia)

- **Layout**: `GET /api/layout` - Combined user, session, and organization data.
- **Context**: `PUT /api/changeOrgs/:id` - Switch active context (Personal/Org).
- **Dashboard**: `GET /api/dashboard` - Summarized stats and recent activity.
- **Wallets**: CRUD under `/api/wallets`.
- **Transactions**: CRUD under `/api/transactions` (Handles complex balance logic).
- **Categories**: CRUD under `/api/categories`.

---

## 🛠️ Commands

```bash
# Development
bun run dev

# Database
bun run db:push      # Push schema changes to Turso
bun run db:generate  # Generate migrations
bun run db:migrate   # Apply migrations
bun run db:studio    # Open Drizzle Studio

# Check & Lint
bun run check        # Svelte-check
bun run lint         # ESLint & Prettier
```

---

**Status**: Active Development  
**Version**: 1.0.0 (Svelte 5 Stable)  
**Last Updated**: February 2026
