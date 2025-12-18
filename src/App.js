// src/App.js
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import LoginPage from './Components/LoginPage';
import ForgotPassword from './Components/ForgotPassword';
import AppLayout from './Components/AppLayout';
// Employee imports
import EmployeeDashboardLayout from './Components/Employees/EmployeeDashboard';
import ProfileSection from './Components/Employees/ProfileSection';
import LeaveSection from './Components/Employees/LeaveSection';
import TaskSection from './Components/Employees/TaskSection';
import EmployeeCorrectionRequest from './Components/Employees/EmployeeCorrectionRequest';
import EmployeeHome from './Components/Employees/employeehome';

// Admin imports
import AddEmployee from './Components/Admins/AddEmployee';
import EmployeeDetailsView from './Components/Admins/EmployeeDetailsView';
import AdminDashboardLayout from './Components/Admins/AdminDashboard';
import AdminHome from './Components/Admins/adminhome';
import EmployeeProfileViewer from './Components/Admins/EmployeeProfileViewer';
import AdminSettings from './Components/Admins/AdminSettingsSection';
import AdminCorrectionPanel from './Components/Admins/AdminCorrectionPanel';
import LeaveManagementSection from './Components/Admins/LeaveManagementSection';
import TaskOverviewSection from './Components/Admins/AdminTaskOverview';
import AnalyticsSection from './Components/Admins/AnalyticsSection';
import AdminAttendanceSummary from './Components/Admins/AdminAttendanceSummary';

function App() {
  const location = useLocation();
  // Direct read from localStorage to avoid stale state issues during navigation
  const token = localStorage.getItem('token');
  const user = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    document.title = "ISAR EMS";
    AOS.init({ duration: 1000 });
  }, []);

  // Ensure scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Routes>
      {/* Public / Auth routes (no sidebar) */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected area wrapped with AppLayout (sidebar + main content) */}
      <Route element={<AppLayout userRole={user?.role} />}>
        {/* Employee Protected Routes */}
        <Route
          path="/employee-dashboard/*"
          element={
            token && user?.role === 'employee'
              ? <EmployeeDashboardLayout />
              : <Navigate to="/" replace />
          }
        >
          <Route index element={<EmployeeHome />} />
          <Route path="profile" element={<ProfileSection />} />
          <Route path="leave" element={<LeaveSection />} />
          <Route path="tasks" element={<TaskSection />} />
          <Route path="correction" element={<EmployeeCorrectionRequest />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route
          path="/admin-dashboard/*"
          element={
            token && user?.role === 'admin'
              ? <AdminDashboardLayout />
              : <Navigate to="/" replace />
          }
        >
          <Route index element={<AdminHome />} />

          <Route path="employeeprofileviewer" element={<EmployeeProfileViewer />} />
          <Route path="employee-details/:employeeId" element={<EmployeeDetailsView />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="adminsettings" element={<AdminSettings />} />
          <Route path="punchioncorrection" element={<AdminCorrectionPanel />} />
          <Route path="leavemanagement" element={<LeaveManagementSection />} />
          <Route path="taskoverview" element={<TaskOverviewSection />} />
          <Route path="analytics" element={<AnalyticsSection />} />
          <Route path="attendancesummary" element={<AdminAttendanceSummary />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
