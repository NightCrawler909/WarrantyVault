# WarrantyVault API Documentation

## Smart Warranty Engine - Enhanced API

### Base URL
```
http://localhost:5000/api
```

---

## Product Endpoints

### 1. Get All Products
Get all products for the authenticated user.

**Endpoint:** `GET /products`  
**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "65f...",
      "name": "iPhone 15 Pro",
      "category": "electronics",
      "purchaseDate": "2024-01-15",
      "warrantyPeriod": 12,
      "warrantyExpiry": "2025-01-15",
      "status": "active",
      "remainingDays": 120,
      "warrantyUsagePercent": 45,
      ...
    }
  ]
}
```

**Virtual Fields:**
- `remainingDays` - Days until warranty expires (calculated)
- `warrantyUsagePercent` - Percentage of warranty used (0-100)

---

### 2. Get Dashboard Stats
Get warranty statistics with nearest expiry products.

**Endpoint:** `GET /products/stats`  
**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 25,
    "activeCount": 15,
    "expiringCount": 7,
    "expiredCount": 3,
    "nearestExpiryProducts": [
      {
        "_id": "65f...",
        "name": "MacBook Pro",
        "warrantyExpiry": "2024-03-15",
        "remainingDays": 10,
        "status": "expiring"
      }
      // ... top 5 products closest to expiry
    ]
  }
}
```

**Description:**
- `activeCount` - Products with > 30 days remaining
- `expiringCount` - Products with ≤ 30 days remaining
- `expiredCount` - Products with warranty expired
- `nearestExpiryProducts` - Top 5 products sorted by expiry date (ASC)

---

### 3. Get Comprehensive Analytics
Get detailed analytics with time-based filtering.

**Endpoint:** `GET /products/analytics`  
**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 25,
    "activeCount": 15,
    "expiringCount": 7,
    "expiredCount": 3,
    "productsExpiringIn7Days": 2,
    "productsExpiringIn30Days": 7
  }
}
```

**Description:**
- `productsExpiringIn7Days` - Count of products expiring in next 7 days
- `productsExpiringIn30Days` - Count of products expiring in next 30 days

---

### 4. Get Expiring Products
Get products with expiring status, sorted by expiry date.

**Endpoint:** `GET /products/expiring?limit=10`  
**Auth:** Required (JWT)

**Query Parameters:**
- `limit` (optional) - Limit number of results

**Response:**
```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "_id": "65f...",
      "name": "Samsung TV",
      "warrantyExpiry": "2024-02-20",
      "remainingDays": 5,
      "status": "expiring",
      "warrantyUsagePercent": 92
    }
    // ... sorted by warranty expiry (ASC)
  ]
}
```

---

### 5. Create Product
Add a new product with automatic warranty calculation.

**Endpoint:** `POST /products`  
**Auth:** Required (JWT)

**Request Body:**
```json
{
  "name": "iPhone 15 Pro",
  "category": "electronics",
  "purchaseDate": "2024-01-15",
  "warrantyPeriod": 12,
  "price": 999,
  "retailer": "Apple Store",
  "serialNumber": "ABC123456",
  "notes": "Extended warranty purchased"
}
```

**Auto-Calculated Fields:**
- `warrantyExpiry` - Automatically calculated from purchaseDate + warrantyPeriod
- `status` - Automatically set based on expiry date
  - `active` - More than 30 days remaining
  - `expiring` - 30 days or less remaining
  - `expired` - Past expiry date

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f...",
    "name": "iPhone 15 Pro",
    "warrantyExpiry": "2025-01-15",
    "status": "active",
    "remainingDays": 365,
    "warrantyUsagePercent": 0,
    ...
  }
}
```

---

### 6. Update Product
Update product details. Status is automatically recalculated.

**Endpoint:** `PUT /products/:id`  
**Auth:** Required (JWT)

**Request Body:**
```json
{
  "name": "iPhone 15 Pro Max",
  "price": 1199
}
```

---

### 7. Delete Product
Delete a product.

**Endpoint:** `DELETE /products/:id`  
**Auth:** Required (JWT)

---

### 8. Upload Invoice
Upload an invoice/receipt for a product.

**Endpoint:** `POST /products/:id/invoice`  
**Auth:** Required (JWT)  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `invoice` - File (image/pdf, max 5MB)

---

## Product Model

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | ObjectId | Yes | Reference to User |
| name | String | Yes | Product name |
| category | String | Yes | Product category (enum) |
| purchaseDate | Date | Yes | Date of purchase |
| warrantyPeriod | Number | Yes | Warranty period in months |
| warrantyExpiry | Date | Auto | Automatically calculated |
| status | String | Auto | active / expiring / expired |
| price | Number | No | Purchase price |
| retailer | String | No | Store/retailer name |
| serialNumber | String | No | Product serial number |
| invoiceUrl | String | No | URL to uploaded invoice |
| notes | String | No | Additional notes |
| remindersSent | Array | Auto | Timestamps of sent reminders |

### Virtual Fields (Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| remainingDays | Number | Days until warranty expires |
| warrantyUsagePercent | Number | Percentage of warranty used (0-100) |

### Status Logic

```javascript
const now = new Date();
const daysRemaining = Math.ceil((warrantyExpiry - now) / (1000 * 60 * 60 * 24));

if (daysRemaining < 0) {
  status = 'expired';
} else if (daysRemaining <= 30) {
  status = 'expiring';
} else {
  status = 'active';
}
```

### Indexes

Optimized for performance:
- `userId` - Single index
- `warrantyExpiry` - Single index
- `status` - Single index
- `{ userId: 1, status: 1 }` - Compound index
- `{ userId: 1, warrantyExpiry: 1 }` - Compound index

---

## Categories

Available product categories:
- `electronics`
- `appliances`
- `furniture`
- `automotive`
- `tools`
- `other`

---

## Status Types

| Status | Description | Days Remaining |
|--------|-------------|----------------|
| active | Warranty is valid | > 30 days |
| expiring | Warranty expiring soon | 1-30 days |
| expired | Warranty has expired | < 0 days |

---

## Example Usage

### Get Analytics Dashboard Data
```javascript
// Frontend code
const response = await fetch('/api/products/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
console.log(data.totalProducts);
console.log(data.nearestExpiryProducts);
```

### Create Product with Auto-Calculation
```javascript
const newProduct = {
  name: "Dell Laptop",
  category: "electronics",
  purchaseDate: "2024-01-01",
  warrantyPeriod: 24, // 24 months
  price: 899
};

const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newProduct)
});

// Response includes auto-calculated fields:
// - warrantyExpiry: "2026-01-01"
// - status: "active"
// - remainingDays: 700
// - warrantyUsagePercent: 5
```

### Get Products Expiring in Next 7 Days
```javascript
const analytics = await fetch('/api/products/analytics', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(`${analytics.data.productsExpiringIn7Days} products expiring soon!`);
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Product name is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Server Error"
}
```

---

## Warranty Service Methods

The Smart Warranty Engine centralizes all business logic in `services/warrantyService.js`:

### Available Methods

| Method | Description |
|--------|-------------|
| `calculateExpiryDate(purchaseDate, warrantyPeriod)` | Calculate warranty expiry date |
| `getWarrantyStats(userId)` | Get basic warranty statistics |
| `getDashboardAnalytics(userId)` | Get dashboard data with nearest expiry |
| `getComprehensiveAnalytics(userId)` | Get detailed analytics with time filters |
| `getDaysRemaining(expiryDate)` | Calculate days until expiry |
| `calculateWarrantyUsage(purchaseDate, warrantyExpiry)` | Calculate usage percentage |
| `determineStatus(expiryDate)` | Determine warranty status |
| `isExpiringSoon(expiryDate)` | Check if expiring in 30 days |
| `isExpired(expiryDate)` | Check if expired |
| `getExpiringProducts(userId, limit)` | Get expiring products sorted |
| `getProductsNeedingReminders()` | Get products for reminder emails |
| `updateAllProductStatuses()` | Update all statuses (maintenance) |

---

## Testing with cURL

### Get Stats
```bash
curl -X GET http://localhost:5000/api/products/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Analytics
```bash
curl -X GET http://localhost:5000/api/products/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "category": "electronics",
    "purchaseDate": "2024-01-15",
    "warrantyPeriod": 12,
    "price": 1999
  }'
```

---

**Smart Warranty Engine v2.0**  
*Automated Status Management | Virtual Fields | Comprehensive Analytics*
