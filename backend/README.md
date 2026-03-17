# CelebrateSmart Backend API - PostgreSQL Edition

Backend server for the CelebrateSmart event planning application with authentication using PostgreSQL and Prisma ORM.

## Features

- ✅ User Registration
- ✅ User Login  
- ✅ JWT Authentication
- ✅ Password Hashing with bcrypt
- ✅ **PostgreSQL Database** with Prisma ORM
- ✅ TypeScript Support
- ✅ Role-based Access Control (Customer/Admin)
- ✅ Input Validation
- ✅ Type-safe database queries

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **Prisma** - Next-generation ORM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Quick Start

### 1. Install PostgreSQL

**Windows:** Download from https://www.postgresql.org/download/windows/
**macOS:** `brew install postgresql && brew services start postgresql`
**Linux:** `sudo apt install postgresql postgresql-contrib`

### 2. Create Database

```bash
psql -U postgres
CREATE DATABASE celebratesmart;
\q
```

### 3. Configure Environment

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/celebratesmart
```

### 4. Install & Setup

```bash
npm install
npm run prisma:migrate  # Creates database tables
npm run prisma:generate # Generates Prisma Client
npm run dev             # Start server
```

Server runs at http://localhost:5000

## Prisma Commands

```bash
npm run prisma:migrate   # Create and apply migrations
npm run prisma:generate  # Generate Prisma Client
npm run prisma:studio    # Open database GUI at http://localhost:5555
npx prisma migrate reset # Reset database (deletes data)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (requires auth) |
| GET | `/api/health` | Health check |

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  phone     String
  role      Role     @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  CUSTOMER
  ADMIN
}
```

## Create Admin User

```bash
# Create src/scripts/createAdmin.ts
npx ts-node src/scripts/createAdmin.ts
```

```typescript
import prisma from '../config/database';
import { hashPassword } from '../utils/auth';

async function createAdmin() {
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@celebratesmart.com',
      password: await hashPassword('admin123'),
      phone: '+1234567890',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created:', admin.email);
}

createAdmin().finally(() => prisma.$disconnect());
```

## Troubleshooting

**Connection Error:** Check PostgreSQL is running and DATABASE_URL is correct
**Migration Failed:** Try `npx prisma migrate reset`
**Prisma Client Error:** Run `npm run prisma:generate`

## Production Deployment

1. Use managed PostgreSQL (Railway, Neon, Supabase)
2. Set strong JWT_SECRET
3. Enable SSL: `DATABASE_URL=postgresql://...?sslmode=require`
4. Set NODE_ENV=production

## License

ISC
