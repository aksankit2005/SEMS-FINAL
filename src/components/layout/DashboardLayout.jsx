import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { HeaderNavbar } from './HeaderNavbar';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { MobileDrawer } from './MobileDrawer';
import { Footer } from './Footer';
import { MaintenancePage } from '../common/MaintenancePage';
import { adminApi } from '../../services/adminApi';

export const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [settings, setSettings] = useState({ maintenanceMode: false });

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

    window.addEventListener('sems_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    return () => {
      window.removeEventListener('sems_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  // Render full-screen System Maintenance Mode for public users when enabled by Admin
  if (settings.maintenanceMode) {
    return <MaintenancePage settings={settings} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Sticky Top Navbar */}
      <HeaderNavbar onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} />

      {/* Body Area: Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Collapsible Left Sidebar */}
        <CollapsibleSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">
            <Outlet />
          </main>

          {/* Footer at bottom of content area */}
          <Footer />
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />
    </div>
  );
};
