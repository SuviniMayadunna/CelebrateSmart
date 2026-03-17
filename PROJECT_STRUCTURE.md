# 📁 CelebrateSmart - Project Structure

## Overview

This is a full-stack event planning application with a clean separation between frontend and backend.

```
celebrate-smart-app/
│
├── 📂 frontend/                    Frontend Application (React + Vite)
│   ├── 📂 src/                     Source code
│   │   ├── 📄 App.tsx              Main app component with routing
│   │   ├── 📄 main.tsx             Entry point
│   │   ├── 📄 index.css            Global styles
│   │   │
│   │   ├── 📂 components/          React components
│   │   │   ├── welcome-screen.tsx
│   │   │   ├── login-screen.tsx
│   │   │   ├── registration-screen.tsx
│   │   │   ├── dashboard-screen.tsx
│   │   │   ├── event-creation-screen.tsx
│   │   │   ├── event-planning-screen.tsx
│   │   │   ├── event-template-screen.tsx
│   │   │   ├── event-plan-viewer.tsx
│   │   │   ├── my-events-screen.tsx
│   │   │   ├── shop-screen.tsx
│   │   │   ├── cart-screen.tsx
│   │   │   ├── checkout-screen.tsx
│   │   │   ├── confirmation-screen.tsx
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── navigation.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── 📂 ui/              shadcn/ui components (40+ components)
│   │   │
│   │   ├── 📂 hooks/               Custom React hooks
│   │   │   ├── use-mobile.ts
│   │   │   └── use-toast.ts
│   │   │
│   │   └── 📂 lib/                 Utilities and API client
│   │       ├── utils.ts            Helper functions
│   │       └── api.ts              Backend API client
│   │
│   ├── 📂 public/                  Static assets
│   ├── 📂 node_modules/            Frontend dependencies
│   │
│   ├── 📄 index.html               HTML template
│   ├── 📄 package.json             Frontend dependencies & scripts
│   ├── 📄 vite.config.ts           Vite configuration
│   ├── 📄 tsconfig.json            TypeScript config
│   ├── 📄 tsconfig.node.json       TypeScript config for Node
│   ├── 📄 tailwind.config.js       Tailwind CSS config
│   ├── 📄 postcss.config.mjs       PostCSS config
│   ├── 📄 components.json          shadcn/ui config
│   ├── 📄 .env                     Environment variables
│   └── 📄 .env.example             Environment template
│
├── 📂 backend/                     Backend API (Node.js + Express)
│   ├── 📂 src/                     Source code
│   │   ├── 📄 server.ts            Main server file
│   │   │
│   │   ├── 📂 config/              Configuration
│   │   │   └── database.ts         Database connection
│   │   │
│   │   ├── 📂 middleware/          Express middleware
│   │   │   └── auth.ts             JWT authentication
│   │   │
│   │   ├── 📂 routes/              API routes
│   │   │   └── auth.ts             Authentication routes
│   │   │
│   │   ├── 📂 utils/               Utilities
│   │   │   └── auth.ts             JWT & password utilities
│   │   │
│   │   ├── 📂 scripts/             Utility scripts
│   │   │   └── createAdmin.ts      Create admin user
│   │   │
│   │   └── 📂 models/              (Reserved for future models)
│   │
│   ├── 📂 prisma/                  Database schema & migrations
│   │   └── schema.prisma           Prisma schema (PostgreSQL)
│   │
│   ├── 📂 node_modules/            Backend dependencies
│   │
│   ├── 📄 package.json             Backend dependencies & scripts
│   ├── 📄 tsconfig.json            TypeScript config
│   ├── 📄 nodemon.json             Nodemon config
│   ├── 📄 test.http                API testing file
│   ├── 📄 .env                     Environment variables
│   └── 📄 .env.example             Environment template
│
├── 📂 node_modules/                Root dependencies
│
├── 📄 package.json                 Root scripts to run both servers
├── 📄 .gitignore                   Git ignore rules
│
├── 📄 README.md                    Main documentation (START HERE!)
├── 📄 BACKEND_SETUP.md             Backend setup guide
├── 📄 POSTGRESQL_SETUP.md          Database setup guide
└── 📄 BACKEND_COMPLETE.md          Backend features documentation
```

## 🎯 Key Features by Folder

### Frontend (`/frontend`)
- **UI Components**: 15+ screens for event planning
- **shadcn/ui**: 40+ reusable UI components
- **API Integration**: Centralized API client in `lib/api.ts`
- **Authentication**: Login/Register with JWT token storage
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Theming**: Dark/Light mode support

### Backend (`/backend`)
- **REST API**: Express server with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth system
- **Security**: bcrypt password hashing, CORS protection
- **Validation**: express-validator for request validation
- **Development**: Hot reload with nodemon

## 🚀 Quick Commands

### Development
```bash
# Run both frontend & backend together
npm run dev

# Run separately
npm run dev:frontend     # http://localhost:5173
npm run dev:backend      # http://localhost:5000
```

### Build
```bash
npm run build:frontend   # Build frontend for production
npm run build:backend    # Compile backend TypeScript
```

### Install
```bash
npm run install:all      # Install all dependencies
npm run install:frontend # Frontend only
npm run install:backend  # Backend only
```

## 🔗 Service Communication

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                    │
│  Port: 5173                                 │
│  ├── UI Components                          │
│  ├── API Client (lib/api.ts)                │
│  └── Environment: VITE_API_URL              │
│              │                              │
│              │ HTTP Requests                │
│              ▼                              │
├─────────────────────────────────────────────┤
│  Backend (Express + Node.js)                │
│  Port: 5000                                 │
│  ├── REST API Routes                        │
│  ├── JWT Authentication                     │
│  ├── Prisma ORM                             │
│  └── Environment: DATABASE_URL              │
│              │                              │
│              │ SQL Queries                  │
│              ▼                              │
├─────────────────────────────────────────────┤
│  Database (PostgreSQL)                      │
│  Port: 5432                                 │
│  └── Tables: User, Event, etc.              │
└─────────────────────────────────────────────┘
```

## 📝 Environment Variables

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend `.env`
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/celebratesmart
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 3 |
| **UI Components** | shadcn/ui + Radix UI |
| **Backend Framework** | Express 4 + Node.js |
| **API Language** | TypeScript |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma 5 |
| **Authentication** | JWT + bcrypt |
| **Dev Tools** | nodemon, concurrently |

## 📦 Dependencies Count

- **Frontend**: ~50 packages (React, Vite, Tailwind, shadcn/ui)
- **Backend**: ~20 packages (Express, Prisma, JWT, bcrypt)
- **Root**: 1 package (concurrently)

## 🎨 UI Component Library

The frontend includes 40+ pre-built shadcn/ui components in `frontend/src/components/ui/`:

- Forms: Input, Textarea, Select, Checkbox, Radio, Switch
- Feedback: Alert, Toast, Dialog, Progress, Spinner
- Layout: Card, Sheet, Tabs, Accordion, Separator
- Navigation: Menu, Breadcrumb, Pagination, Sidebar
- Data: Table, Calendar, Chart
- And many more!

## 📚 Next Steps

1. **First Time Setup**: Read [README.md](README.md)
2. **Database Setup**: Follow [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)
3. **Backend Details**: Check [BACKEND_SETUP.md](BACKEND_SETUP.md)
4. **Start Development**: Run `npm run dev`

---

**Note**: This structure follows industry best practices with clear separation of concerns, making the codebase maintainable and scalable.
