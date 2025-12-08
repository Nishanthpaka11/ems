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

  // read user from localStorage safely
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('user')) || null;
  } catch (e) {
    storedUser = null;
  }

  const navLinks = userRole === 'admin'
    ? [
        { 
          label: 'Home', 
          path: '/admin-dashboard', 
          icon: 'bi-house-door-fill',
          end:true 
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
          icon: 'bi-house-door-fill' ,
          end:true
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
          
        </div>

        {/* ====== USER PROFILE SECTION (added) ====== */}
        <div className="sidebar-user" onClick={() => { closeSidebar(); navigate(userRole === 'admin' ? '/admin-dashboard/employeeprofileviewer' : '/employee-dashboard/profile'); }}>
          <img
            src={
              (storedUser && (storedUser.profilePic || storedUser.avatar || storedUser.photo))
                ? (storedUser.profilePic || storedUser.avatar || storedUser.photo)
                : '/default-avatar.png'
            }
            alt="User Avatar"
            className="user-avatar"
            onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
          />

          <div className="user-info">
            <h4 className="user-name">{(storedUser && (storedUser.fullName || storedUser.name)) ? (storedUser.fullName || storedUser.name) : 'Employee Name'}</h4>
            <p className="user-role">{userRole === 'admin' ? 'Administrator' : 'Employee'}</p>
          </div>
        </div>
        {/* ====== end USER PROFILE SECTION ====== */}

        <nav className="sidebar-nav">
          <ul>
            {navLinks.map(link => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.end}
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
