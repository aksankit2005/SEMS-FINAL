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
  deleteCoordinatorDB,
  getDashboardStatsDB,
  getAuditLogsDB,
  createAuditLogDB,
  getAdminRegistrationsDB,
  deleteRegistrationDB,
  updateRegistrationStatusDB,
  getAnnouncementsDB,
  saveAnnouncementDB,
  toggleAnnouncementPublishDB,
  deleteAnnouncementDB,
  getPRMediaFoldersDB,
  getPRMediaFilesDB,
  deletePRMediaFileDB,
  deletePRFolderDB,
  getSettingsDB,
  updateSettingsDB,
  getCommitteeDB,
  saveCommitteeMemberDB,
  deleteCommitteeMemberDB,
  getAdminResultsDB
} from '../controllers/adminController.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/admin/login', authLimiter, adminLogin);
router.post('/super-coordinator/login', authLimiter, superCoordinatorLogin);
router.get('/admin/profile', verifyAdminToken, getAdminProfile);

// Dashboard Statistics & Audit Trail
router.get('/admin/dashboard-stats', getDashboardStatsDB);
router.get('/admin/audit-logs', getAuditLogsDB);
router.post('/admin/audit-logs', createAuditLogDB);

// Coordinator Management endpoints
router.get('/admin/coordinators', getCoordinatorsDB);
router.post('/admin/coordinators', saveCoordinatorDB);
router.patch('/admin/coordinators/:id/status', toggleCoordinatorStatusDB);
router.post('/admin/coordinators/:id/reset-password', resetCoordinatorPasswordDB);
router.delete('/admin/coordinators/:id', deleteCoordinatorDB);

// Student & Team Registrations endpoints
router.get('/admin/registrations', getAdminRegistrationsDB);
router.delete('/admin/registrations/:id', deleteRegistrationDB);
router.patch('/admin/registrations/:id/status', updateRegistrationStatusDB);

// Public Announcements endpoints
router.get('/admin/announcements', getAnnouncementsDB);
router.post('/admin/announcements', saveAnnouncementDB);
router.patch('/admin/announcements/:id/publish', toggleAnnouncementPublishDB);
router.delete('/admin/announcements/:id', deleteAnnouncementDB);

// PR Media & Folders endpoints
router.get('/admin/pr-media/folders', verifyAdminToken, getPRMediaFoldersDB);
router.get('/admin/pr-media/files', verifyAdminToken, getPRMediaFilesDB);
router.delete('/admin/pr-media/files/:id', verifyAdminToken, deletePRMediaFileDB);
router.delete('/admin/pr-media/folders/:id', verifyAdminToken, deletePRFolderDB);

// System Settings & Committee endpoints
router.get('/admin/settings', getSettingsDB);
router.post('/admin/settings', updateSettingsDB);
router.get('/admin/committee', getCommitteeDB);
router.post('/admin/committee/members', saveCommitteeMemberDB);
router.delete('/admin/committee/members/:id', deleteCommitteeMemberDB);

// Results & Leaderboard endpoints
router.get('/admin/results', getAdminResultsDB);

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

