import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar'; // Adjust path as needed
import './AdminDashboard.css';

const AdminDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar userRole="admin" onLinkClick={() => setSidebarOpen(false)} />
      </div>

      {/* No topbar here — removed on purpose */}

      {/* Main content */}
      <main className="admin-content" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
