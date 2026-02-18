const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for performance
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['electronics', 'appliances', 'furniture', 'automotive', 'tools', 'other'],
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    warrantyPeriod: {
      type: Number, // in months
      required: [true, 'Warranty period is required'],
    },
    warrantyExpiry: {
      type: Date,
      index: true, // Index for sorting and filtering
    },
    price: {
      type: Number,
    },
    retailer: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    invoiceUrl: {
      type: String,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'expiring', 'expired'],
      default: 'active',
      index: true, // Index for filtering by status
    },
    remindersSent: [{
      type: Date,
    }],
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for efficient queries
productSchema.index({ userId: 1, status: 1 });
productSchema.index({ userId: 1, warrantyExpiry: 1 });

// Virtual: Calculate remaining days
productSchema.virtual('remainingDays').get(function() {
  if (!this.warrantyExpiry) return null;
  
  const now = new Date();
  const expiry = new Date(this.warrantyExpiry);
  const diffMs = expiry - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual: Calculate warranty usage percentage
productSchema.virtual('warrantyUsagePercent').get(function() {
  if (!this.purchaseDate || !this.warrantyExpiry) return null;
  
  const now = new Date();
  const purchase = new Date(this.purchaseDate);
  const expiry = new Date(this.warrantyExpiry);
  
  const totalDuration = expiry - purchase;
  const elapsed = now - purchase;
  
  const percentage = (elapsed / totalDuration) * 100;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(percentage)));
});

// Pre-save hook: Calculate warranty expiry date
productSchema.pre('save', function (next) {
  if (this.isModified('purchaseDate') || this.isModified('warrantyPeriod')) {
    const purchaseDate = new Date(this.purchaseDate);
    this.warrantyExpiry = new Date(
      purchaseDate.getFullYear(),
      purchaseDate.getMonth() + this.warrantyPeriod,
      purchaseDate.getDate()
    );
  }
  next();
});

// Pre-save hook: Auto-update status based on expiry
productSchema.pre('save', function (next) {
  if (!this.warrantyExpiry) {
    return next();
  }

  const now = new Date();
  const expiryDate = new Date(this.warrantyExpiry);
  const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    this.status = 'expired';
  } else if (daysRemaining <= 30) {
    this.status = 'expiring';
  } else {
    this.status = 'active';
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);
