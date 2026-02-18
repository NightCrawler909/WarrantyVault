# 🚀 Quick Start Guide - New Dashboard

## Starting the Application

### 1. Start MongoDB (Terminal 1)

```bash
cd server
mongod
```

**Expected Output:**
```
[initandlisten] waiting for connections on port 27017
```

---

### 2. Start Backend Server (Terminal 2)

```bash
cd server
npm run dev
```

**Expected Output:**
```
Server running on port 5000
MongoDB Connected
```

---

### 3. Start Frontend (Terminal 3)

```bash
cd client
npm run dev
```

**Expected Output:**
```
Ready - started server on 0.0.0.0:3000
```

---

## Viewing the Dashboard

1. Open browser: **http://localhost:3000**
2. Login or register an account
3. Navigate to: **http://localhost:3000/dashboard**

You should see the new **Apple-inspired Bento Grid layout**!

---

## What You'll See

### Dashboard Layout

```
┌─────────────────────────────────────────────┐
│  Dashboard                                   │
│  Welcome back! Here's your warranty overview │
└─────────────────────────────────────────────┘

┌──────────────────┬──────────┬──────────┐
│                  │          │          │
│  OVERVIEW        │ EXPIRING │ ANALYTICS│
│                  │   SOON   │  CHART   │
│  Total: 25       │          │          │
│                  │ iPhone   │  [Chart] │
│  Active  Expired │  10d     │          │
│    15       3    │          │          │
│                  │ MacBook  │ Active:15│
│                  │  25d     │ Expired:3│
└──────────────────┴──────────┴──────────┘

┌─────────────────────────────────────────────┐
│  WARRANTY TIMELINE                          │
│                                             │
│  iPhone 15      [████████░░] 85%   10d     │
│  MacBook Pro    [██████░░░░] 70%   25d     │
│  AirPods Pro    [████░░░░░░] 50%   45d     │
│  iPad Air       [██░░░░░░░░] 30%  120d     │
└─────────────────────────────────────────────┘

┌──────────┐
│ QUICK ADD│
│    [+]   │
└──────────┘
```

---

## Testing Features

### 1. Overview Card
- Shows total product count (large number)
- Displays active warranties
- Displays expired warranties
- **Animation**: Numbers scale in on load

### 2. Expiring Soon Card
- Lists top 3 products nearest to expiry
- Shows remaining days
- **Red text** if < 30 days
- **Animation**: List items stagger in

### 3. Warranty Timeline
- Shows top 4 products with progress bars
- **Green bar**: > 30 days (active)
- **Amber bar**: ≤ 30 days (expiring)
- **Red bar**: < 0 days (expired)
- **Animation**: Bars fill from left to right

### 4. Analytics Chart
- Minimal doughnut chart
- Shows Active vs Expired
- Total in center
- Legend below
- **Animation**: Chart renders smoothly

### 5. Quick Add Card
- Interactive button
- Click to add new product
- **Animation**: Scales on hover, rotates icon

---

## Dark Mode Testing

### Enable Dark Mode
1. Look for theme toggle in header
2. Click to switch between light/dark
3. Dashboard adapts instantly

### What Changes
- Background: white → neutral-900
- Text: neutral-900 → neutral-100
- Cards: subtle borders adapt
- Chart colors change
- Icons remain visible

---

## Responsive Testing

### Mobile View (< 768px)
- All cards stack vertically
- Full width
- Easy to scroll

### Tablet View (768px - 1024px)
- 2 column grid
- Overview spans 2 columns
- Timeline full width

### Desktop View (> 1024px)
- 4 column Bento Grid
- Cards positioned optimally
- Full layout visible

---

## Adding Test Data

### Quick Method - Use Quick Add Card

1. Click the **Quick Add** card (with + icon)
2. Fill in the form:
   - Product Name: "iPhone 15"
   - Category: "electronics"
   - Purchase Date: "2024-01-01"
   - Warranty Period: "12 months"
   - Price: "999"
3. Submit

### Result
- Product appears in dashboard
- Updates overview count
- Shows in Expiring Soon (if < 30 days)
- Appears in Timeline
- Chart updates

---

## Troubleshooting

### MongoDB Not Starting
```bash
# Windows - Run as Administrator
mongod

# Or specify data directory
mongod --dbpath C:\data\db
```

### Backend Port Conflict
```bash
# Kill process on port 5000
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Frontend Port Conflict
```bash
# Use different port
PORT=3001 npm run dev
```

### Cards Not Loading Data

1. **Check Backend**
   - Is server running on port 5000?
   - Check terminal for errors

2. **Check MongoDB**
   - Is MongoDB running?
   - Connection success message?

3. **Check Browser Console**
   - F12 → Console tab
   - Look for API errors

4. **Check Network Tab**
   - F12 → Network tab
   - Look for failed requests

---

## API Endpoints Used

The dashboard makes these API calls:

```
GET /api/products              - All products
GET /api/products/stats        - Dashboard stats
GET /api/products/expiring     - Expiring products
```

### Expected Responses

**GET /api/products/stats**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 15,
    "expiringSoon": 7,
    "expired": 3
  }
}
```

**GET /api/products/expiring**
```json
{
  "success": true,
  "data": [
    {
      "_id": "123",
      "name": "iPhone 15",
      "remainingDays": 10,
      "warrantyExpiry": "2024-02-28"
    }
  ]
}
```

---

## Performance Tips

### Optimize Re-renders
- Data is fetched once on mount
- No unnecessary re-fetches
- Efficient state management

### Smooth Animations
- Uses CSS transforms (GPU accelerated)
- Framer Motion optimized
- No layout thrashing

### Fast Loading
- Components lazy load data
- Loading state shows spinner
- Progressive enhancement

---

## Keyboard Shortcuts

```
Tab       - Navigate through cards
Enter     - Activate Quick Add
Escape    - Close modals
Ctrl/Cmd+R - Refresh dashboard
```

---

## Next Steps

### Customize the Dashboard

1. **Edit Colors**
   - Open any bento card component
   - Change Tailwind classes
   - Example: `bg-neutral-900` → `bg-blue-900`

2. **Adjust Layout**
   - Edit `DashboardContent.tsx`
   - Change `grid-cols-4` to different columns
   - Adjust card spans

3. **Add New Cards**
   - Create new component in `bento/`
   - Export from `index.ts`
   - Add to `DashboardContent.tsx`

### Add More Features

- [ ] Real-time notifications
- [ ] Advanced filtering
- [ ] Export to PDF
- [ ] Share dashboard
- [ ] Custom widgets
- [ ] Data visualization options

---

## Support

### Documentation
- [DASHBOARD_README.md](./DASHBOARD_README.md) - Overview
- [BENTO_GRID_DASHBOARD.md](./BENTO_GRID_DASHBOARD.md) - Technical docs
- [LAYOUT_GUIDE.md](./LAYOUT_GUIDE.md) - Design system

### Code Location
```
client/
├── app/dashboard/page.tsx
├── components/dashboard/
│   ├── bento/
│   │   ├── OverviewCard.tsx
│   │   ├── ExpiringSoonCard.tsx
│   │   ├── WarrantyTimelineCard.tsx
│   │   ├── AnalyticsChartCard.tsx
│   │   ├── QuickAddCard.tsx
│   │   └── index.ts
│   └── DashboardContent.tsx
└── hooks/useProducts.ts
```

---

**Happy Dashboard Testing!** 🎉

If everything is working, you should see a beautiful, minimal, Apple-inspired dashboard with smooth animations and perfect dark mode support.

---

**Status**: Ready to Use  
**Version**: 1.0  
**Date**: February 18, 2026
