const Product = require('../models/Product');

class WarrantyService {
  /**
   * Calculate warranty expiry date
   */
  calculateExpiryDate(purchaseDate, warrantyPeriod) {
    const expiry = new Date(purchaseDate);
    expiry.setMonth(expiry.getMonth() + warrantyPeriod);
    return expiry;
  }

  /**
   * Get comprehensive warranty statistics for a user
   */
  async getWarrantyStats(userId) {
    const products = await Product.find({ userId });

    const stats = {
      totalProducts: products.length,
      activeCount: 0,
      expiringCount: 0,
      expiredCount: 0,
    };

    products.forEach(product => {
      if (product.status === 'active') stats.activeCount++;
      else if (product.status === 'expiring') stats.expiringCount++;
      else if (product.status === 'expired') stats.expiredCount++;
    });

    return stats;
  }

  /**
   * Get enhanced dashboard analytics
   */
  async getDashboardAnalytics(userId) {
    // Get basic stats
    const stats = await this.getWarrantyStats(userId);

    // Get nearest expiry products (top 5)
    const nearestExpiryProducts = await Product.find({ 
      userId,
      status: { $in: ['active', 'expiring'] }
    })
      .sort({ warrantyExpiry: 1 })
      .limit(5)
      .lean();

    return {
      ...stats,
      nearestExpiryProducts,
    };
  }

  /**
   * Get comprehensive analytics with time-based filters
   */
  async getComprehensiveAnalytics(userId) {
    const now = new Date();
    
    // Calculate date boundaries
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Get all products for the user
    const allProducts = await Product.find({ userId }).lean();

    // Get urgent expiring products (within 7 days)
    const urgentExpiring = await Product.find({
      userId,
      warrantyExpiry: { 
        $gte: now, 
        $lte: sevenDaysFromNow 
      },
    }).lean();

    // Add remainingDays and sort by ascending
    const urgentExpiringWithDays = urgentExpiring
      .map(product => ({
        ...product,
        remainingDays: this.getDaysRemaining(product.warrantyExpiry)
      }))
      .sort((a, b) => a.remainingDays - b.remainingDays);

    // Get upcoming expiring products (within 30 days)
    const upcomingExpiring = await Product.find({
      userId,
      warrantyExpiry: { 
        $gte: now, 
        $lte: thirtyDaysFromNow 
      },
    }).lean();

    // Calculate stats
    const stats = {
      totalProducts: allProducts.length,
      activeCount: 0,
      expiringCount: 0,
      expiredCount: 0,
    };

    allProducts.forEach(product => {
      if (product.status === 'active') stats.activeCount++;
      else if (product.status === 'expiring') stats.expiringCount++;
      else if (product.status === 'expired') stats.expiredCount++;
    });

    // Calculate health score
    // Start at 100, -5 for each expiring, -10 for each expired, min 0
    const healthScore = Math.max(
      0,
      100 - (stats.expiringCount * 5) - (stats.expiredCount * 10)
    );

    return {
      totalProducts: stats.totalProducts,
      activeCount: stats.activeCount,
      expiringCount: stats.expiringCount,
      expiredCount: stats.expiredCount,
      urgentExpiring: urgentExpiringWithDays,
      upcomingExpiring,
      healthScore,
    };
  }

  /**
   * Get days remaining until warranty expiry
   */
  getDaysRemaining(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate warranty usage percentage
   */
  calculateWarrantyUsage(purchaseDate, warrantyExpiry) {
    const now = new Date();
    const purchase = new Date(purchaseDate);
    const expiry = new Date(warrantyExpiry);

    const totalDuration = expiry - purchase;
    const elapsed = now - purchase;

    const percentage = (elapsed / totalDuration) * 100;
    return Math.max(0, Math.min(100, Math.round(percentage)));
  }

  /**
   * Determine warranty status
   */
  determineStatus(expiryDate) {
    const daysRemaining = this.getDaysRemaining(expiryDate);
    
    if (daysRemaining < 0) {
      return 'expired';
    } else if (daysRemaining <= 30) {
      return 'expiring';
    }
    return 'active';
  }

  /**
   * Check if warranty is expiring soon (within 30 days)
   */
  isExpiringSoon(expiryDate) {
    const daysRemaining = this.getDaysRemaining(expiryDate);
    return daysRemaining > 0 && daysRemaining <= 30;
  }

  /**
   * Check if warranty has expired
   */
  isExpired(expiryDate) {
    return this.getDaysRemaining(expiryDate) < 0;
  }

  /**
   * Get products that need reminders
   */
  async getProductsNeedingReminders() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const products = await Product.find({
      warrantyExpiry: { $lte: thirtyDaysFromNow },
      status: { $ne: 'expired' },
    }).populate('userId', 'email name');

    return products;
  }

  /**
   * Get expiring products sorted by expiry date
   */
  async getExpiringProducts(userId, limit = null) {
    const query = Product.find({
      userId,
      status: 'expiring',
    }).sort({ warrantyExpiry: 1 });

    if (limit) {
      query.limit(limit);
    }

    return await query.lean();
  }

  /**
   * Update all product statuses (for maintenance/cron)
   */
  async updateAllProductStatuses() {
    const products = await Product.find({});
    
    let updated = 0;
    for (const product of products) {
      const oldStatus = product.status;
      await product.save(); // This will trigger pre-save hooks
      
      if (oldStatus !== product.status) {
        updated++;
      }
    }

    return { total: products.length, updated };
  }
}

module.exports = new WarrantyService();
