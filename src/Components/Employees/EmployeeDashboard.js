import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar'; 
import './EmployeeDashboard.css';

const EmployeeDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="emp-layout">
      {/* Sidebar */}
      <div className={`emp-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar userRole="employee" onLinkClick={() => setSidebarOpen(false)} />
      </div>

      {/* No topbar here — removed on purpose */}

      {/* Main content */}
      <main className="emp-content" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeDashboardLayout;