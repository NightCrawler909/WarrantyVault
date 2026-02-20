const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const warrantyService = require('../services/warrantyService');
const ocrService = require('../services/ocrService');
const fs = require('fs');
const path = require('path');

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

    // Delete old invoice file if it exists
    if (product.invoiceUrl) {
      const oldFilePath = path.join(__dirname, '../uploads/invoices', path.basename(product.invoiceUrl));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update product with new invoice details
    product.invoiceUrl = `/uploads/invoices/${req.file.filename}`;
    product.invoiceFileName = req.file.originalname;
    product.invoiceSize = req.file.size;
    product.invoiceMimeType = req.file.mimetype;
    
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // If error occurs after file upload, delete the uploaded file
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/invoices', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/products/:id/invoice
// @access  Private
exports.deleteInvoice = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.userId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to update this product', 403));
    }

    if (!product.invoiceUrl) {
      return next(new AppError('No invoice found for this product', 404));
    }

    // Delete file from server
    const filePath = path.join(__dirname, '../uploads/invoices', path.basename(product.invoiceUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove invoice fields from product
    product.invoiceUrl = undefined;
    product.invoiceFileName = undefined;
    product.invoiceSize = undefined;
    product.invoiceMimeType = undefined;
    
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Serve invoice file (secure)
// @route   GET /api/products/:id/invoice
// @access  Private
exports.serveInvoice = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Validate ownership
    if (product.userId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to access this invoice', 403));
    }

    if (!product.invoiceUrl) {
      return next(new AppError('No invoice found for this product', 404));
    }

    const filePath = path.join(__dirname, '../uploads/invoices', path.basename(product.invoiceUrl));
    
    if (!fs.existsSync(filePath)) {
      return next(new AppError('Invoice file not found on server', 404));
    }

    // Set appropriate headers
    res.setHeader('Content-Type', product.invoiceMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${product.invoiceFileName || 'invoice'}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// @desc    Extract invoice data using OCR
// @route   POST /api/products/:id/extract-invoice
// @access  Private
exports.extractInvoiceData = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Validate ownership
    if (product.userId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to access this product', 403));
    }

    if (!product.invoiceUrl) {
      return next(new AppError('No invoice found for this product', 404));
    }

    const filePath = path.join(__dirname, '../uploads/invoices', path.basename(product.invoiceUrl));
    
    if (!fs.existsSync(filePath)) {
      return next(new AppError('Invoice file not found on server', 404));
    }

    // Process invoice with OCR
    const result = await ocrService.processInvoice(filePath);

    if (!result.success) {
      return next(new AppError(result.error || 'Failed to extract invoice data', 400));
    }

    res.status(200).json({
      success: true,
      data: result.extractedData,
      message: 'Invoice data extracted successfully',
    });
  } catch (error) {
    console.error('Extract invoice error:', error);
    // Pass through specific error messages
    const errorMessage = error.message || 'Failed to process invoice. Please try again.';
    next(new AppError(errorMessage, 500));
  }
};

// @desc    Extract invoice data from temporary upload (for add product page)
// @route   POST /api/products/extract-temp-invoice
// @access  Private
exports.extractTempInvoice = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(new AppError('Please upload an invoice file', 400));
    }

    const filePath = req.file.path;

    // Process invoice with OCR
    const result = await ocrService.processInvoice(filePath);

    // Clean up temporary file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    if (!result.success) {
      return next(new AppError(result.error || 'Failed to extract invoice data', 400));
    }

    res.status(200).json({
      success: true,
      data: result.extractedData,
      message: 'Invoice data extracted successfully',
    });
  } catch (error) {
    console.error('Extract temp invoice error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    const errorMessage = error.message || 'Failed to process invoice. Please try again.';
    next(new AppError(errorMessage, 500));
  }
};
