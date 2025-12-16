// src/Components/loginpage/loginpage/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { authFetch } from '../Components/utils/authFetch';

const Sidebar = ({ userRole = 'employee' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // avatar image for sidebar
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');

  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  // read user from localStorage safely (for name / role text)
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('user')) || null;
  } catch (e) {
    storedUser = null;
  }

  // fetch profile image so sidebar always shows it
  useEffect(() => {
    // 1) try avatar from localStorage user first
    let localUser = null;
    try {
      localUser = JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      localUser = null;
    }

    if (localUser) {
      const localAvatar =
        localUser.profilePic || localUser.avatar || localUser.photo;
      if (localAvatar) {
        setAvatarUrl(localAvatar);
      }
    }

    // 2) also try from /api/profile (same as ProfileSection)
    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res || !res.ok) return;
        const data = await res.json();
        if (data.photo) {
          setAvatarUrl(data.photo);
        }
      } catch (err) {
        console.error('Sidebar profile fetch failed:', err);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [API_BASE, token]);

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

  const navLinks =
    userRole === 'admin'
      ? [
          {
            label: 'Home',
            path: '/admin-dashboard',
            icon: 'bi-house-door-fill',
            end: true,
          },
          {
            label: 'Employee Viewer',
            path: '/admin-dashboard/employeeprofileviewer',
            icon: 'bi-people-fill',
          },
          {
            label: 'Add Employee',
            path: '/admin-dashboard/add-employee',
            icon: 'bi-person-plus-fill',
          },
          {
            label: 'Leave Management',
            path: '/admin-dashboard/leavemanagement',
            icon: 'bi-calendar-check-fill',
          },
          {
            label: 'Task Overview',
            path: '/admin-dashboard/taskoverview',
            icon: 'bi-list-task',
          },
          {
            label: 'Analytics',
            path: '/admin-dashboard/analytics',
            icon: 'bi-graph-up-arrow',
          },
          {
            label: 'Attendance Summary',
            path: '/admin-dashboard/attendancesummary',
            icon: 'bi-clock-history',
          },
          {
            label: 'Settings',
            path: '/admin-dashboard/adminsettings',
            icon: 'bi-gear-fill',
          },
        ]
      : [
          {
            label: 'Home',
            path: '/employee-dashboard',
            icon: 'bi-house-door-fill',
            end: true,
          },
          {
            label: 'Profile',
            path: '/employee-dashboard/profile',
            icon: 'bi-person-circle',
          },
          {
            label: 'Leave Management',
            path: '/employee-dashboard/leave',
            icon: 'bi-calendar-check-fill',
          },
          {
            label: 'Task Tracking',
            path: '/employee-dashboard/tasks',
            icon: 'bi-list-check',
          },
          /*{
            label: 'Punch Correction',
            path: '/employee-dashboard/correction',
            icon: 'bi-clock-fill',
          },*/
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
   
    <span>ISAR EMS</span>
  </div>
</div>


        {/* USER PROFILE SECTION */}
        <div
          className="sidebar-user"
          onClick={() => {
            closeSidebar();
            navigate(
              userRole === 'admin'
                ? '/admin-dashboard/employeeprofileviewer'
                : '/employee-dashboard/profile'
            );
          }}
        >
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="user-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.png';
            }}
          />

          <div className="user-info">
            <h4 className="user-name">
              {storedUser && (storedUser.fullName || storedUser.name)
                ? storedUser.fullName || storedUser.name
                : 'Employee Name'}
            </h4>
            <p className="user-role">
              {userRole === 'admin' ? 'Administrator' : 'Employee'}
            </p>
          </div>
        </div>

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
