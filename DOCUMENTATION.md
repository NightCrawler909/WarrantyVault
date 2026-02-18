# WarrantyVault - Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Folder Structure Explained](#folder-structure-explained)
4. [Development Setup](#development-setup)
5. [Best Practices](#best-practices)
6. [Scalability Guide](#scalability-guide)

---

## Project Overview

WarrantyVault is a full-stack SaaS application designed to help users manage product warranties efficiently. The application allows users to:

- Track product warranties with expiry dates
- Upload and store invoices/receipts
- Receive email reminders before warranty expiration
- View dashboard statistics
- Manage products with CRUD operations

---

## Architecture

### Frontend Architecture

**Pattern**: Component-Based Architecture with Next.js App Router

```
User Interface Layer
    ↓
Components (Presentation)
    ↓
Hooks (Logic & State)
    ↓
Services (API Layer)
    ↓
API Client (HTTP)
```

#### Key Principles:
1. **Separation of Concerns**: UI, logic, and data fetching are separated
2. **Reusability**: Components are modular and reusable
3. **Type Safety**: TypeScript for compile-time error checking
4. **Context API**: Global state management for auth and theme

### Backend Architecture

**Pattern**: MVC (Model-View-Controller) + Service Layer

```
Client Request
    ↓
Routes (Routing)
    ↓
Middleware (Auth, Validation, Upload)
    ↓
Controllers (Request Handling)
    ↓
Services (Business Logic)
    ↓
Models (Database)
    ↓
Response
```

#### Key Principles:
1. **Layered Architecture**: Clear separation between layers
2. **Service Layer**: Business logic isolated from controllers
3. **Middleware Pattern**: Authentication, validation, error handling
4. **Error Handling**: Centralized error handling with custom error classes

---

## Folder Structure Explained

### Client (Frontend)

#### `/app` - Next.js App Router
**Purpose**: Define routes and pages using file-system based routing

- **`(auth)/`**: Route group for authentication (login/register)
  - Parentheses create a group without affecting URL
  - Shared layout for auth pages
  
- **`dashboard/`**: Main dashboard after login
  - Statistics and overview
  
- **`products/`**: Product management
  - List, add, edit, delete products
  
- **`layout.tsx`**: Root layout with providers
  - Wraps entire app
  - Contains AuthProvider, ThemeProvider
  
- **`page.tsx`**: Home/landing page
  
- **`globals.css`**: Global styles and Tailwind imports

#### `/components` - React Components
**Purpose**: Reusable UI components organized by domain

- **`ui/`**: Primitive components (Button, Input, Card)
  - Highly reusable
  - No business logic
  - Styled with Tailwind
  
- **`layout/`**: Layout components
  - **Sidebar**: Navigation menu
  - **Header**: Top bar with user info
  - **DashboardLayout**: Combines Sidebar + Header
  - **AuthLayout**: Centered layout for auth pages
  
- **`dashboard/`**: Dashboard-specific widgets
  - **DashboardStats**: Warranty statistics cards
  - **ExpiringWarranties**: List of soon-to-expire warranties
  - **RecentProducts**: Recently added products
  
- **`products/`**: Product-related components
  - **ProductList**: Display all products
  - **ProductFilters**: Filter and search
  - **AddProductForm**: Form to add new product
  
- **`auth/`**: Authentication components
  - **LoginForm**: Login functionality
  - **RegisterForm**: User registration
  
- **`common/`**: Shared components
  - LoadingSpinner, ErrorBoundary, etc.

#### `/context` - React Context
**Purpose**: Global state management

- **AuthContext**: User authentication state
  - Current user info
  - Login/logout functions
  - Token management
  
- **ThemeContext**: Theme management
  - Light/dark mode toggle
  - Persist preference

#### `/hooks` - Custom Hooks
**Purpose**: Reusable logic and state management

- **useAuth**: Authentication utilities
  - Access to AuthContext
  - Login/logout helpers
  
- **useProducts**: Product data fetching
  - Fetch products, stats, expiring items
  - Loading states
  
- **useForm**: Form handling
  - Form state management
  - Validation
  - Submit handling

#### `/services` - API Layer
**Purpose**: Abstract API calls from components

- **authService**: Authentication API
  - login, register, getCurrentUser
  
- **productService**: Product API
  - CRUD operations
  - Stats, expiring products
  - Upload invoices

#### `/lib` - Libraries & Utilities
**Purpose**: Core utilities and configurations

- **apiClient**: Configured Axios instance
  - Base URL
  - Interceptors for auth token
  - Error handling
  
- **utils**: General utilities
  - `cn()` function for class names

#### `/utils` - Helper Functions
**Purpose**: Standalone utility functions

- **date.ts**: Date operations
  - formatDate, getDaysRemaining
  - isExpiringSoon, isExpired
  
- **format.ts**: Data formatting
  - Currency, text truncation
  - Email validation
  
- **validation.ts**: Client validation
  - File size, file type validation

#### `/types` - TypeScript Types
**Purpose**: Type definitions for type safety

- **auth.ts**: User, AuthResponse, LoginCredentials
- **product.ts**: Product, ProductFormData, ProductStats
- **api.ts**: ApiError, ApiResponse

#### `/animations` - Framer Motion
**Purpose**: Animation variants for consistent animations

- fadeIn, slideUp, slideDown, scale variants

#### `/config` - Configuration
**Purpose**: App-wide constants

- API URLs, app name, version

---

### Server (Backend)

#### `/config` - Configuration
**Purpose**: Application configuration

- **database.js**: MongoDB connection
  - Connection string
  - Error handling
  
- **config.js**: App settings
  - JWT config
  - Email settings
  - Upload limits
  - Pagination defaults

#### `/models` - Mongoose Models
**Purpose**: Database schemas and models

- **User.js**: User schema
  - Name, email, password (hashed)
  - Email verification
  - Password reset tokens
  - Pre-save hooks for password hashing
  - Method to compare passwords
  
- **Product.js**: Product schema
  - Product details
  - Warranty information
  - Status (active, expiring-soon, expired)
  - Pre-save hooks for calculations
  - Auto-update warranty status

#### `/controllers` - Request Handlers
**Purpose**: Handle HTTP requests and responses

- **authController**: Authentication logic
  - register: Create new user
  - login: Authenticate user
  - getMe: Get current user
  - logout: End session
  
- **productController**: Product operations
  - getAllProducts: List user's products
  - getProduct: Single product details
  - createProduct: Add new product
  - updateProduct: Edit product
  - deleteProduct: Remove product
  - getStats: Warranty statistics
  - getExpiringProducts: Products expiring soon
  - uploadInvoice: Upload receipt/invoice

#### `/routes` - API Routes
**Purpose**: Define API endpoints

- **authRoutes**: `/api/auth/*`
  - POST /register
  - POST /login
  - GET /me
  - POST /logout
  
- **productRoutes**: `/api/products/*`
  - GET / - List all
  - POST / - Create
  - GET /:id - Get one
  - PUT /:id - Update
  - DELETE /:id - Delete
  - GET /stats - Statistics
  - GET /expiring - Expiring products
  - POST /:id/invoice - Upload file
  
- **userRoutes**: `/api/users/*`
  - Future user profile operations

#### `/middleware` - Express Middleware
**Purpose**: Request processing pipeline

- **auth.js**: JWT authentication
  - Extract token from header
  - Verify token
  - Attach user to request
  - Handle unauthorized access
  
- **errorHandler.js**: Error handling
  - Catch all errors
  - Format error responses
  - Log errors
  - Handle Mongoose errors
  
- **upload.js**: File upload
  - Multer configuration
  - File storage
  - File filtering (type, size)

#### `/services` - Business Logic
**Purpose**: Core business logic separated from controllers

- **warrantyService**: Warranty calculations
  - Calculate expiry dates
  - Get statistics
  - Check expiry status
  - Get products needing reminders
  
- **emailService**: Email functionality
  - Send warranty reminders
  - Send welcome emails
  - Nodemailer configuration

#### `/utils` - Utilities
**Purpose**: Helper functions

- **jwt.js**: JWT operations
  - Generate token
  - Verify token
  
- **logger.js**: Winston logger
  - Log to files (error.log, combined.log)
  - Console logging in development
  - JSON format for production

#### `/validators` - Input Validation
**Purpose**: Validate request data

- Express-validator rules for:
  - Registration
  - Login
  - Product creation
  - MongoDB ObjectId format

#### `/cron` - Scheduled Jobs
**Purpose**: Background tasks

- **warrantyReminders.js**: Daily job
  - Runs at 9:00 AM daily
  - Checks for expiring warranties
  - Sends email reminders at 30, 15, 7, 1 days before expiry

#### `/constants` - Application Constants
**Purpose**: Centralized constants

- Status codes
- Product categories
- File upload settings
- Reminder intervals

#### `/uploads` - File Storage
**Purpose**: Store uploaded files

- Invoices and receipts
- Generated filenames
- Served as static files

#### `/logs` - Application Logs
**Purpose**: Log storage

- error.log: Error logs
- combined.log: All logs

#### `/tests` - Test Files
**Purpose**: Unit and integration tests

- Jest test files
- Supertest for API testing

---

## Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd warranty-vault
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.local.example .env.local
# Edit .env.local with your values
npm run dev
```

### 4. Database Setup
```bash
# Start MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env
```

---

## Best Practices

### Frontend Best Practices

1. **Component Organization**
   - Keep components small and focused
   - Extract reusable logic into hooks
   - Use TypeScript for type safety

2. **State Management**
   - Use Context for global state (auth, theme)
   - Keep component-specific state local
   - Use hooks for data fetching

3. **Styling**
   - Use Tailwind utility classes
   - Use `cn()` function for conditional classes
   - Keep styles consistent

4. **Performance**
   - Use Next.js Image component
   - Implement code splitting
   - Lazy load heavy components

5. **Error Handling**
   - Show user-friendly error messages
   - Log errors for debugging
   - Implement error boundaries

### Backend Best Practices

1. **Code Organization**
   - Follow MVC + Service pattern
   - Keep controllers thin
   - Put business logic in services

2. **Security**
   - Use helmet for security headers
   - Validate all inputs
   - Hash passwords with bcrypt
   - Use JWT for authentication
   - Implement rate limiting (future)

3. **Error Handling**
   - Use custom error classes
   - Centralized error handler
   - Log all errors
   - Return consistent error responses

4. **Database**
   - Use indexes for frequent queries
   - Implement pagination
   - Use transactions for critical operations

5. **Testing**
   - Write unit tests for services
   - Write integration tests for APIs
   - Test error scenarios

---

## Scalability Guide

### Horizontal Scaling

1. **Stateless Backend**
   - JWT tokens (no server-side sessions)
   - Store uploaded files in cloud storage (S3)
   - Use MongoDB Atlas for managed database

2. **Load Balancing**
   - Deploy multiple server instances
   - Use NGINX or cloud load balancer
   - Implement health check endpoint

3. **Caching Layer**
   - Redis for session caching
   - Cache frequently accessed data
   - CDN for static assets

### Database Optimization

1. **Indexes**
   ```javascript
   // Add indexes for common queries
   productSchema.index({ userId: 1, warrantyExpiry: 1 });
   productSchema.index({ status: 1 });
   ```

2. **Pagination**
   - Implement cursor-based pagination
   - Limit query results
   - Use aggregation pipeline for complex queries

3. **Sharding**
   - Shard by userId for multi-tenant
   - Use MongoDB Atlas auto-sharding

### Performance Optimization

1. **Frontend**
   - Code splitting with Next.js
   - Image optimization
   - Lazy loading
   - Implement service worker (PWA)

2. **Backend**
   - Use clustering (PM2)
   - Implement rate limiting
   - Compress responses
   - Use connection pooling

3. **Monitoring**
   - APM tools (New Relic, Datadog)
   - Error tracking (Sentry)
   - Analytics dashboard
   - Performance metrics

### Future Enhancements

1. **Microservices**
   - Split into smaller services
   - Email service
   - OCR service
   - Notification service

2. **Message Queue**
   - Use RabbitMQ or AWS SQS
   - Async email sending
   - Background jobs

3. **API Gateway**
   - Centralized API management
   - Rate limiting
   - Authentication

4. **Containerization**
   - Docker for consistency
   - Kubernetes for orchestration
   - CI/CD pipelines

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB Performance](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Last Updated**: February 2026
