const cron = require('node-cron');
const warrantyService = require('../services/warrantyService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Check for expiring warranties and send reminders
 * Runs daily at 9:00 AM
 */
const checkExpiringWarranties = cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Running warranty expiry check...');

    const products = await warrantyService.getProductsNeedingReminders();

    for (const product of products) {
      const daysRemaining = warrantyService.getDaysRemaining(product.warrantyExpiry);
      
      // Send reminders at 30, 15, 7, and 1 days before expiry
      const reminderDays = [30, 15, 7, 1];
      
      if (reminderDays.includes(daysRemaining)) {
        await emailService.sendWarrantyReminder(product.userId, product);
        
        // Update product to mark reminder as sent
        product.remindersSent.push(new Date());
        await product.save();
      }
    }

    logger.info(`Warranty check completed. Processed ${products.length} products.`);
  } catch (error) {
    logger.error(`Warranty check failed: ${error.message}`);
  }
}, {
  scheduled: false,
});

module.exports = {
  checkExpiringWarranties,
};
