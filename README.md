# DutyCycle

## Database setup

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
