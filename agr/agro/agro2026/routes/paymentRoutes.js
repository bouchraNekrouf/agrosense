const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.get('/mine', auth, paymentController.listMyPayments);

module.exports = router;

