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
  saveSessionDB,
  deleteSessionDB,
  saveCommitteeMemberDB,
  deleteCommitteeMemberDB,
  getAdminResultsDB,
  deleteCoordinatorEventDB,
  deleteMasterDataDB,
  bulkDeleteMasterDataDB
} from '../controllers/adminController.js';
import { getCloudinarySignature } from '../controllers/prController.js';
import {
  verifyAdminToken,
  verifySuperCoordinatorToken,
  verifyAdminOrSuperCoordinatorToken
} from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Public / Auth Gateways
router.post('/admin/login', authLimiter, adminLogin);
router.post('/super-coordinator/login', authLimiter, superCoordinatorLogin);
router.get('/admin/profile', verifyAdminToken, getAdminProfile);
router.get('/admin/cloudinary-signature', verifyAdminToken, getCloudinarySignature);

// Dashboard Statistics & Audit Trail (Admin / Super Coordinator Protected)
router.get('/admin/dashboard-stats', verifyAdminOrSuperCoordinatorToken, getDashboardStatsDB);
router.get('/admin/audit-logs', verifyAdminToken, getAuditLogsDB);
router.post('/admin/audit-logs', verifyAdminToken, createAuditLogDB);

// Coordinator Management endpoints (Admin Protected)
router.get('/admin/coordinators', verifyAdminToken, getCoordinatorsDB);
router.post('/admin/coordinators', verifyAdminToken, saveCoordinatorDB);
router.patch('/admin/coordinators/:id/status', verifyAdminToken, toggleCoordinatorStatusDB);
router.post('/admin/coordinators/:id/reset-password', verifyAdminToken, resetCoordinatorPasswordDB);
router.delete('/admin/coordinators/:id', verifyAdminToken, deleteCoordinatorDB);

// Student & Team Registrations endpoints (Admin Protected)
router.get('/admin/registrations', verifyAdminToken, getAdminRegistrationsDB);
router.delete('/admin/registrations/:id', verifyAdminToken, deleteRegistrationDB);
router.patch('/admin/registrations/:id/status', verifyAdminToken, updateRegistrationStatusDB);

// Public Announcements Management endpoints (Admin Protected)
router.get('/admin/announcements', verifyAdminToken, getAnnouncementsDB);
router.post('/admin/announcements', verifyAdminToken, saveAnnouncementDB);
router.patch('/admin/announcements/:id/publish', verifyAdminToken, toggleAnnouncementPublishDB);
router.delete('/admin/announcements/:id', verifyAdminToken, deleteAnnouncementDB);

// PR Media & Folders endpoints (Admin Protected)
router.get('/admin/pr-media/folders', verifyAdminToken, getPRMediaFoldersDB);
router.get('/admin/pr-media/files', verifyAdminToken, getPRMediaFilesDB);
router.delete('/admin/pr-media/files/:id', verifyAdminToken, deletePRMediaFileDB);
router.delete('/admin/pr-media/folders/:id', verifyAdminToken, deletePRFolderDB);

// System Settings & Committee endpoints (Admin Protected for mutations)
router.get('/admin/settings', getSettingsDB);
router.post('/admin/settings', verifyAdminToken, updateSettingsDB);
router.get('/admin/committee', getCommitteeDB);
router.post('/admin/committee/sessions', verifyAdminToken, saveSessionDB);
router.delete('/admin/committee/sessions/:id', verifyAdminToken, deleteSessionDB);
router.post('/admin/committee/members', verifyAdminToken, saveCommitteeMemberDB);
router.delete('/admin/committee/members/:id', verifyAdminToken, deleteCommitteeMemberDB);

// Results & Leaderboard endpoints
router.get('/admin/results', verifyAdminOrSuperCoordinatorToken, getAdminResultsDB);

// SuperCoordinator & Admin Data & Leaderboard endpoints
router.get('/admin/master-participants', verifyAdminToken, getMasterParticipants);
router.get('/admin/coordinator-events', verifyAdminToken, getSuperCoordinatorEvents);
router.get('/super-coordinator/participants', verifySuperCoordinatorToken, getMasterParticipants);
router.get('/super-coordinator/events', verifySuperCoordinatorToken, getSuperCoordinatorEvents);
router.delete('/super-coordinator/events/:id', verifySuperCoordinatorToken, deleteCoordinatorEventDB);
router.delete('/admin/coordinator-events/:id', verifyAdminToken, deleteCoordinatorEventDB);
router.delete('/admin/events/:id', verifyAdminToken, deleteCoordinatorEventDB);
router.get('/super-coordinator/coordinators', verifySuperCoordinatorToken, getSuperCoordinatorCoordinators);
router.get('/super-coordinator/leaderboard', verifySuperCoordinatorToken, getLeaderboardEntries);
router.post('/super-coordinator/leaderboard', verifySuperCoordinatorToken, saveLeaderboardEntry);
router.delete('/super-coordinator/leaderboard/:id', verifySuperCoordinatorToken, deleteLeaderboardEntry);
router.get('/super-coordinator/hero-slides', verifySuperCoordinatorToken, getHeroSlidesDB);
router.post('/super-coordinator/hero-slides', verifySuperCoordinatorToken, saveHeroSlidesDB);
router.get('/super-coordinator/cloudinary-signature', verifySuperCoordinatorToken, getCloudinarySignature);
router.post('/super-coordinator/change-password', verifySuperCoordinatorToken, changeSuperCoordinatorPasswordDB);

// Master Data Single and Bulk Delete Endpoints
router.delete('/admin/master-data/bulk', verifyAdminOrSuperCoordinatorToken, bulkDeleteMasterDataDB);
router.delete('/admin/master-data/:id', verifyAdminOrSuperCoordinatorToken, deleteMasterDataDB);
router.delete('/super-coordinator/master-data/bulk', verifyAdminOrSuperCoordinatorToken, bulkDeleteMasterDataDB);
router.delete('/super-coordinator/master-data/:id', verifyAdminOrSuperCoordinatorToken, deleteMasterDataDB);

export default router;
