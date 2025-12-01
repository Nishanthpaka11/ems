// src/Components/loginpage/loginpage/AppLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom'
import './Sidebar.css';
import Sidebar from './sidebar';
const AppLayout = ({ userRole }) => {
  return (
    <div className="app-layout">
      <Sidebar userRole={userRole} />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
