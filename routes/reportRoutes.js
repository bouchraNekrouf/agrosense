const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.post('/', auth, reportController.createReport);
router.get('/mine', auth, reportController.listMyReports);
router.get('/received', auth, reportController.listReceivedReports);
router.post('/:id/send', auth, reportController.sendReportToExpert);
router.post('/:id/feedback', auth, reportController.addFeedback);
router.get('/:id/download', auth, reportController.downloadReport);
router.delete('/:id', auth, reportController.deleteReportForFarmer);

module.exports = router;

