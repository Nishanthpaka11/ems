// src/Components/loginpage/loginpage/Sidebar.js
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ userRole = 'employee' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleSidebar = () => {
    setOpen(!open);
  };

  const closeSidebar = () => {
    setOpen(false);
  };

  const navLinks = userRole === 'admin'
    ? [
        { 
          label: 'Home', 
          path: '/admin-dashboard', 
          icon: 'bi-house-door-fill' 
        },
        { 
          label: 'Employee Viewer', 
          path: '/admin-dashboard/employeeprofileviewer', 
          icon: 'bi-people-fill' 
        },
        { 
          label: 'Add Employee', 
          path: '/admin-dashboard/add-employee', 
          icon: 'bi-person-plus-fill' 
        },
        { 
          label: 'Leave Management', 
          path: '/admin-dashboard/leavemanagement', 
          icon: 'bi-calendar-check-fill' 
        },
        { 
          label: 'Task Overview', 
          path: '/admin-dashboard/taskoverview', 
          icon: 'bi-list-task' 
        },
        { 
          label: 'Analytics', 
          path: '/admin-dashboard/analytics', 
          icon: 'bi-graph-up-arrow' 
        },
        { 
          label: 'Attendance Summary', 
          path: '/admin-dashboard/attendancesummary', 
          icon: 'bi-clock-history' 
        },
        { 
          label: 'Settings', 
          path: '/admin-dashboard/adminsettings', 
          icon: 'bi-gear-fill' 
        },
      ]
    : [
        { 
          label: 'Home', 
          path: '/employee-dashboard', 
          icon: 'bi-house-door-fill' 
        },
        { 
          label: 'Profile', 
          path: '/employee-dashboard/profile', 
          icon: 'bi-person-circle' 
        },
        { 
          label: 'Leave Management', 
          path: '/employee-dashboard/leave', 
          icon: 'bi-calendar-check-fill' 
        },
        { 
          label: 'Task Tracking', 
          path: '/employee-dashboard/tasks', 
          icon: 'bi-list-check' 
        },
        { 
          label: 'Punch Correction', 
          path: '/employee-dashboard/correction', 
          icon: 'bi-clock-fill' 
        },
      ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button 
        className={`sidebar-toggle ${open ? 'active' : ''}`} 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <i className="bi bi-building"></i>
            <span>ISAR EMS</span>
          </div>
          <div className="role-badge">
            <i className={userRole === 'admin' ? 'bi bi-shield-check' : 'bi bi-person-badge'}></i>
            {userRole === 'admin' ? 'ADMIN' : 'EMPLOYEE'}
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navLinks.map(link => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                  onClick={closeSidebar}
                >
                  <i className={`bi ${link.icon}`}></i>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
