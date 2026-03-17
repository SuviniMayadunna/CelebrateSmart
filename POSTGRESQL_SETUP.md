# 🎉 Backend Converted to PostgreSQL!

## ✅ Changes Made

Your backend has been successfully converted from MongoDB to **PostgreSQL with Prisma ORM**!

### What Changed

1. **Database:** MongoDB → PostgreSQL
2. **ORM:** Mongoose → Prisma
3. **Dependencies:** Updated package.json
4. **Schema:** Created `prisma/schema.prisma`
5. **Database Client:** Updated to use Prisma Client
6. **Auth Routes:** Updated to use Prisma queries

## 🗄️ Database Schema

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

## 🚀 Setup PostgreSQL

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL:**
   - Windows: https://www.postgresql.org/download/windows/
   - Download and install with default settings
   - Remember your password!

2. **Create Database:**
   ```bash
   # Open Command Prompt or PowerShell
   psql -U postgres
   # Enter your PostgreSQL password
   
   # In psql console:
   CREATE DATABASE celebratesmart;
   \q
   ```

3. **Update `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/celebratesmart
   ```
   Replace `YOUR_PASSWORD` with your actual PostgreSQL password

### Option 2: Cloud PostgreSQL (Easy Setup)

**Neon (Free, recommended):**
1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project
4. Copy the connection string
5. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

**Railway (Free tier):**
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Provision PostgreSQL
4. Copy connection string from Variables tab
5. Update `backend/.env`

## 📦 Install & Run

```bash
cd backend

# Install new dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# Start server
npm run dev
```

## 🎯 Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create migration (when you change schema)
npm run prisma:migrate

# Open Prisma Studio (Database GUI in browser)
npm run prisma:studio

# View your database visually at http://localhost:5555
```

## 📝 Example: Register & Login

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"password123\",\"phone\":\"+123456\"}"
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"
```

## 🔧 Create Admin User

Create file `backend/src/scripts/createAdmin.ts`:

```typescript
import prisma from '../config/database';
import { hashPassword } from '../utils/auth';

async function createAdmin() {
  const hashedPassword = await hashPassword('admin123');
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@celebratesmart.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'ADMIN'
    }
  });
  
  console.log('✅ Admin created:', admin);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
npx ts-node src/scripts/createAdmin.ts
```

## 🎨 Prisma Studio

View and edit your database visually:

```bash
npm run prisma:studio
```

Opens at http://localhost:5555 - you can:
- View all users
- Create/edit/delete records
- Filter and search
- Export data

## 📚 Key Differences: Prisma vs Mongoose

### Creating a User

**Mongoose:**
```typescript
const user = await User.create({ name, email, password });
```

**Prisma:**
```typescript
const user = await prisma.user.create({
  data: { name, email, password }
});
```

### Finding a User

**Mongoose:**
```typescript
const user = await User.findOne({ email });
```

**Prisma:**
```typescript
const user = await prisma.user.findUnique({
  where: { email }
});
```

### Updating

**Mongoose:**
```typescript
await User.findByIdAndUpdate(id, { name: 'New Name' });
```

**Prisma:**
```typescript
await prisma.user.update({
  where: { id },
  data: { name: 'New Name' }
});
```

## ✨ Benefits of PostgreSQL + Prisma

✅ **Type Safety** - Full TypeScript support with auto-completion
✅ **Relations** - Easy to add relationships between models
✅ **Migrations** - Track database changes over time
✅ **Studio** - Visual database browser
✅ **Performance** - Optimized queries
✅ **SQL Power** - Full SQL capabilities when needed

## 🐛 Troubleshooting

### PostgreSQL Not Running

**Windows:**
- Open Services (services.msc)
- Find "PostgreSQL" service
- Click "Start"

**Or reinstall:** https://www.postgresql.org/download/

### Connection Error

```
Error: Can't reach database server at `localhost:5432`
```

**Solutions:**
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Check username/password are correct
4. Try: `psql -U postgres` to test connection

### Migration Failed

```bash
npx prisma migrate reset  # WARNING: Deletes all data
npm run prisma:migrate
```

### Prisma Client Error

```bash
npm run prisma:generate
```

## 🎯 Next Steps

1. ✅ Install PostgreSQL
2. ✅ Update DATABASE_URL in `backend/.env`
3. ✅ Run `npm install` in backend folder
4. ✅ Run `npm run prisma:migrate`
5. ✅ Run `npm run dev`
6. ✅ Test registration and login!

## 📖 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Backend README](backend/README.md)

---

**Your backend is now using PostgreSQL! 🚀**

The frontend integration remains the same - no changes needed there!
