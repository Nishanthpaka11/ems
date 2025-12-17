// src/Components/loginpage/loginpage/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { authFetch } from '../Components/utils/authFetch';

const Sidebar = ({ userRole = 'employee' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');

  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    storedUser = null;
  }

  /* =====================
     PROFILE IMAGE
     ===================== */
  useEffect(() => {
    if (storedUser?.photo || storedUser?.avatar || storedUser?.profilePic) {
      setAvatarUrl(
        storedUser.photo || storedUser.avatar || storedUser.profilePic
      );
    }

    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res || !res.ok) return;
        const data = await res.json();
        if (data.photo) setAvatarUrl(data.photo);
      } catch {}
    };

    if (token) fetchProfile();
  }, [API_BASE, token, storedUser]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const toggleSidebar = () => setOpen(!open);
  const closeSidebar = () => setOpen(false);

  /* =====================
     NAV LINKS
     ===================== */
  const navLinks =
    userRole === 'admin'
      ? [
          { label: 'Home', path: '/admin-dashboard', icon: 'bi-house-door-fill', end: true },
          { label: 'Employee Viewer', path: '/admin-dashboard/employeeprofileviewer', icon: 'bi-people-fill' },
          { label: 'Add Employee', path: '/admin-dashboard/add-employee', icon: 'bi-person-plus-fill' },
          { label: 'Leave Management', path: '/admin-dashboard/leavemanagement', icon: 'bi-calendar-check-fill' },
          { label: 'Task Overview', path: '/admin-dashboard/taskoverview', icon: 'bi-list-task' },
          { label: 'Analytics', path: '/admin-dashboard/analytics', icon: 'bi-graph-up-arrow' },
          { label: 'Attendance Summary', path: '/admin-dashboard/attendancesummary', icon: 'bi-clock-history' },
          { label: 'Settings', path: '/admin-dashboard/adminsettings', icon: 'bi-gear-fill' },
        ]
      : [
          { label: 'Home', path: '/employee-dashboard', icon: 'bi-house-door-fill', end: true },
          { label: 'Profile', path: '/employee-dashboard/profile', icon: 'bi-person-circle' },
          { label: 'Leave Management', path: '/employee-dashboard/leave', icon: 'bi-calendar-check-fill' },
          { label: 'Task Tracking', path: '/employee-dashboard/tasks', icon: 'bi-list-check' },
        ];

  const displayName =
    storedUser?.fullName ||
    storedUser?.name ||
    (userRole === 'admin' ? 'Admin' : 'Employee');

  const displayRole = userRole === 'admin' ? 'Administrator' : 'Employee';

  const profileRedirect =
    userRole === 'admin'
      ? '/admin-dashboard/employeeprofileviewer'
      : '/employee-dashboard/profile';

  return (
    <>
      {/* MOBILE TOGGLE */}
      <button
        className={`sidebar-toggle ${open ? 'active' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {open && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>

        {/* ===== HEADER WITH LOGO (RESTORED) ===== */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="isar-logo-wrap">
              <img
                src="/logo1.png"
                alt="ISAR Logo"
                className="isar-logo"
              />
            </div>
            <span className="brand-text">ISAR EMS</span>
          </div>
        </div>

        {/* USER SECTION */}
        <div
          className="sidebar-user"
          onClick={() => {
            closeSidebar();
            navigate(profileRedirect);
          }}
        >
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="user-avatar"
            onError={(e) => (e.target.src = '/default-avatar.png')}
          />

          <div className="user-info">
            <h4 className="user-name">{displayName}</h4>
            <p className="user-role">{displayRole}</p>
          </div>
        </div>

        {/* NAV */}
        <nav className="sidebar-nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) =>
                    isActive ? 'nav-link active' : 'nav-link'
                  }
                  onClick={closeSidebar}
                >
                  <i className={`bi ${link.icon}`}></i>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* FOOTER */}
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