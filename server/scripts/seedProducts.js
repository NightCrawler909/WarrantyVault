const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');

// Demo user credentials
const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@warrantyvault.com',
  password: 'demo123', // Will be hashed automatically by User model pre-save hook
};

// Sample products with realistic data
const getSampleProducts = (userId) => {
  const now = new Date();
  
  return [
    // 1. ACTIVE - Recently purchased
    {
      userId,
      name: 'Apple MacBook Air M2',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 3, 15), // 3 months ago
      warrantyPeriod: 12,
      price: 119900,
      retailer: 'Amazon',
      notes: 'Space Grey, 16GB RAM, 512GB SSD',
    },
    
    // 2. ACTIVE - Mid-term warranty
    {
      userId,
      name: 'LG 55-inch 4K Smart TV',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 8, 10), // 8 months ago
      warrantyPeriod: 24,
      price: 54999,
      retailer: 'Flipkart',
      notes: 'OLED Display, Magic Remote included',
    },
    
    // 3. ACTIVE - Long warranty remaining
    {
      userId,
      name: 'Dell UltraSharp 27" Monitor',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 6, 20), // 6 months ago
      warrantyPeriod: 36,
      price: 28500,
      retailer: 'Amazon',
      notes: '4K IPS Panel, USB-C Hub',
    },
    
    // 4. EXPIRING SOON - 25 days left
    {
      userId,
      name: 'iPhone 14',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 5), // Almost 1 year ago
      warrantyPeriod: 12,
      price: 79900,
      retailer: 'Apple Store',
      serialNumber: 'FVFG3XYZ1234',
      notes: '128GB, Blue color, AppleCare eligible',
    },
    
    // 5. EXPIRING SOON - 15 days left
    {
      userId,
      name: 'Sony WH-1000XM5 Headphones',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 15), // 1 year + 15 days ago
      warrantyPeriod: 12,
      price: 29990,
      retailer: 'Flipkart',
      notes: 'Black, Premium noise cancellation',
    },
    
    // 6. ACTIVE - Recently purchased
    {
      userId,
      name: 'Samsung 1TB NVMe SSD',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 2, 5), // 2 months ago
      warrantyPeriod: 60, // 5 years warranty
      price: 8999,
      retailer: 'Amazon',
      serialNumber: 'S5GXNM0W123456',
      notes: '980 PRO, Gen 4.0, 7000MB/s read speed',
    },
    
    // 7. EXPIRING SOON - 20 days left
    {
      userId,
      name: 'Boat Airdopes 141',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 5, now.getDate() - 10), // 5 months + 10 days ago
      warrantyPeriod: 6,
      price: 1299,
      retailer: 'Flipkart',
      notes: 'True wireless earbuds, IPX4 rating',
    },
    
    // 8. EXPIRED - 45 days ago
    {
      userId,
      name: 'Mi 20000mAh Power Bank',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear() - 1, now.getMonth() - 1, now.getDate() - 15), // 13 months + 15 days ago
      warrantyPeriod: 12,
      price: 1799,
      retailer: 'Amazon',
      notes: '18W Fast Charging, Dual USB output',
    },
    
    // 9. EXPIRED - 3 months ago
    {
      userId,
      name: 'HP DeskJet 2332 Printer',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear() - 1, now.getMonth() - 3, 10), // 15 months ago
      warrantyPeriod: 12,
      price: 3499,
      retailer: 'Offline - Computer Store',
      notes: 'All-in-one printer, scanner, copier',
    },
    
    // 10. ACTIVE - Good warranty time
    {
      userId,
      name: 'Asus RT-AX55 WiFi Router',
      category: 'electronics',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 4, 25), // 4 months ago
      warrantyPeriod: 36,
      price: 5499,
      retailer: 'Amazon',
      notes: 'WiFi 6, Dual-band, AiMesh support',
    },
  ];
};

// Main seeding function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Check if demo user already exists
    let demoUser = await User.findOne({ email: DEMO_USER.email });
    
    if (demoUser) {
      console.log('👤 Demo user already exists');
      console.log(`   Email: ${demoUser.email}`);
      console.log(`   ID: ${demoUser._id}\n`);
      
      // Clear existing products for demo user
      const deletedCount = await Product.deleteMany({ userId: demoUser._id });
      console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing products\n`);
    } else {
      // Create demo user
      console.log('👤 Creating demo user...');
      demoUser = await User.create(DEMO_USER);
      console.log('✅ Demo user created successfully');
      console.log(`   Email: ${demoUser.email}`);
      console.log(`   Password: ${DEMO_USER.password}`);
      console.log(`   ID: ${demoUser._id}\n`);
    }

    // Insert sample products
    console.log('📦 Inserting sample products...');
    const sampleProducts = getSampleProducts(demoUser._id);
    const insertedProducts = await Product.insertMany(sampleProducts);
    
    console.log(`✅ ${insertedProducts.length} products inserted successfully\n`);

    // Display product summary
    console.log('📊 Product Summary:');
    console.log('─'.repeat(70));
    
    for (const product of insertedProducts) {
      const warrantyExpiry = new Date(product.purchaseDate);
      warrantyExpiry.setMonth(warrantyExpiry.getMonth() + product.warrantyPeriod);
      
      const now = new Date();
      const daysRemaining = Math.ceil((warrantyExpiry - now) / (1000 * 60 * 60 * 24));
      
      let statusEmoji = '✅';
      let statusText = 'Active';
      
      if (daysRemaining < 0) {
        statusEmoji = '❌';
        statusText = 'Expired';
      } else if (daysRemaining <= 30) {
        statusEmoji = '⚠️';
        statusText = 'Expiring Soon';
      }
      
      console.log(`${statusEmoji} ${product.name}`);
      console.log(`   Status: ${statusText} (${daysRemaining > 0 ? daysRemaining + 'd left' : 'Expired ' + Math.abs(daysRemaining) + 'd ago'})`);
      console.log(`   Warranty: ${product.warrantyPeriod} months | Retailer: ${product.retailer}`);
      console.log('');
    }
    
    console.log('─'.repeat(70));
    console.log('\n🎉 Database seeded successfully!\n');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}\n`);
    console.log('🚀 You can now login and see your dashboard populated with data!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeder
seedDatabase();
