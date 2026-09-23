import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AdminHeader from "./admin/AdminHeader";
import Toast from "./Toast";

/**
 * Master Admin Layout Grid.
 * Shared layout across all /admin routes with unified header, fixed sidebar column,
 * flexible zero-overflow main content area, and mobile drawer support.
 */
export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {/* 1. Master Sidebar Column */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* 2. Main Admin Area (Flex Column with zero min-width to eliminate horizontal overflow) */}
      <div className="admin-main">
        {/* Top Admin Operational Header */}
        <AdminHeader
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Dynamic Page Content Viewport */}
        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>

      {/* Floating System Toast Container (Fixed in viewport, never disrupts grid layout) */}
      <Toast />
    </div>
  );
};

export default AdminLayout;
