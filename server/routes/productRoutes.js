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
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/').get(getAllProducts).post(createProduct);
router.route('/stats').get(getStats);
router.route('/analytics').get(getAnalytics);
router.route('/expiring').get(getExpiringProducts);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.route('/:id/invoice').post(upload.single('invoice'), uploadInvoice);

module.exports = router;
