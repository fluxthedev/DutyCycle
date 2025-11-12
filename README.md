# DutyCycle

## Database setup
# DutyCycle Dashboard

A Next.js 14 App Router starter configured with Tailwind CSS, shadcn/ui primitives, Zustand state, TanStack Query data fetching, and a Vitest + Testing Library test harness.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and adjust as needed:
   ```bash
   cp .env.example .env
   ```
   Ensure the SQLite connection string is set:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
3. Run the initial migration and generate the Prisma client:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed demo data (one admin, one manager, three clients, ten duties):
   ```bash
   npx prisma db seed
   ```

The Prisma schema, migrations, and seed script live in the `prisma/` directory.
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:3000` to view the dashboard scaffold.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development mode. |
| `npm run build` | Build the production bundle. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint with the shared configuration. |
| `npm run test` | Execute Vitest in CI mode. |
| `npm run test:watch` | Execute Vitest in watch mode. |
| `npm run typecheck` | Run the TypeScript compiler with `--noEmit`. |
| `npm run format` | Check code formatting with Prettier. |
| `npm run format:write` | Auto-format the repository with Prettier. |

## Tooling

- **UI**: Next.js App Router, Tailwind CSS, design tokens in `app/(dashboard)/globals.css`, and reusable shadcn/ui primitives in `components/ui`.
- **State**: Zustand (local UI), TanStack Query (server state), Zod (schema validation).
- **Testing**: Vitest + React Testing Library with JSDOM environment and shared setup in `vitest.setup.ts`.

## Project structure

```
app/                # App Router routes and providers
components/         # Reusable UI and layout primitives
lib/                # Utilities and schema definitions
stores/             # Zustand stores
tests/              # Vitest unit/integration tests
```
