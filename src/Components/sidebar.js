import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { authFetch } from '../Components/utils/authFetch';

const Sidebar = ({ userRole = 'employee' }) => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');

  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('user')) || null;
  } catch {}

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/profile`);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (data.photo) setAvatarUrl(data.photo);
      } catch {}
    };
    if (token) fetchProfile();
  }, [API_BASE, token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/employee-dashboard', icon: 'bi-house-door-fill', end: true },
    { label: 'Profile', path: '/employee-dashboard/profile', icon: 'bi-person-circle' },
    { label: 'Leave Management', path: '/employee-dashboard/leave', icon: 'bi-calendar-check-fill' },
    { label: 'Task Tracking', path: '/employee-dashboard/tasks', icon: 'bi-list-check' },
  ];

  return (
    <aside className="sidebar">

      {/* BRAND */}
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

      {/* USER */}
      <div className="sidebar-user">
        <img
          src={avatarUrl}
          alt="User"
          className="user-avatar"
          onError={(e) => (e.target.src = '/default-avatar.png')}
        />
        <div className="user-info">
          <h4>{storedUser?.fullName || 'Employee'}</h4>
          <p>Employee</p>
        </div>
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end}
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            <i className={`bi ${link.icon}`}></i>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
