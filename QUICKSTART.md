# WarrantyVault - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB installed or MongoDB Atlas account
- Git installed

### Step 1: Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd warranty-vault

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Configure Environment

**Backend (.env)**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/warranty-vault
JWT_SECRET=your-random-secret-key-here
PORT=5000
```

**Frontend (.env.local)**
```bash
cd client
cp .env.local.example .env.local
```

Edit `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** (cloud):
- Create account at mongodb.com/atlas
- Create cluster
- Get connection string
- Update MONGODB_URI in server/.env

### Step 4: Run Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Step 5: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📝 First Steps in the App

1. **Register**: Go to http://localhost:3000/register
2. **Login**: Use your credentials
3. **Add Product**: Click "Add Product" in dashboard
4. **View Dashboard**: See statistics and expiring warranties

## 🧪 Test API with cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Products (replace TOKEN):**
```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📦 NPM Scripts

### Backend
```bash
npm run dev      # Development with nodemon
npm start        # Production
npm test         # Run tests
```

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
mongod
```

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution**: Kill the process or change PORT in .env

### JWT Secret Warning
```
Warning: JWT_SECRET is using default value
```
**Solution**: Set a random string in server/.env:
```env
JWT_SECRET=my-super-secret-key-12345
```

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution**: Install dependencies
```bash
npm install
```

## 🎯 Next Steps

1. ✅ **Customize Design**: Edit Tailwind classes
2. ✅ **Add Features**: Implement new functionality
3. ✅ **Setup Email**: Configure SMTP for reminders
4. ✅ **Deploy**: Deploy to Vercel (frontend) and Railway (backend)
5. ✅ **Test**: Write tests for new features

## 📚 Learn More

- [Full Documentation](./DOCUMENTATION.md)
- [API Reference](./API.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 💬 Need Help?

- Check [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed explanations
- Review code comments
- Search issues on GitHub

---

**Happy Coding! 🚀**
