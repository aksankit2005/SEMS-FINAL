import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { HeaderNavbar } from './HeaderNavbar';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { MobileDrawer } from './MobileDrawer';
import { Footer } from './Footer';

export const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
