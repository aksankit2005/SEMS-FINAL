import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { SportsDataProvider } from './context/SportsDataContext';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthModal } from './components/common/AuthModal';
import { ScrollToTop } from './components/common/ScrollToTop';

import { HomePage } from './pages/HomePage';

import { RegistrationPage } from './pages/RegistrationPage';
import { LiveMatchPortalPage } from './pages/live/LiveMatchPortalPage';
import { SchedulePage } from './pages/SchedulePage';
import { ResultsPage } from './pages/ResultsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CoordinatorsPage } from './pages/CoordinatorsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { GalleryPage } from './pages/GalleryPage';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { FAQPage } from './pages/FAQPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

import { PRLoginPage } from './pages/pr/PRLoginPage';
import { PRDashboardPage } from './pages/pr/PRDashboardPage';
import { PREventsPage } from './pages/pr/PREventsPage';
import { PRUploadPage } from './pages/pr/PRUploadPage';
import { PRProtectedRoute } from './components/pr/PRProtectedRoute';

import { CollegeHeadLoginPage } from './pages/collegeHead/CollegeHeadLoginPage';
import { CollegeHeadDashboardPage } from './pages/collegeHead/CollegeHeadDashboardPage';
import { CollegeHeadProtectedRoute } from './components/collegeHead/CollegeHeadProtectedRoute';

import { CoordinatorLoginPage } from './pages/coordinator/CoordinatorLoginPage';
import { CoordinatorProtectedRoute } from './components/coordinator/CoordinatorProtectedRoute';

// ── Admin Portal Imports ──────────────────────────────────────────────────
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage';
import { AdminPRManagementPage } from './pages/admin/AdminPRManagementPage';
import { AdminCoordinatorsPage } from './pages/admin/AdminCoordinatorsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminMasterDataPage } from './pages/admin/AdminMasterDataPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';
import { AdminCommitteePage } from './pages/admin/AdminCommitteePage';
import { AdminCoordinatorMatchResultsPage } from './pages/admin/AdminCoordinatorMatchResultsPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { SuperCoordinatorLoginPage } from './pages/superCoordinator/SuperCoordinatorLoginPage';
import { SuperCoordinatorDashboardPage } from './pages/superCoordinator/SuperCoordinatorDashboardPage';
import { SuperCoordinatorProtectedRoute } from './components/superCoordinator/SuperCoordinatorProtectedRoute';

import { NotFoundPage } from './pages/NotFoundPage';

// ── Sport Coordinator Pages (independent modules) ──────────────────────────
import { BadmintonCoordinatorPage } from './pages/coordinator/sports/badminton/BadmintonCoordinatorPage';
import { FootballCoordinatorPage } from './pages/coordinator/sports/football/FootballCoordinatorPage';
import { BasketballCoordinatorPage } from './pages/coordinator/sports/basketball/BasketballCoordinatorPage';
import { VolleyballCoordinatorPage } from './pages/coordinator/sports/volleyball/VolleyballCoordinatorPage';
import { TableTennisCoordinatorPage } from './pages/coordinator/sports/table-tennis/TableTennisCoordinatorPage';
import { ChessCoordinatorPage } from './pages/coordinator/sports/chess/ChessCoordinatorPage';
import { KabaddiCoordinatorPage } from './pages/coordinator/sports/kabaddi/KabaddiCoordinatorPage';
import { KhoKhoCoordinatorPage } from './pages/coordinator/sports/kho-kho/KhoKhoCoordinatorPage';
import { AthleticsCoordinatorPage } from './pages/coordinator/sports/athletics/AthleticsCoordinatorPage';
import { TugOfWarCoordinatorPage } from './pages/coordinator/sports/tug-of-war/TugOfWarCoordinatorPage';
import { GullyCricketCoordinatorPage } from './pages/coordinator/sports/gully-cricket/GullyCricketCoordinatorPage';
import { CricketCoordinatorPage } from './pages/coordinator/sports/cricket/CricketCoordinatorPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <SportsDataProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Standalone Admin Portal Login Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/portal/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin-login" element={<AdminLoginPage />} />

                {/* Dedicated Protected Admin Portal Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="registrations" element={<AdminRegistrationsPage />} />
                  <Route path="pr-management" element={<AdminPRManagementPage />} />
                  <Route path="pr" element={<AdminPRManagementPage />} />
                  <Route path="coordinators" element={<AdminCoordinatorsPage />} />
                  <Route path="announcements" element={<AdminAnnouncementsPage />} />
                  <Route path="master-data" element={<AdminMasterDataPage />} />
                  <Route path="participants" element={<AdminMasterDataPage />} />
                  <Route path="committee" element={<AdminCommitteePage />} />
                  <Route path="results" element={<AdminResultsPage />} />
                  <Route path="activity" element={<AdminActivityPage />} />
                  <Route path="audit-logs" element={<AdminActivityPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>

                <Route
                  path="/portal/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="registrations" element={<AdminRegistrationsPage />} />
                  <Route path="pr-management" element={<AdminPRManagementPage />} />
                  <Route path="pr" element={<AdminPRManagementPage />} />
                  <Route path="coordinators" element={<AdminCoordinatorsPage />} />
                  <Route path="announcements" element={<AdminAnnouncementsPage />} />
                  <Route path="master-data" element={<AdminMasterDataPage />} />
                  <Route path="participants" element={<AdminMasterDataPage />} />
                  <Route path="committee" element={<AdminCommitteePage />} />
                  <Route path="results" element={<AdminResultsPage />} />
                  <Route path="activity" element={<AdminActivityPage />} />
                  <Route path="audit-logs" element={<AdminActivityPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>

                {/* Standalone Super Coordinator (President / Event Host) Routes */}
                <Route path="/super-coordinator/login" element={<SuperCoordinatorLoginPage />} />
                <Route path="/super-coordinator-login" element={<SuperCoordinatorLoginPage />} />
                <Route path="/super-coordinator/dashboard" element={<SuperCoordinatorProtectedRoute><SuperCoordinatorDashboardPage /></SuperCoordinatorProtectedRoute>} />
                <Route path="/super-coordinator" element={<SuperCoordinatorProtectedRoute><SuperCoordinatorDashboardPage /></SuperCoordinatorProtectedRoute>} />

                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<HomePage />} />

                  <Route path="/registration" element={<RegistrationPage />} />
                  <Route path="/register" element={<RegistrationPage />} />
                  <Route path="/registration/:eventId" element={<RegistrationPage />} />
                  <Route path="/register/:eventId" element={<RegistrationPage />} />
                  <Route path="/live" element={<LiveMatchPortalPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/coordinator-results" element={<AdminCoordinatorMatchResultsPage />} />
                  <Route path="/admin-coordinator-results" element={<AdminCoordinatorMatchResultsPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/announcements" element={<AnnouncementsPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<AboutPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />

                  {/* Public PR Login Routes */}
                  <Route path="/pr/login" element={<PRLoginPage />} />
                  <Route path="/pr-login" element={<PRLoginPage />} />

                  {/* Protected PR Coordinator Portal Routes */}
                  <Route path="/pr/dashboard" element={<PRProtectedRoute><PRDashboardPage /></PRProtectedRoute>} />
                  <Route path="/pr-dashboard" element={<PRProtectedRoute><PRDashboardPage /></PRProtectedRoute>} />
                  <Route path="/pr/events" element={<PRProtectedRoute><PREventsPage /></PRProtectedRoute>} />
                  <Route path="/pr/upload" element={<PRProtectedRoute><PRUploadPage /></PRProtectedRoute>} />
                  <Route path="/pr/gallery-upload" element={<PRProtectedRoute><PRUploadPage /></PRProtectedRoute>} />
                  <Route path="/pr/video-upload" element={<PRProtectedRoute><PRUploadPage /></PRProtectedRoute>} />
                  <Route path="/pr/media-management" element={<PRProtectedRoute><PREventsPage /></PRProtectedRoute>} />

                  {/* Public College Head Login Route */}
                  <Route path="/college-head/login" element={<CollegeHeadLoginPage />} />

                  {/* Protected College Head Portal Routes */}
                  <Route path="/college-head/dashboard" element={<CollegeHeadProtectedRoute><CollegeHeadDashboardPage /></CollegeHeadProtectedRoute>} />

                  {/* Public Sport Coordinator Login Routes */}
                  <Route path="/coordinator/login" element={<CoordinatorLoginPage />} />
                  <Route path="/coordinator-login" element={<CoordinatorLoginPage />} />

                  {/* Protected Sport Coordinator Portal Routes */}
                  <Route path="/coordinator/badminton" element={<CoordinatorProtectedRoute><BadmintonCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/football" element={<CoordinatorProtectedRoute><FootballCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/basketball" element={<CoordinatorProtectedRoute><BasketballCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/volleyball" element={<CoordinatorProtectedRoute><VolleyballCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/table-tennis" element={<CoordinatorProtectedRoute><TableTennisCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/chess" element={<CoordinatorProtectedRoute><ChessCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/kabaddi" element={<CoordinatorProtectedRoute><KabaddiCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/kho-kho" element={<CoordinatorProtectedRoute><KhoKhoCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/athletics" element={<CoordinatorProtectedRoute><AthleticsCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/tug-of-war" element={<CoordinatorProtectedRoute><TugOfWarCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/gully-cricket" element={<CoordinatorProtectedRoute><GullyCricketCoordinatorPage /></CoordinatorProtectedRoute>} />
                  <Route path="/coordinator/cricket" element={<CoordinatorProtectedRoute><CricketCoordinatorPage /></CoordinatorProtectedRoute>} />
                </Route>

                {/* Full-Screen Standalone Global 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              <AuthModal />
            </Router>
          </SportsDataProvider>
        </ConfirmProvider>
      </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
