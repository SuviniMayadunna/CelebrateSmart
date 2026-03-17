# CelebrateSmart - Full Stack Event Planning Application

Your one-stop celebration solution for event planning and shopping, built with React.js (Vite) frontend and Node.js/Express backend with PostgreSQL.

## 📁 Project Structure

```
celebrate-smart-app/
├── frontend/                  # React.js frontend (Vite)
│   ├── src/
│   │   ├── App.tsx           # Main application component
│   │   ├── main.tsx          # Application entry point
│   │   ├── components/       # All UI components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utility functions & API client
│   ├── public/               # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── .env                  # Frontend environment variables
│
├── backend/                   # Node.js/Express backend
│   ├── src/
│   │   ├── server.ts         # Main server file
│   │   ├── config/           # Database configuration
│   │   ├── middleware/       # Authentication middleware
│   │   ├── routes/           # API routes
│   │   └── utils/            # Utility functions
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   └── .env                  # Backend environment variables
│
├── package.json              # Root package.json with scripts
├── README.md                 # THIS FILE
├── BACKEND_SETUP.md          # Backend setup instructions
└── POSTGRESQL_SETUP.md       # Database setup instructions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm package manager

### 1. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install separately:
npm run install:frontend
npm run install:backend
```

### 2. Configure Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/celebratesmart
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 3. Setup Database

See [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md) for detailed database setup instructions.

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Run the Application

**Run both frontend and backend together:**
```bash
npm run dev
```

**Or run separately:**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## 📜 Available Scripts

### Root Level
- `npm run dev` - Run both frontend and backend concurrently
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only
- `npm run install:all` - Install all dependencies
- `npm run build:frontend` - Build frontend for production
- `npm run build:backend` - Build backend for production

### Frontend Scripts
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Backend Scripts
```bash
cd backend
npm run dev                # Start development server with nodemon
npm run build              # Build TypeScript to JavaScript
npm start                  # Run production server
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio
```

## 🎨 Tech Stack

### Frontend
- **React.js 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Hook Form** - Form validation
- **Lucide React** - Icon library

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📚 Documentation

- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Complete backend setup guide
- [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md) - Database setup guide
- [BACKEND_COMPLETE.md](BACKEND_COMPLETE.md) - Backend features documentation
pnpm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🛠️ Technologies

- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icons
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📦 Features

- 🎨 Event planning and management
- 🛒 Shopping cart functionality
- 👤 User authentication (Customer & Admin roles)
- 📊 Admin dashboard
- 🎭 Event templates
- 📅 Event scheduling
- 💳 Checkout process
- 🌙 Dark mode support (via next-themes)
- 📱 Responsive design

## 🎯 Application Flow

1. **Welcome Screen** - Landing page
2. **Login** - User authentication
3. **Dashboard** - User's event overview
4. **Event Templates** - Pre-built event types
5. **Event Creation** - Create custom events
6. **Event Planning** - Manage event tasks
7. **Shop** - Browse and add items to cart
8. **Cart** - Review selected items
9. **Checkout** - Complete purchase
10. **Confirmation** - Order confirmation

## 📝 Notes

- The application uses client-side routing through state management
- No backend is implemented - all data is stored in React state
- Admin features are available when logging in with admin role

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

Private project - All rights reserved
