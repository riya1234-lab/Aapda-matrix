# PostgreSQL Database Setup Guide

AAPDA MATRIX is architected with **Prisma ORM** supporting both **SQLite** (default zero-config local development) and **PostgreSQL** (production high-throughput mission deployments).

## 1. Running PostgreSQL Locally via Docker
If Docker is installed:
```bash
docker run --name aapda-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=aapda_matrix \
  -p 5432:5432 -d postgres:16
```

## 2. Using Free Cloud PostgreSQL (Supabase / Neon / AWS RDS)
1. Create a free PostgreSQL instance on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy the Connection URI.
3. Open `server/.env` and update `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.example.supabase.co:5432/postgres?schema=public"
```

## 3. Switching Prisma Provider to PostgreSQL
In `server/prisma/schema.prisma`, update the datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then execute:
```bash
cd server
npx prisma generate
npx prisma db push
npm run prisma:seed
```
This migrates all tables (User, Incident, IncidentAttachment, EmergencyContact, ResponseTeam, IncidentHistory, MessageRelay) and seeds initial verified contacts and SAR teams into your PostgreSQL database.
