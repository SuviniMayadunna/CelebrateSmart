# 🎉 Backend Setup Complete!

## ✅ What's Been Created

Your CelebrateSmart application now has a complete backend authentication system!

### Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts           # MongoDB connection
│   ├── middleware/
│   │   └── auth.ts               # JWT authentication middleware
│   ├── models/
│   │   └── User.ts               # User model with validation
│   ├── routes/
│   │   └── auth.ts               # Login & Register API routes
│   ├── utils/
│   │   └── auth.ts               # Password hashing & JWT utilities
│   └── server.ts                 # Express server
├── .env                          # Environment configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── nodemon.json                  # Dev server config
├── test.http                     # API testing file
└── README.md                     # Detailed documentation
```

### Frontend Integration
```
src/
└── lib/
    └── api.ts                    # API service for backend calls
```

## 🚀 Getting Started

### Prerequisites
1. **Node.js** - Already installed ✅
2. **MongoDB** - Need to install or use MongoDB Atlas

### Option 1: MongoDB Atlas (Recommended - Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy your connection string
6. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/celebratesmart
   ```

### Option 2: Local MongoDB
1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB:
   ```bash
   mongod
   ```

## 🎬 Start Your Application

### Terminal 1: Backend Server
```bash
cd backend
npm run dev
```

Expected output:
```
╔═══════════════════════════════════════════╗
║   🎉 CelebrateSmart API Server Running   ║
║                                           ║
║   Port: 5000                             ║
║   Environment: development               ║
║   MongoDB: Connected                     ║
╚═══════════════════════════════════════════╝
```

### Terminal 2: Frontend  
```bash
npm run dev
```

Your app: http://localhost:5173
Backend API: http://localhost:5000

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/health` | Health check | No |

## 📝 Example Usage

### Register a User
```javascript
import { authAPI } from '@/lib/api';

const response = await authAPI.register({
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  phone: "+1234567890"
});

// Token is automatically saved to localStorage
console.log(response.data.user);
```

### Login
```javascript
const response = await authAPI.login({
  email: "john@example.com",
  password: "password123",
  role: "customer"
});

console.log(response.data.user);
```

### Logout
```javascript
authAPI.logout(); // Removes token from localStorage
```

## 🔒 Security Features

✅ Password hashing with bcrypt (10 rounds)
✅ JWT token authentication (7-day expiration)
✅ CORS protection
✅ Input validation
✅ Role-based access control (Customer/Admin)
✅ Protected routes with middleware

## 🧪 Testing

### Using the test.http file
1. Install "REST Client" extension in VS Code
2. Open `backend/test.http`
3. Click "Send Request" above each endpoint

### Using curl
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"test@test.com\",\"password\":\"password123\",\"phone\":\"+123456\"}"

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"
```

## 🎯 Next Steps

### 1. Integrate with Frontend Components

Update your [login-screen.tsx](src/components/login-screen.tsx):

```typescript
import { authAPI } from '@/lib/api';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await authAPI.login({ email, password, role });
    
    const newUser = {
      id: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role,
      name: response.data.user.name,
    };
    
    onLogin(newUser.email, password, newUser.role);
  } catch (error: any) {
    alert(error.message || 'Login failed');
  }
};
```

Update your [registration-screen.tsx](src/components/registration-screen.tsx):

```typescript
import { authAPI } from '@/lib/api';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ... validation code ...
  
  try {
    const response = await authAPI.register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone
    });
    
    const newUser = {
      id: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role,
      name: response.data.user.name,
    };
    
    onRegister(newUser.name, newUser.email, formData.password, formData.phone);
  } catch (error: any) {
    setError(error.message || 'Registration failed');
  }
};
```

### 2. Add Admin User

Create `backend/src/scripts/createAdmin.ts`:

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { hashPassword } from '../utils/auth';

dotenv.config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const hashedPassword = await hashPassword('admin123');
  
  await User.create({
    name: 'Admin',
    email: 'admin@celebratesmart.com',
    password: hashedPassword,
    phone: '+1234567890',
    role: 'admin'
  });
  
  console.log('✅ Admin created: admin@celebratesmart.com / admin123');
  process.exit(0);
}

createAdmin();
```

Run: `cd backend && npx ts-node src/scripts/createAdmin.ts`

### 3. Additional Backend Features to Add

- Password reset/forgot password
- Email verification
- Profile update endpoints
- Event CRUD operations
- Cart management
- Order processing
- Admin panel endpoints

## 📚 Documentation

- **Full Setup Guide**: [BACKEND_SETUP.md](BACKEND_SETUP.md)
- **Backend README**: [backend/README.md](backend/README.md)
- **API Testing**: [backend/test.http](backend/test.http)

## 🐛 Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running or Atlas connection string is correct
- Check firewall/network settings
- Verify connection string format

### Port 5000 Already in Use
- Change `PORT` in `backend/.env`
- Or kill the process using port 5000

### CORS Errors
- Ensure backend is running
- Check `CLIENT_URL` in `backend/.env` matches your frontend URL
- Restart both servers

### Token Expired
- Login again to get a new token
- Adjust `JWT_EXPIRE` in `backend/.env` for longer sessions

## 📦 Dependencies Installed

### Backend
- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- cors - CORS middleware
- dotenv - Environment variables
- express-validator - Input validation
- TypeScript & types

### Frontend
- No new dependencies needed (uses built-in fetch API)

## 🎓 What You Learned

✅ Building a RESTful API with Express & TypeScript
✅ MongoDB database integration with Mongoose
✅ JWT authentication implementation
✅ Password hashing with bcrypt
✅ API structure and best practices
✅ Environment configuration
✅ CORS and security basics

---

**Your backend is ready to use! 🚀**

Start both servers and test the registration/login flow!
