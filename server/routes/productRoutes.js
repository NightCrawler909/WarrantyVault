const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStats,
  getExpiringProducts,
  getAnalytics,
  uploadInvoice,
  deleteInvoice,
  serveInvoice,
  extractInvoiceData,
  extractTempInvoice,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/').get(getAllProducts).post(createProduct);
router.route('/stats').get(getStats);
router.route('/analytics').get(getAnalytics);
router.route('/expiring').get(getExpiringProducts);
router.route('/extract-temp-invoice').post(upload.single('invoice'), extractTempInvoice);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.route('/:id/invoice')
  .get(serveInvoice)
  .post(upload.single('invoice'), uploadInvoice)
  .delete(deleteInvoice);
router.route('/:id/extract-invoice').post(extractInvoiceData);

module.exports = router;
