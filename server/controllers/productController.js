const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const warrantyService = require('../services/warrantyService');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Make sure user owns product
    if (product.userId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to access this product', 403));
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res, next) => {
  try {
    req.body.userId = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Make sure user owns product
    if (product.userId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to update this product', 403));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Make sure user owns product
    if (product.userId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to delete this product', 403));
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats with nearest expiry products
// @route   GET /api/products/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const analytics = await warrantyService.getDashboardAnalytics(req.user.id);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expiring products
// @route   GET /api/products/expiring
// @access  Private
exports.getExpiringProducts = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const products = await warrantyService.getExpiringProducts(req.user.id, limit);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive analytics
// @route   GET /api/products/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await warrantyService.getComprehensiveAnalytics(req.user.id);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload invoice
// @route   POST /api/products/:id/invoice
// @access  Private
exports.uploadInvoice = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.userId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to update this product', 403));
    }

    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    product.invoiceUrl = `/uploads/${req.file.filename}`;
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
