# GEMINI.md

## Project Overview

This is a SvelteKit web application for personal and business financial management called "MyUangGwe". It allows users to track expenses, income, and manage budgets. The application uses SvelteKit for the frontend and ElysiaJS for the backend API. Authentication is handled by `better-auth`, and the database is managed with Drizzle ORM and Turso. The UI is built with Tailwind CSS and various Svelte components.

**Key Technologies:**

*   **Package manager**: Bun
*   **Framework:** [SvelteKit](https://svelte.dev/llms-full.txt)
*   **Backend API:** ElysiaJS
*   **Database:** Turso (via Drizzle ORM)
*   **Authentication:** [better-auth](https://www.better-auth.com/llms.txt)
*   **Styling:** Tailwind CSS
*   **UI Components:** [Shadcn Svelte](https://www.shadcn-svelte.com/llms.txt).
*   **Testing:** Playwright for end-to-end testing.

**Architecture:**

*   The application is structured as a monorepo with the SvelteKit frontend and ElysiaJS backend in the same project.
*   The `src/lib` directory contains shared code, including Svelte components, authentication logic, and database schemas.
*   The `src/routes` directory defines the application's pages and API endpoints.
*   The `src/routes/api/[...all]/+server.ts` file is the entry point for the ElysiaJS backend, which handles all API requests.
*   The database schema is defined in `src/lib/server/db/schema.ts` and is managed with Drizzle ORM.
*   Authentication is implemented using the `better-auth` library, with the configuration in `src/lib/auth.ts`.

## Building and Running

**Development:**

To start the development server, run:

```sh
bun run dev
```

**Building for Production:**

To create a production build, run:

```sh
bun run build
```

You can preview the production build with:

```sh
bun run preview
```

**Testing:**

To run the end-to-end tests, use:

```sh
bun run test:e2e
```

**Database:**

The project uses Drizzle ORM for database management. Here are some useful commands:

*   `bun run db:push`: Push schema changes to the database.
*   `bun run d run db:generate`: Generate database migration files.
*   `bun run d run db:migrate`: Apply generated migrations to the database.
*   `bun run d run db:studio`: Open the Drizzle DB studio.

## Development Conventions

*   **Code Style:** The project uses Prettier for code formatting and ESLint for linting. Run `npm run format` to format the code and `npm run lint` to check for linting errors.
*   **Components:** UI components are located in `src/lib/components`. Reusable UI components are in `src/lib/components/ui`.
*   **API:** The backend API is built with ElysiaJS and is located in `src/routes/api/[...all]/+server.ts`. Follow the existing patterns for adding new routes and functionality.
*   **Database:** The database schema is defined in `src/lib/server/db/schema.ts`. When making changes to the schema, be sure to generate and apply migrations.
*   **Authentication:** Authentication is handled by `better-auth`. The configuration is in `src/lib/auth.ts`. The `src/hooks.server.ts` file contains middleware for protecting routes.
