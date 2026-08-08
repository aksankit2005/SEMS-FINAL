import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SportsDataProvider } from './context/SportsDataContext';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthModal } from './components/common/AuthModal';
import { ScrollToTop } from './components/common/ScrollToTop';

import { HomePage } from './pages/HomePage';
import { SportsPage } from './pages/SportsPage';
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

// ── Super Admin Imports ───────────────────────────────────────────────────
import { SuperAdminLoginPage } from './pages/superAdmin/SuperAdminLoginPage';
import { SuperAdminLayout } from './components/superAdmin/SuperAdminLayout';
import { SuperAdminProtectedRoute } from './components/superAdmin/SuperAdminProtectedRoute';
import { SuperAdminDashboardPage } from './pages/superAdmin/SuperAdminDashboardPage';
import { SuperAdminEventsPage } from './pages/superAdmin/SuperAdminEventsPage';
import { SuperAdminCoordinatorsPage } from './pages/superAdmin/SuperAdminCoordinatorsPage';
import { SuperAdminCollegeHeadsPage } from './pages/superAdmin/SuperAdminCollegeHeadsPage';
import { SuperAdminPRPage } from './pages/superAdmin/SuperAdminPRPage';
import { SuperAdminMembersPage } from './pages/superAdmin/SuperAdminMembersPage';
import { SuperAdminParticipantsPage } from './pages/superAdmin/SuperAdminParticipantsPage';
import { SuperAdminRegistrationsPage } from './pages/superAdmin/SuperAdminRegistrationsPage';
import { SuperAdminSchedulePage } from './pages/superAdmin/SuperAdminSchedulePage';
import { SuperAdminLiveMatchesPage } from './pages/superAdmin/SuperAdminLiveMatchesPage';
import { SuperAdminResultsPage } from './pages/superAdmin/SuperAdminResultsPage';
import { SuperAdminAnnouncementsPage } from './pages/superAdmin/SuperAdminAnnouncementsPage';
import { SuperAdminGalleryPage } from './pages/superAdmin/SuperAdminGalleryPage';
import { SuperAdminReportsPage } from './pages/superAdmin/SuperAdminReportsPage';
import { SuperAdminSettingsPage } from './pages/superAdmin/SuperAdminSettingsPage';
import { SuperAdminProfilePage } from './pages/superAdmin/SuperAdminProfilePage';
import { SuperAdminAuditLogsPage } from './pages/superAdmin/SuperAdminAuditLogsPage';
import { SuperAdminEventsSportsPage } from './pages/superAdmin/SuperAdminEventsSportsPage';

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
          <SportsDataProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Dedicated Standalone Super Admin Routes */}
                <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
                <Route path="/super-admin-login" element={<SuperAdminLoginPage />} />

                <Route
                  path="/super-admin"
                  element={
                    <SuperAdminProtectedRoute>
                      <SuperAdminLayout />
                    </SuperAdminProtectedRoute>
                  }
                >
                  <Route index element={<SuperAdminDashboardPage />} />
                  <Route path="dashboard" element={<SuperAdminDashboardPage />} />
                  <Route path="events" element={<SuperAdminEventsPage />} />
                  <Route path="coordinators" element={<SuperAdminCoordinatorsPage />} />
                  <Route path="college-heads" element={<SuperAdminCollegeHeadsPage />} />
                  <Route path="pr-members" element={<SuperAdminPRPage />} />
                  <Route path="members" element={<SuperAdminMembersPage />} />
                  <Route path="participants" element={<SuperAdminParticipantsPage />} />
                  <Route path="registrations" element={<SuperAdminRegistrationsPage />} />
                  <Route path="schedule" element={<SuperAdminSchedulePage />} />
                  <Route path="live-matches" element={<SuperAdminLiveMatchesPage />} />
                  <Route path="results" element={<SuperAdminResultsPage />} />
                  <Route path="announcements" element={<SuperAdminAnnouncementsPage />} />
                  <Route path="gallery" element={<SuperAdminGalleryPage />} />
                  <Route path="reports" element={<SuperAdminReportsPage />} />
                  <Route path="settings" element={<SuperAdminSettingsPage />} />
                  <Route path="profile" element={<SuperAdminProfilePage />} />
                  <Route path="audit-logs" element={<SuperAdminAuditLogsPage />} />
                  <Route path="events-sports" element={<SuperAdminEventsSportsPage />} />
                </Route>

                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/sports" element={<SportsPage />} />
                  <Route path="/registration" element={<RegistrationPage />} />
                  <Route path="/registration/:eventId" element={<RegistrationPage />} />
                  <Route path="/register/:eventId" element={<RegistrationPage />} />
                  <Route path="/live" element={<LiveMatchPortalPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/coordinators" element={<CoordinatorsPage />} />
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
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
