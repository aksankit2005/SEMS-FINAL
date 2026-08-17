import express from 'express';
import {
  prLogin,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadMedia,
  getMediaByEventId,
  deleteMedia,
  getCloudinarySignature,
  getAllMedia
} from '../controllers/prController.js';
import { verifyPRToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/pr/login', authLimiter, prLogin);
router.get('/pr/cloudinary-signature', verifyPRToken, getCloudinarySignature);
router.get('/events', getEvents);
router.get('/events/:id', getEventById);
router.post('/events', verifyPRToken, createEvent);
router.put('/events/:id', verifyPRToken, updateEvent);
router.delete('/events/:id', verifyPRToken, deleteEvent);

router.get('/media', getAllMedia);
router.post('/media/upload', verifyPRToken, uploadMedia);
router.get('/media/event/:eventId', getMediaByEventId);
router.delete('/media/:id', verifyPRToken, deleteMedia);

export default router;
