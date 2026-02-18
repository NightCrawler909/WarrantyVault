module.exports = {
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Product Categories
  PRODUCT_CATEGORIES: [
    'electronics',
    'appliances',
    'furniture',
    'automotive',
    'tools',
    'other',
  ],

  // Product Status
  PRODUCT_STATUS: {
    ACTIVE: 'active',
    EXPIRING_SOON: 'expiring-soon',
    EXPIRED: 'expired',
  },

  // Warranty Reminder Days
  WARRANTY_REMINDER_DAYS: [30, 15, 7, 1],

  // File Upload
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};
