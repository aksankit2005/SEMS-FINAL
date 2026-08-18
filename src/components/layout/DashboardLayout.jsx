import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { HeaderNavbar } from './HeaderNavbar';
import { MobileDrawer } from './MobileDrawer';
import { Footer } from './Footer';
import { MaintenancePage } from '../common/MaintenancePage';
import { adminApi } from '../../services/adminApi';

export const DashboardLayout = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [settings, setSettings] = useState({ maintenanceMode: false });
  const [isLayoutHidden, setIsLayoutHidden] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      setSettings(data || {});
    } catch (e) {}
  };

  useEffect(() => {
    loadSettings();

    const handleSettingsUpdate = () => {
      loadSettings();
    };

    const handleLayoutToggle = (e) => {
      setIsLayoutHidden(Boolean(e.detail?.hide));
    };

    window.addEventListener('sems_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    window.addEventListener('sems_layout_toggle', handleLayoutToggle);

    return () => {
      window.removeEventListener('sems_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('sems_layout_toggle', handleLayoutToggle);
    };
  }, []);

  // Render full-screen System Maintenance Mode for public users when enabled by Admin
  if (settings.maintenanceMode) {
    return <MaintenancePage settings={settings} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors ${isLayoutHidden ? 'h-screen overflow-hidden' : ''}`}>
      {/* Sticky Top Navbar */}
      {!isLayoutHidden && (
        <HeaderNavbar onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} />
      )}

      {/* Main Full-Width Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        <main className="flex-1 w-full">
          <Outlet />
        </main>

        {/* Footer at bottom */}
        {!isLayoutHidden && <Footer />}
      </div>

      {/* Mobile Navigation Drawer */}
      {!isLayoutHidden && (
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />
      )}
    </div>
  );
};
