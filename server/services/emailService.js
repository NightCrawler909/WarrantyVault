const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  /**
   * Send warranty expiry reminder email
   */
  async sendWarrantyReminder(user, product) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: `Warranty Expiring Soon: ${product.name}`,
        html: `
          <h2>Warranty Expiry Reminder</h2>
          <p>Hi ${user.name},</p>
          <p>This is a reminder that the warranty for your product is expiring soon:</p>
          <ul>
            <li><strong>Product:</strong> ${product.name}</li>
            <li><strong>Expiry Date:</strong> ${new Date(product.warrantyExpiry).toLocaleDateString()}</li>
          </ul>
          <p>Make sure to file any claims before the warranty expires.</p>
          <p>Best regards,<br>WarrantyVault Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Warranty reminder sent to ${user.email} for product ${product.name}`);
    } catch (error) {
      logger.error(`Failed to send warranty reminder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: 'Welcome to WarrantyVault',
        html: `
          <h2>Welcome to WarrantyVault!</h2>
          <p>Hi ${user.name},</p>
          <p>Thank you for signing up. We're excited to help you manage your product warranties.</p>
          <p>Get started by adding your first product!</p>
          <p>Best regards,<br>WarrantyVault Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send welcome email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
