import express from 'express';
import {
  collegeHeadLogin,
  getDashboardStats,
  getStudents,
  getRegistrations,
  getSportsParticipation,
  getMedalSummary,
  exportReport
} from '../controllers/collegeHeadController.js';
import { verifyCollegeHeadToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/college-head/login', authLimiter, collegeHeadLogin);
router.get('/college-head/dashboard-stats', verifyCollegeHeadToken, getDashboardStats);
router.get('/college-head/students', verifyCollegeHeadToken, getStudents);
router.get('/college-head/registrations', verifyCollegeHeadToken, getRegistrations);
router.get('/college-head/sports-participation', verifyCollegeHeadToken, getSportsParticipation);
router.get('/college-head/medal-summary', verifyCollegeHeadToken, getMedalSummary);
router.get('/college-head/export-report', verifyCollegeHeadToken, exportReport);

export default router;
