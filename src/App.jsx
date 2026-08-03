import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SportsDataProvider } from './context/SportsDataContext';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthModal } from './components/common/AuthModal';

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
import { CoordinatorDashboardPage } from './pages/coordinator/CoordinatorDashboardPage';
import { CoordinatorProtectedRoute } from './components/coordinator/CoordinatorProtectedRoute';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SportsDataProvider>
            <Router>
              <Routes>
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

                  {/* Public College Head Login Route (ONLY ONE NEW PUBLIC LOGIN ROUTE) */}
                  <Route path="/college-head/login" element={<CollegeHeadLoginPage />} />

                  {/* Protected College Head Portal Routes */}
                  <Route path="/college-head/dashboard" element={<CollegeHeadProtectedRoute><CollegeHeadDashboardPage /></CollegeHeadProtectedRoute>} />

                  {/* Public Sport Coordinator Login Routes */}
                  <Route path="/coordinator/login" element={<CoordinatorLoginPage />} />
                  <Route path="/coordinator-login" element={<CoordinatorLoginPage />} />

                  {/* Protected Sport Coordinator Portal Routes */}
                  <Route path="/coordinator/dashboard" element={<CoordinatorProtectedRoute><CoordinatorDashboardPage /></CoordinatorProtectedRoute>} />
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


