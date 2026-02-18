# WarrantyVault - Complete Folder Structure

## 📂 Project Root Structure

```
warranty-vault/
├── client/                          # Frontend (Next.js)
├── server/                          # Backend (Express)
├── README.md                        # Main documentation
├── DOCUMENTATION.md                 # Detailed technical docs
└── QUICKSTART.md                    # Setup guide
```

---

## 🎨 FRONTEND STRUCTURE (client/)

### Complete Tree View

```
client/
├── app/                             # Next.js App Router
│   ├── (auth)/                      # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   └── register/
│   │       └── page.tsx            # Register page
│   │
│   ├── dashboard/
│   │   └── page.tsx                # Dashboard page
│   │
│   ├── products/
│   │   ├── page.tsx                # Products list
│   │   └── add/
│   │       └── page.tsx            # Add product page
│   │
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   └── globals.css                 # Global styles
│
├── components/                      # React components
│   ├── ui/                         # UI primitives
│   │   ├── Button.tsx              # Reusable button
│   │   ├── Input.tsx               # Form input
│   │   └── Card.tsx                # Card container
│   │
│   ├── layout/                     # Layout components
│   │   ├── DashboardLayout.tsx    # Main layout
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   ├── Header.tsx             # Top header
│   │   └── AuthLayout.tsx         # Auth pages layout
│   │
│   ├── dashboard/                  # Dashboard widgets
│   │   ├── DashboardStats.tsx     # Stats cards
│   │   ├── ExpiringWarranties.tsx # Expiring list
│   │   └── RecentProducts.tsx     # Recent items
│   │
│   ├── products/                   # Product components
│   │   ├── ProductList.tsx        # Products grid
│   │   ├── ProductFilters.tsx     # Search/filter
│   │   └── AddProductForm.tsx     # Add form
│   │
│   ├── auth/                       # Auth components
│   │   ├── LoginForm.tsx          # Login form
│   │   └── RegisterForm.tsx       # Register form
│   │
│   └── common/                     # Shared components
│       └── LoadingSpinner.tsx     # Loading indicator
│
├── context/                        # React Context
│   ├── AuthContext.tsx            # Auth state
│   └── ThemeContext.tsx           # Theme state
│
├── hooks/                          # Custom hooks
│   ├── useAuth.ts                 # Auth hook
│   ├── useProducts.ts             # Products hook
│   └── useForm.ts                 # Form hook
│
├── services/                       # API services
│   ├── authService.ts             # Auth API calls
│   └── productService.ts          # Product API calls
│
├── lib/                            # Libraries
│   ├── apiClient.ts               # Axios config
│   └── utils.ts                   # Utilities
│
├── utils/                          # Helper functions
│   ├── date.ts                    # Date utilities
│   ├── format.ts                  # Formatters
│   └── validation.ts              # Validators
│
├── types/                          # TypeScript types
│   ├── auth.ts                    # Auth types
│   ├── product.ts                 # Product types
│   └── api.ts                     # API types
│
├── animations/                     # Framer Motion
│   └── variants.ts                # Animation variants
│
├── assets/                         # Static assets
│   └── (images, fonts, etc.)
│
├── config/                         # Configuration
│   └── constants.ts               # App constants
│
├── .env.local                      # Environment vars
├── .gitignore                      # Git ignore
├── .eslintrc.json                 # ESLint config
├── .prettierrc                    # Prettier config
├── next.config.js                 # Next.js config
├── tailwind.config.js             # Tailwind config
├── postcss.config.js              # PostCSS config
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies
```

### Frontend Folder Purposes

| Folder | Purpose | What Goes Here |
|--------|---------|----------------|
| `app/` | Pages & routing | Route pages, layouts, loading/error states |
| `components/ui/` | UI primitives | Button, Input, Card, Modal, etc. |
| `components/layout/` | Page layouts | Sidebar, Header, Footer, wrappers |
| `components/dashboard/` | Dashboard widgets | Stats, charts, recent items |
| `components/products/` | Product features | Lists, forms, filters |
| `components/auth/` | Authentication | Login, register, password reset |
| `components/common/` | Shared components | Loading, error, not found |
| `context/` | Global state | Auth, theme, user preferences |
| `hooks/` | Custom hooks | Reusable logic, data fetching |
| `services/` | API layer | HTTP requests, API endpoints |
| `lib/` | Core utilities | API client, class name merger |
| `utils/` | Helper functions | Date, format, validation utilities |
| `types/` | TypeScript types | Interfaces, type definitions |
| `animations/` | Animations | Framer Motion variants |
| `config/` | Configuration | Constants, feature flags |

---

## ⚙️ BACKEND STRUCTURE (server/)

### Complete Tree View

```
server/
├── config/                         # Configuration
│   ├── database.js                # MongoDB connection
│   └── config.js                  # App config
│
├── controllers/                    # Request handlers
│   ├── authController.js          # Auth logic
│   └── productController.js       # Product logic
│
├── routes/                         # API routes
│   ├── authRoutes.js              # /api/auth/*
│   ├── productRoutes.js           # /api/products/*
│   └── userRoutes.js              # /api/users/*
│
├── models/                         # Database models
│   ├── User.js                    # User schema
│   └── Product.js                 # Product schema
│
├── middleware/                     # Express middleware
│   ├── auth.js                    # JWT verification
│   ├── errorHandler.js            # Error handling
│   └── upload.js                  # File upload
│
├── services/                       # Business logic
│   ├── warrantyService.js         # Warranty calculations
│   └── emailService.js            # Email sender
│
├── utils/                          # Utilities
│   ├── jwt.js                     # JWT helpers
│   └── logger.js                  # Winston logger
│
├── validators/                     # Input validation
│   └── validators.js              # Validation rules
│
├── uploads/                        # File storage
│   └── .gitkeep                   # Keep folder
│
├── constants/                      # Constants
│   └── constants.js               # App constants
│
├── jobs/                           # Background jobs
│   └── (future: queue jobs)
│
├── cron/                           # Scheduled tasks
│   └── warrantyReminders.js       # Daily reminders
│
├── logs/                           # Log files
│   └── .gitkeep                   # Keep folder
│
├── tests/                          # Test files
│   └── auth.test.js               # Auth tests
│
├── .env                            # Environment vars
├── .gitignore                      # Git ignore
├── server.js                       # Entry point
└── package.json                    # Dependencies
```

### Backend Folder Purposes

| Folder | Purpose | What Goes Here |
|--------|---------|----------------|
| `config/` | Configuration | Database, JWT, email, upload settings |
| `controllers/` | Request handling | Parse request, call services, send response |
| `routes/` | API endpoints | Define routes, attach middleware |
| `models/` | Database schemas | Mongoose models, validations, hooks |
| `middleware/` | Request pipeline | Auth, validation, upload, error handling |
| `services/` | Business logic | Core functionality, calculations |
| `utils/` | Helper functions | JWT, logging, formatting |
| `validators/` | Input validation | Express-validator rules |
| `uploads/` | File storage | User-uploaded files (invoices) |
| `constants/` | Constants | Status codes, categories, enums |
| `jobs/` | Queue jobs | Future: Bull/Bee queue jobs |
| `cron/` | Scheduled tasks | Daily/weekly background tasks |
| `logs/` | Application logs | Error logs, combined logs |
| `tests/` | Test files | Unit tests, integration tests |

---

## 🔑 Key Files Explained

### Frontend Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers (Auth, Theme) |
| `app/page.tsx` | Landing/home page |
| `app/globals.css` | Tailwind imports + global styles |
| `lib/apiClient.ts` | Configured Axios with interceptors |
| `context/AuthContext.tsx` | Global auth state management |
| `hooks/useAuth.ts` | Access auth context easily |
| `services/authService.ts` | All auth API calls |
| `types/product.ts` | Product TypeScript types |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | Tailwind customization |
| `tsconfig.json` | TypeScript compiler options |

### Backend Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express app entry point |
| `config/database.js` | MongoDB connection logic |
| `models/User.js` | User schema with password hashing |
| `models/Product.js` | Product schema with auto-calculations |
| `middleware/auth.js` | JWT token verification |
| `middleware/errorHandler.js` | Centralized error handling |
| `controllers/authController.js` | Login, register, logout |
| `controllers/productController.js` | CRUD operations |
| `services/warrantyService.js` | Warranty business logic |
| `services/emailService.js` | Email sending (Nodemailer) |
| `cron/warrantyReminders.js` | Daily reminder job |
| `.env` | Environment variables |

---

## 📊 Data Flow

### Frontend Data Flow

```
User Action
    ↓
Component (onClick, onSubmit)
    ↓
Hook (useAuth, useProducts)
    ↓
Service (authService.login())
    ↓
API Client (Axios)
    ↓
Backend API
    ↓
Response
    ↓
Update State (Context/Hook)
    ↓
Re-render Component
```

### Backend Data Flow

```
HTTP Request
    ↓
Route (/api/products)
    ↓
Middleware (auth, validation)
    ↓
Controller (productController.createProduct)
    ↓
Service (warrantyService.calculateExpiry)
    ↓
Model (Product.create)
    ↓
Database (MongoDB)
    ↓
Response
    ↓
Client
```

---

## 🎯 File Naming Conventions

### Frontend
- **Components**: PascalCase (`Button.tsx`, `LoginForm.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Services**: camelCase with `Service` suffix (`authService.ts`)
- **Types**: camelCase (`auth.ts`, `product.ts`)
- **Utils**: camelCase (`date.ts`, `format.ts`)

### Backend
- **Models**: PascalCase (`User.js`, `Product.js`)
- **Controllers**: camelCase with `Controller` suffix (`authController.js`)
- **Routes**: camelCase with `Routes` suffix (`authRoutes.js`)
- **Services**: camelCase with `Service` suffix (`warrantyService.js`)
- **Middleware**: camelCase (`auth.js`, `errorHandler.js`)

---

## 📦 Package Dependencies

### Frontend Packages

**Core:**
- `next` - React framework
- `react` - UI library
- `react-dom` - React DOM renderer
- `typescript` - Type safety

**Styling:**
- `tailwindcss` - Utility CSS
- `clsx` - Class names
- `tailwind-merge` - Merge Tailwind classes

**HTTP & State:**
- `axios` - HTTP client
- `zustand` - State management

**UI/UX:**
- `framer-motion` - Animations
- `react-hot-toast` - Notifications
- `date-fns` - Date utilities

### Backend Packages

**Core:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables

**Authentication:**
- `jsonwebtoken` - JWT
- `bcryptjs` - Password hashing

**Security:**
- `helmet` - Security headers
- `cors` - CORS handling

**Utilities:**
- `multer` - File upload
- `nodemailer` - Email sending
- `winston` - Logging
- `node-cron` - Scheduled tasks
- `express-validator` - Input validation

**Development:**
- `nodemon` - Auto-restart
- `jest` - Testing
- `supertest` - API testing

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Configure environment:**
   - Copy `.env` files
   - Update MongoDB connection
   - Set JWT secret

3. **Start development:**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

4. **Access application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

---

## 📚 Documentation Links

- [README.md](./README.md) - Main documentation
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Detailed technical docs
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide

---

**Created for WarrantyVault SaaS Platform**
