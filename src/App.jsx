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
import { LiveMatchesPage } from './pages/LiveMatchesPage';
import { SchedulePage } from './pages/SchedulePage';
import { ResultsPage } from './pages/ResultsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CoordinatorsPage } from './pages/CoordinatorsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { GalleryPage } from './pages/GalleryPage';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { PRLoginPage } from './pages/pr/PRLoginPage';
import { PRDashboardPage } from './pages/pr/PRDashboardPage';
import { PREventsPage } from './pages/pr/PREventsPage';
import { PRUploadPage } from './pages/pr/PRUploadPage';
import { PRProtectedRoute } from './components/pr/PRProtectedRoute';

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
                  <Route path="/live" element={<LiveMatchesPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/coordinators" element={<CoordinatorsPage />} />
                  <Route path="/announcements" element={<AnnouncementsPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<AboutPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />

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
                </Route>
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
