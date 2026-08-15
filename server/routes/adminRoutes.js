import express from 'express';
import {
  adminLogin,
  superCoordinatorLogin,
  getAdminProfile,
  getMasterParticipants,
  getSuperCoordinatorEvents,
  getSuperCoordinatorCoordinators,
  getLeaderboardEntries,
  saveLeaderboardEntry,
  deleteLeaderboardEntry,
  getHeroSlidesDB,
  saveHeroSlidesDB,
  changeSuperCoordinatorPasswordDB,
  getCoordinatorsDB,
  saveCoordinatorDB,
  toggleCoordinatorStatusDB,
  resetCoordinatorPasswordDB,
  deleteCoordinatorDB
} from '../controllers/adminController.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/admin/login', authLimiter, adminLogin);
router.post('/super-coordinator/login', authLimiter, superCoordinatorLogin);
router.get('/admin/profile', verifyAdminToken, getAdminProfile);

// Coordinator Management endpoints
router.get('/admin/coordinators', getCoordinatorsDB);
router.post('/admin/coordinators', saveCoordinatorDB);
router.patch('/admin/coordinators/:id/status', toggleCoordinatorStatusDB);
router.post('/admin/coordinators/:id/reset-password', resetCoordinatorPasswordDB);
router.delete('/admin/coordinators/:id', deleteCoordinatorDB);

// SuperCoordinator Data & Leaderboard endpoints
router.get('/super-coordinator/participants', getMasterParticipants);
router.get('/super-coordinator/events', getSuperCoordinatorEvents);
router.get('/super-coordinator/coordinators', getSuperCoordinatorCoordinators);
router.get('/super-coordinator/leaderboard', getLeaderboardEntries);
router.post('/super-coordinator/leaderboard', saveLeaderboardEntry);
router.delete('/super-coordinator/leaderboard/:id', deleteLeaderboardEntry);
router.get('/super-coordinator/hero-slides', getHeroSlidesDB);
router.post('/super-coordinator/hero-slides', saveHeroSlidesDB);
router.post('/super-coordinator/change-password', changeSuperCoordinatorPasswordDB);

export default router;
