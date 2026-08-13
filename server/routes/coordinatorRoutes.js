import express from 'express';
import {
  coordinatorLogin,
  getProfile,
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  updateMatchScore,
  completeMatch,
  getDashboardStats,
  getRegistrations,
  toggleRegistrationStatus,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/coordinatorController.js';
import { verifyCoordinatorToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/coordinator/login', authLimiter, coordinatorLogin);
router.get('/coordinator/profile', verifyCoordinatorToken, getProfile);

router.get('/coordinator/matches', verifyCoordinatorToken, getMatches);
router.post('/coordinator/matches', verifyCoordinatorToken, createMatch);
router.put('/coordinator/matches/:id', verifyCoordinatorToken, updateMatch);
router.delete('/coordinator/matches/:id', verifyCoordinatorToken, deleteMatch);
router.post('/coordinator/matches/:id/score', verifyCoordinatorToken, updateMatchScore);
router.post('/coordinator/matches/:id/complete', verifyCoordinatorToken, completeMatch);

router.get('/coordinator/dashboard-stats', verifyCoordinatorToken, getDashboardStats);
router.get('/coordinator/registrations', verifyCoordinatorToken, getRegistrations);
router.post('/coordinator/registrations/toggle-status', verifyCoordinatorToken, toggleRegistrationStatus);

router.get('/coordinator/events', verifyCoordinatorToken, getEvents);
router.post('/coordinator/events', verifyCoordinatorToken, createEvent);
router.put('/coordinator/events/:id', verifyCoordinatorToken, updateEvent);
router.delete('/coordinator/events/:id', verifyCoordinatorToken, deleteEvent);

export default router;
