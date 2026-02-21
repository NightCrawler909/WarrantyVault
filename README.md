# WarrantyVault 🛡️

A production-level full-stack SaaS application for managing product warranties efficiently. Track warranties, receive expiration reminders, and never lose important warranty information again.

## 🤖 Hybrid AI Architecture (NEW!)

WarrantyVault now features a **production-grade hybrid AI system** for invoice extraction:

- **🐍 Python AI Microservice**: PaddleOCR + Donut (Transformer) model
- **🎯 Platform-Specific Parsers**: Optimized for Amazon/Flipkart (95%+ accuracy)
- **🔄 Smart Fallback**: AI fills gaps when deterministic parsing fails
- **⚡ High Performance**: 2-3 seconds per invoice
- **📊 Confidence Tracking**: OCR quality metrics

**Quick Start**:
```bash
# First time setup
.\setup.bat      # Windows
./setup.sh       # Linux/Mac

# Start all services (Python AI + Node + React)
.\start-all.bat  # Windows
./start-all.sh   # Linux/Mac
```

**Documentation**:
- 📘 [Complete Architecture Guide](HYBRID_AI_ARCHITECTURE.md)
- 🧪 [Testing Guide](TESTING_GUIDE.md)
- 📋 [Project Summary](PROJECT_SUMMARY.md)

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Context API + Zustand
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express Validator
- **Logging**: Winston
- **Scheduling**: Node-Cron

### AI Microservice (NEW!)
- **Framework**: FastAPI (Python)
- **OCR Engine**: PaddleOCR (Primary), Tesseract.js (Fallback)
- **AI Model**: Donut (naver-clova-ix/donut-base-finetuned-docvqa)
- **PDF Processing**: pdf2image + poppler
- **Image Processing**: Pillow
- **ML Framework**: PyTorch + Transformers

## 📁 Project Structure

```
warranty-vault/
├── client/                  # Frontend (Next.js)
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/        # Auth routes group
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── products/      # Product pages
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── globals.css    # Global styles
│   │
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components (Button, Input, Card)
│   │   ├── layout/        # Layout components (Sidebar, Header)
│   │   ├── dashboard/     # Dashboard-specific components
│   │   ├── products/      # Product-specific components
│   │   └── auth/          # Authentication components
│   │
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── lib/               # Library code and utilities
│   ├── utils/             # Helper functions
│   ├── types/             # TypeScript type definitions
│   ├── animations/        # Animation variants
│   ├── config/            # Configuration constants
│   └── package.json
│
├── server/                # Backend (Express)
│   ├── config/            # Configuration files
│   │   ├── database.js    # MongoDB connection
│   │   └── config.js      # App configuration
│   │
│   ├── controllers/       # Route controllers
│   │   ├── authController.js
│   │   └── productController.js
│   │
│   ├── routes/            # API routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   └── Product.js
│   │
│   ├── middleware/        # Express middleware
│   │   ├── auth.js        # JWT authentication
│   │   ├── errorHandler.js
│   │   └── upload.js      # File upload handling
│   │
│   ├── services/          # Business logic
│   │   ├── warrantyService.js
│   │   ├── ocrService.js         # Hybrid OCR + AI fallback
│   │   ├── pythonAIService.js    # Python service client (NEW!)
│   │   ├── imagePreprocessService.js
│   │   ├── pdfService.js
│   │   └── emailService.js
│   │
│   ├── utils/             # Utility functions
│   │   ├── jwt.js
│   │   └── logger.js
│   │
│   ├── validators/        # Input validation
│   ├── uploads/           # Uploaded files storage
│   ├── constants/         # App constants
│   ├── cron/              # Scheduled jobs
│   ├── logs/              # Application logs
│   ├── tests/             # Test files
│   └── server.js          # Entry point
│
├── ai-service/            # Python AI Microservice (NEW!)
│   ├── app.py             # FastAPI server with PaddleOCR + Donut
│   ├── requirements.txt   # Python dependencies
│   ├── README.md          # AI service documentation
│   ├── .env.example       # Configuration template
│   ├── .gitignore
│   └── venv/              # Python virtual environment
│
├── HYBRID_AI_ARCHITECTURE.md  # AI architecture docs (NEW!)
├── TESTING_GUIDE.md           # Testing checklist (NEW!)
├── PROJECT_SUMMARY.md         # Implementation summary (NEW!)
├── start-all.bat              # Windows startup script (NEW!)
├── start-all.sh               # Linux/Mac startup script (NEW!)
├── setup.bat                  # Windows setup script (NEW!)
└── setup.sh                   # Linux/Mac setup script (NEW!)
```
    │   └── emailService.js
    │
    ├── utils/             # Utility functions
    │   ├── jwt.js
    │   └── logger.js
    │
    ├── validators/        # Input validation
    ├── uploads/           # Uploaded files storage
    ├── constants/         # App constants
    ├── cron/              # Scheduled jobs
    ├── logs/              # Application logs
    ├── tests/             # Test files
    └── server.js          # Entry point
```

## 📂 Folder Explanations

### Frontend (client/)

#### `app/`
Next.js 14 App Router structure:
- **(auth)**: Route group for authentication pages (login, register)
- **dashboard/**: User dashboard with warranty statistics
- **products/**: Product management pages
- **layout.tsx**: Root layout with providers
- **page.tsx**: Landing page
- **globals.css**: Global styles and Tailwind imports

#### `components/`
- **ui/**: Reusable UI primitives (Button, Input, Card, etc.)
- **layout/**: Layout components (Sidebar, Header, DashboardLayout)
- **dashboard/**: Dashboard widgets (Stats, ExpiringWarranties, RecentProducts)
- **products/**: Product components (ProductList, ProductCard, AddProductForm)
- **auth/**: Authentication forms (LoginForm, RegisterForm)
- **common/**: Shared components (LoadingSpinner, ErrorBoundary)

#### `context/`
React Context providers for global state:
- **AuthContext**: User authentication state
- **ThemeContext**: Theme management (light/dark mode)

#### `hooks/`
Custom React hooks:
- **useAuth**: Authentication hook
- **useProducts**: Product data fetching
- **useForm**: Form handling utilities

#### `services/`
API service layer for backend communication:
- **authService**: Authentication API calls
- **productService**: Product CRUD operations

#### `lib/`
Library code and configurations:
- **apiClient**: Configured Axios instance with interceptors
- **utils**: General utility functions (cn for class names)

#### `utils/`
Helper functions:
- **date.ts**: Date formatting and calculations
- **format.ts**: Data formatting utilities
- **validation.ts**: Client-side validation helpers

#### `types/`
TypeScript type definitions:
- **auth.ts**: Authentication types
- **product.ts**: Product types
- **api.ts**: API response types

#### `animations/`
Animation variants for Framer Motion

#### `config/`
Application configuration and constants

### Backend (server/)

#### `config/`
- **database.js**: MongoDB connection setup
- **config.js**: Application configuration (JWT, email, upload settings)

#### `controllers/`
Request handlers:
- **authController**: Registration, login, logout
- **productController**: CRUD operations for products

#### `routes/`
API route definitions:
- **authRoutes**: `/api/auth/*` endpoints
- **productRoutes**: `/api/products/*` endpoints
- **userRoutes**: `/api/users/*` endpoints

#### `models/`
Mongoose schemas:
- **User**: User authentication and profile
- **Product**: Product and warranty information

#### `middleware/`
- **auth.js**: JWT token verification
- **errorHandler.js**: Centralized error handling
- **upload.js**: Multer file upload configuration

#### `services/`
Business logic layer:
- **warrantyService**: Warranty calculations and statistics
- **emailService**: Email notifications (reminders, welcome emails)

#### `utils/`
- **jwt.js**: JWT token generation and verification
- **logger.js**: Winston logger configuration

#### `validators/`
Express-validator rules for input validation

#### `cron/`
Scheduled jobs:
- **warrantyReminders.js**: Daily job to send warranty expiry reminders

#### `constants/`
Application constants (status codes, categories, etc.)

#### `logs/`
Application log files (error.log, combined.log)

#### `tests/`
Unit and integration tests

#### `uploads/`
Storage for uploaded files (invoices, receipts)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Frontend Setup

```bash
cd client
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=WarrantyVault
```

Run development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### Backend Setup

```bash
cd server
npm install
```

Create `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/warranty-vault
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@warrantyvault.com
```

Run development server:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

## 📦 NPM Packages

### Frontend Dependencies
```json
{
  "next": "^14.1.0",
  "react": "^18.2.0",
  "axios": "^1.6.7",
  "tailwindcss": "^3.3.0",
  "framer-motion": "^11.0.5",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.1",
  "zustand": "^4.5.0",
  "date-fns": "^3.3.1",
  "react-hot-toast": "^2.4.1"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.1.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "multer": "^1.4.5-lts.1",
  "nodemailer": "^6.9.8",
  "express-validator": "^7.0.1",
  "winston": "^3.11.0",
  "node-cron": "^3.0.3",
  "dotenv": "^16.4.1"
}
```

## 🔄 Development Workflow

### 1. Start MongoDB
```bash
mongod
```

### 2. Start Backend
```bash
cd server
npm run dev
```

### 3. Start Frontend
```bash
cd client
npm run dev
```

### 4. Access Application
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health Check: `http://localhost:5000/health`

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all user products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/stats` - Get warranty statistics
- `GET /api/products/expiring` - Get expiring products
- `POST /api/products/:id/invoice` - Upload invoice

## 🎯 Features

### Current Features
✅ User authentication (JWT)
✅ Product warranty management
✅ Dashboard with statistics
✅ Warranty expiry tracking
✅ File upload (invoices/receipts)
✅ Email notifications
✅ Responsive design
✅ Error handling
✅ Input validation

### Future Enhancements
🔜 Gmail API integration
🔜 OCR invoice parsing
🔜 Multi-language support
🔜 Mobile app
🔜 Advanced analytics
🔜 Warranty claim tracking
🔜 Integration with retailers

## 📈 Scalability Considerations

### Architecture
- **Modular Structure**: Easy to add new features
- **Service Layer**: Separates business logic from controllers
- **Middleware Pattern**: Reusable authentication and error handling
- **Environment-based Config**: Easy deployment to different environments

### Database
- **MongoDB**: Horizontal scaling with sharding
- **Indexes**: Optimized queries on userId, warrantyExpiry
- **Connection Pooling**: Efficient database connections

### Caching (Future)
- Redis for session management
- CDN for static assets
- API response caching

### Monitoring (Future)
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Analytics dashboard

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests (to be implemented)
cd client
npm test
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
vercel deploy
```

### Backend (Railway/Heroku)
```bash
cd server
# Set environment variables
# Deploy using platform CLI
```

## 📝 License

MIT License

## 👨‍💻 Author

Built with ❤️ for WarrantyVault

---

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB University](https://university.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

---

**Happy Coding! 🚀**
