const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.patch('/me', requireAuth, authController.updateMe);
router.post('/change-password', requireAuth, authController.changePassword);

router.post('/verify-email/request', requireAuth, authController.requestVerification);
router.post('/verify-email/confirm', authController.confirmVerification);
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);

module.exports = router;
