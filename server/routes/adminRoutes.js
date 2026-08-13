import express from 'express';
import { adminLogin, superCoordinatorLogin, getAdminProfile } from '../controllers/adminController.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/admin/login', authLimiter, adminLogin);
router.post('/super-coordinator/login', authLimiter, superCoordinatorLogin);
router.get('/admin/profile', verifyAdminToken, getAdminProfile);

export default router;
