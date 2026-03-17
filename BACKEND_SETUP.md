# CelebrateSmart - Backend Integration Guide

## 🎉 Complete Backend Setup for Authentication

Your backend is now ready with a full authentication system! This guide will help you get everything running.

## 📁 Project Structure

```
celebrate-smart-app-development/
├── backend/                    # Backend server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts    # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT authentication middleware
│   │   ├── models/
│   │   │   └── User.ts        # User model with validation
│   │   ├── routes/
│   │   │   └── auth.ts        # Login & register routes
│   │   ├── utils/
│   │   │   └── auth.ts        # JWT & bcrypt utilities
│   │   └── server.ts          # Main server file
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── src/                       # Frontend
│   ├── lib/
│   │   └── api.ts            # NEW: API service for backend calls
│   └── components/
│       ├── login-screen.tsx
│       └── registration-screen.tsx
└── .env                      # Frontend environment variables
```

## 🚀 Quick Start

### Step 1: Start MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB from https://www.mongodb.com/try/download/community
# Then start it:
mongod
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (free tier)
4. Get your connection string
5. Update `backend/.env` with your connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/celebratesmart
   ```

### Step 2: Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════╗
║   🎉 CelebrateSmart API Server Running   ║
║                                           ║
║   Port: 5000                             ║
║   Environment: development               ║
║   MongoDB: Connected                     ║
╚═══════════════════════════════════════════╝
```

### Step 3: Start Frontend

Open a new terminal:
```bash
npm run dev
```

Your app will run at http://localhost:5173

## 🔧 Backend Configuration

### Environment Variables (backend/.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/celebratesmart
JWT_SECRET=celebratesmart-super-secret-jwt-key-change-in-production-2026
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**Important Security Notes:**
- ⚠️ Change `JWT_SECRET` to a random string in production
- ⚠️ Never commit `.env` files to git
- ✅ Use strong passwords
- ✅ Use HTTPS in production

## 🔌 API Endpoints

### Register User
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### Login User
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

### Get Current User (Protected)
```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer <your-jwt-token>
```

## 💻 Using the API in Your Frontend

The API service is already created at `src/lib/api.ts`. Here's how to use it:

### Example: Update Login Screen

```typescript
import { authAPI } from '@/lib/api';

const handleLogin = async (email: string, password: string, role: 'customer' | 'admin') => {
  try {
    const response = await authAPI.login({ email, password, role });
    
    // Update your app state
    const newUser = {
      id: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role,
      name: response.data.user.name,
    };
    
    setUser(newUser);
    handleNavigate(role === 'admin' ? 'admin-dashboard' : 'dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    alert(error.message);
  }
};
```

### Example: Update Registration Screen

```typescript
import { authAPI } from '@/lib/api';

const handleRegister = async (name: string, email: string, password: string, phone: string) => {
  try {
    const response = await authAPI.register({ name, email, password, phone });
    
    // Update your app state
    const newUser = {
      id: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role,
      name: response.data.user.name,
    };
    
    setUser(newUser);
    handleNavigate('dashboard');
  } catch (error) {
    console.error('Registration failed:', error);
    alert(error.message);
  }
};
```

### Example: Logout

```typescript
import { authAPI } from '@/lib/api';

const handleLogout = () => {
  authAPI.logout(); // Removes token from localStorage
  setUser(null);
  handleNavigate('welcome');
};
```

## 🧪 Testing the Backend

### Using cURL

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"phone\":\"+1234567890\"}"
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### Using VS Code REST Client Extension

Create a file `backend/test.http`:

```http
### Register User
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "+1234567890"
}

### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "role": "customer"
}

### Get Current User (use token from login response)
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

## 🔒 Security Features

✅ **Password Security**
- Passwords hashed with bcrypt (10 rounds)
- Never stored or returned in plain text
- Minimum 6 characters enforced

✅ **JWT Authentication**
- Secure token-based auth
- 7-day expiration (configurable)
- Stored in localStorage

✅ **Input Validation**
- Email format validation
- Required field checking
- Custom error messages

✅ **Role-Based Access**
- Customer and Admin roles
- Role verification on login
- Protected routes with middleware

✅ **Database Security**
- Unique email constraint
- Indexed queries for performance
- Mongoose schema validation

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Error:** `MongooseServerSelectionError`

**Solutions:**
1. Make sure MongoDB is running: `mongod`
2. Check connection string in `backend/.env`
3. For Atlas: Whitelist your IP address
4. Check firewall settings

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
1. Change port in `backend/.env`: `PORT=5001`
2. Or kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:5000 | xargs kill -9
   ```

### CORS Errors

**Error:** `Access to fetch blocked by CORS policy`

**Solutions:**
1. Make sure backend is running
2. Check `CLIENT_URL` in `backend/.env` matches your frontend URL
3. Restart both frontend and backend

### Token Expired

**Error:** `Invalid or expired token`

**Solutions:**
1. Login again to get a new token
2. Adjust `JWT_EXPIRE` in `backend/.env` for longer sessions

## 📈 Next Steps

### 1. Create Admin Seed User

Add this script to `backend/src/scripts/createAdmin.ts`:

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { hashPassword } from '../utils/auth';

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    const hashedPassword = await hashPassword('admin123');
    
    await User.create({
      name: 'Admin User',
      email: 'admin@celebratesmart.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin'
    });
    
    console.log('✅ Admin user created');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
```

Run: `ts-node src/scripts/createAdmin.ts`

### 2. Add More Features

Consider adding:
- Password reset functionality
- Email verification
- Profile update endpoints
- Session management
- Refresh tokens
- Social auth (Google, Facebook)

### 3. Production Deployment

When deploying:
1. Use MongoDB Atlas for database
2. Set strong `JWT_SECRET`
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Use environment variables in your hosting platform
6. Consider using services like:
   - Backend: Heroku, Railway, Render, DigitalOcean
   - Database: MongoDB Atlas
   - Frontend: Vercel, Netlify

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)

## 🆘 Need Help?

If you encounter issues:
1. Check the terminal logs for both frontend and backend
2. Use browser DevTools Network tab to inspect API calls
3. Test backend endpoints with cURL or Postman
4. Check MongoDB is running and accessible

---

**Backend is ready! 🎉** You now have a complete authentication system with user registration and login.
