const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// Define routes
router.post('/', auth, orderController.createOrder); // Create order
router.get('/expert', auth, orderController.getExpertOrders); // Get expert's received orders
router.get('/farmer', auth, orderController.getFarmerOrders); // Get farmer's placed orders
router.get('/stats', auth, orderController.getExpertStats); // Get expert dashboard stats
router.get('/all', auth, orderController.getAllOrders); // Admin: Get all orders
router.put('/:id/status', auth, orderController.updateOrderStatus); // Update status
router.put('/:id/receive', auth, orderController.confirmFarmerReception); // Farmer confirms receipt

module.exports = router;
