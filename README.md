# MyUangGwe 💰

**MyUangGwe** is a modern, high-performance personal and business finance management application. Built with the latest technologies like **Svelte 5 (Runes)**, **SvelteKit**, **Elysia.js**, and **Turso**, it offers a seamless experience for tracking transactions, managing wallets, and collaborating through organizations.

---

## ✨ Key Features

- **Multi-Tenant Organizations**: Manage personal finances and business accounts separately within the same account.
- **Real-Time Atomic Transactions**: Wallet balances are updated atomically using database transactions (Income, Expense, and Transfer support).
- **Blazing Fast Performance**:
  - **Server-Side Caching**: Powered by Upstash Redis with smart invalidation.
  - **Elysia.js Backend**: High-performance API powered by Bun.
- **Modern UI/UX**:
  - Built with **Svelte 5 Runes** for reactive state management.
  - **Tailwind CSS 4** for high-performance styling.
- **Full Type Safety**: End-to-end type safety from the database (Drizzle) to the frontend (Eden Treaty).

---

## 🏗️ Tech Stack

### **Frontend**
- **SvelteKit 5** (Stable) & **Svelte 5 (Runes)**
- **TanStack Query v6** (Server State Management)
- **TanStack Form v1.28** + **Zod** (Type-safe Forms)
- **Tailwind CSS 4** (Modern CSS Engine)
- **shadcn-svelte** (Radix UI Primitives)

### **Backend**
- **Elysia.js v1.4+** (Bun-powered API Framework)
- **Eden Treaty** (Type-safe RPC Client)
- **Turso (LibSQL)** (Distributed Edge Database)
- **Drizzle ORM v0.45+** (TypeScript ORM)
- **Better Auth v1.4+** (Advanced Authentication with Org support)
- **Upstash Redis** (Serverless Caching)

---

## 🚀 Getting Started

### **Prerequisites**
- [Bun](https://bun.sh/) (Recommended runtime)
- [Turso DB](https://turso.tech/) (SQLite/LibSQL)
- [Upstash Redis](https://upstash.com/) (Caching)

### **1. Clone & Install**
```bash
git clone https://github.com/yourusername/myuanggwe.git
cd myuanggwe
bun install
```

### **2. Environment Variables**
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```
Key variables:
- `DATABASE_URL` & `DATABASE_AUTH_TOKEN`: Your Turso DB credentials.
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis credentials.
- `BETTER_AUTH_SECRET`: Generate a secure random string.
- `PUBLIC_APP_BASE_URL`: Your local or production URL (e.g., `http://localhost:5173`).

### **3. Database Setup**
Push the schema to your Turso database:
```bash
bun run db:push
```

### **4. Run Development Server**
```bash
bun run dev
```
The app will be available at `http://localhost:5173`.

---

## 📂 Project Structure

- `src/lib/auth`: Better Auth configuration and client.
- `src/lib/cache`: Redis caching logic and SvelteKit locals.
- `src/lib/server/db`: Drizzle schema, relations, and database client.
- `src/routes/api`: Elysia API endpoints (Wallets, Transactions, Categories, Dashboard).
- `src/routes/(auth-only)`: Protected application routes.
- `src/hooks.server.ts`: Server-side middleware for Auth and Cache.

---

## 🔧 Available Commands

| Command | Description |
| :--- | :--- |
| `bun run dev` | Start the development server |
| `bun run build` | Build the application for production |
| `bun run db:push` | Sync local schema with the remote database |
| `bun run db:studio` | Open Drizzle Studio to manage data |
| `bun run lint` | Run Prettier and ESLint |
| `bun run check` | Run Svelte-check for type validation |

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ using Svelte 5 & Elysia.js**
