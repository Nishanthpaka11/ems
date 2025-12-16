// EmployeeHome.js
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaWifi, FaClock, FaUserCheck, FaFileDownload } from 'react-icons/fa';
import './employeehome.css';
import { useNavigate } from 'react-router-dom';
import { getLocalIP } from '../utils/getLocalIP';
import { authFetch } from '../utils/authFetch';

function EmployeeHome() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_BASE = process.env.REACT_APP_API_URL;

  const [status, setStatus] = useState({ punch_in: null, punch_out: null });
  const [clock, setClock] = useState(new Date());
  const [error, setError] = useState('');
  const [ip, setIp] = useState('');
  const [wifiAllowed, setWifiAllowed] = useState(false);
  const [workDuration, setWorkDuration] = useState('00h 00m 00s');
  const [attendanceByDate, setAttendanceByDate] = useState({}); // map of YYYY-MM-DD -> boolean

  useEffect(() => {
    if (!token || !user) navigate('/');
  }, [token, user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/attendance/status`);
      if (!res) return;
      const data = await res.json();
      setStatus(data);
      setError('');
    } catch (err) {
      console.error('Status fetch failed:', err);
      setError('Unable to fetch status. Please login again.');
    }
  }, [API_BASE]);

  // Defensive normalization:
  // - if backend gives "YYYY-MM-DD" use it as-is
  // - otherwise try new Date(...) and convert to en-CA (local date)
  const normalizeToISODate = (raw) => {
    if (!raw) return null;
    // already YYYY-MM-DD?
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD (local)
  };

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/attendance/history`);
      if (!res) return;
      const data = await res.json();

      const mapped = {};
      data.forEach((item) => {
        // item.date could be '2025-12-11' or ISO '2025-12-11T04:00:00Z'
        const key = normalizeToISODate(item.date);
        if (!key) return;
        // consider item.punched_in truthy values
        mapped[key] = !!item.punched_in;
      });

      setAttendanceByDate(mapped);
    } catch (err) {
      console.error('Attendance history fetch failed:', err);
    }
  }, [API_BASE]);

  const verifyIPs = useCallback(async () => {
    if (!user) return;

    const normalizeIP = (ip = '') =>
      ip.replace(/\s+/g, '').replace('::ffff:', '').replace('::1', '127.0.0.1');

    try {
      const ipRes = await authFetch(`${API_BASE}/api/ip/client-ip`);
      const ipData = await ipRes.json();
      const rawIPs = (ipData.ip || '').split(',');
      const primaryIP = normalizeIP(rawIPs[0]);
      setIp(rawIPs.map(normalizeIP).join(','));

      const wifiRes = await authFetch(`${API_BASE}/api/ip/wifi-ips`);
      const wifiData = await wifiRes.json();
      setWifiAllowed(wifiData.map(normalizeIP).includes(primaryIP));
    } catch (err) {
      console.error('IP verification failed:', err);
      setIp('Error fetching IP');
      setWifiAllowed(false);
    }
  }, [API_BASE, user]);

useEffect(() => {
  fetchStatus();
  verifyIPs();

  const interval = setInterval(fetchStatus, 15000); // less aggressive
  return () => clearInterval(interval);
}, [fetchStatus, verifyIPs]);

useEffect(() => {
  fetchAttendanceHistory(); // run once only
}, [fetchAttendanceHistory]);


  useEffect(() => {
    let interval = null;
    if (status.punch_in && !status.punch_out) {
      interval = setInterval(() => {
        const start = new Date(status.punch_in);
        const now = new Date();
        const diff = now - start;
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
        const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
        setWorkDuration(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);
    } else {
      setWorkDuration('00h 00m 00s');
    }
    return () => clearInterval(interval);
  }, [status.punch_in, status.punch_out]);

  // FORCE TODAY AS PRESENT WHEN PUNCHED IN (local date wise)
  useEffect(() => {
    if (!status.punch_in) return;
    const key = normalizeToISODate(status.punch_in);
    if (!key) return;
    setAttendanceByDate((prev) => ({
      ...prev,
      [key]: true,
    }));
  }, [status.punch_in]);

  const calculateWorkingHours = () => {
    if (status.punch_in && status.punch_out) {
      const diff = new Date(status.punch_out) - new Date(status.punch_in);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      return `${hours}h ${minutes}m`;
    }
    return 'N/A';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // TIME WINDOW HELPERS (kept same as you had)
  const isPunchInTimeAllowed = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    // allowed until 10:45 AM (inclusive)

    return hour < 12 || (hour === 12 && minute <= 45);
    
  };

  const isPunchOutTimeAllowed = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    // allowed from 1:00 PM onwards
    return hour > 13 || (hour === 13 && minute >= 0);
  };

  // derived booleans for button disabled state (uses live clock)
  const nowHour = clock.getHours();
  const nowMinute = clock.getMinutes();
  const canPunchInNow = nowHour < 12 || (nowHour === 12 && nowMinute <= 45);
  const canPunchOutNow = nowHour > 13 || (nowHour === 13 && nowMinute >= 0);

  const handlePunchIn = async () => {
    if (!isPunchInTimeAllowed()) {
      alert('❌ Punch In is only allowed before 9:45 AM.');
      return;
    }

    if (!wifiAllowed) {
      alert("❌ You're not on allowed WiFi.");
      return;
    }

    try {
      const localIP = await getLocalIP();
      const formData = new FormData();
      formData.append('localIP', localIP);

      const res = await authFetch(`${API_BASE}/api/attendance/punch`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      alert(`✅ ${data.message}`);
      fetchStatus();
      fetchAttendanceHistory();
    } catch (err) {
      console.error('Punch In error:', err);
      alert('❌ Punch In failed');
    }
  };

  const handlePunchOut = async () => {
    if (!isPunchOutTimeAllowed()) {
      alert('❌ Punch Out is only allowed after 1:00 PM.');
      return;
    }

    if (!wifiAllowed) {
      alert("❌ You're not on allowed WiFi.");
      return;
    }

    const punchInTime = new Date(status.punch_in);
    const now = new Date();
    const timeDiff = (now - punchInTime) / (1000 * 60 * 60);

    if (timeDiff < 1) {
      alert('Punch Out Available after 1PM.');
      return;
    }

    try {
      const localIP = await getLocalIP();
      const formData = new FormData();
      formData.append('localIP', localIP);

      const res = await authFetch(`${API_BASE}/api/attendance/punch`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      alert(`✅ ${data.message}`);
      fetchStatus();
      fetchAttendanceHistory();
    } catch (err) {
      console.error('Punch Out error:', err);
      alert('❌ Punch Out failed');
    }
  };

  const handleDownloadAttendance = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/attendance/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance.csv');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDownloadLeaves = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/leave/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leaves.csv');
      link.click();
    } catch (err) {
      console.error('Leave download error:', err);
    }
  };

  // Build calendar for the current month
  const getCurrentMonthCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      // isoKey should be local YYYY-MM-DD (no timezone conversions)
      const isoKey = date.toLocaleDateString('en-CA');
      const punchedIn = !!attendanceByDate[isoKey];
      days.push({ date, isoKey, punchedIn });
    }

    const startWeekday = firstDay.getDay(); // 0 = Sunday

    return { year, month, days, startWeekday };
  };

  return (
    <motion.div
      className="employee-dashboard"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <motion.div
        className="container py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <p className="live-clock">🕒 {clock.toLocaleTimeString()}</p>

        {/* Info Cards */}
        <motion.div
          className="row g-4 mb-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.1, duration: 0.4 },
            },
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="col-md-4"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {i === 0 && (
                <div className="info-card gradient-blue text-white">
                  <FaUserCheck className="icon-lg" />
                  <h5>Status</h5>
                  <p>
                    {status.punch_in && !status.punch_out
                      ? '🟢 Working'
                      : status.punch_out
                      ? '✅ Completed'
                      : '🔴 Not Started'}
                  </p>
                </div>
              )}
              {i === 1 && (
                <div className="info-card gradient-green text-white">
                  <FaClock className="icon-lg" />
                  <h5>Work Duration</h5>
                  <p>
                    {status.punch_in && !status.punch_out
                      ? workDuration
                      : calculateWorkingHours()}
                  </p>
                </div>
              )}
              {i === 2 && (
                <div
                  className={`info-card text-white ${
                    wifiAllowed ? 'wifi-allowed' : 'wifi-restricted'
                  }`}
                >
                  <FaWifi className="icon-lg" />
                  <h5>WiFi</h5>
                  <p>{wifiAllowed ? '✅ Allowed' : '❌ Restricted'}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="dashboard-card shadow-lg p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <p>
            <strong>Your IP(s):</strong> {ip || 'Fetching...'}
          </p>

          <div className="punch-status mt-3">
            <h4 className="fw-bold text-secondary">Attendance Status (Today)</h4>
            {!status.punch_in && <p>❌ Not yet punched in</p>}
            {status.punch_in && !status.punch_out && (
              <p>✅ Punched In at {formatTime(status.punch_in)}</p>
            )}
            {status.punch_in && status.punch_out && (
              <p>
                ✅ Punched In at {formatTime(status.punch_in)}, Out at{' '}
                {formatTime(status.punch_out)}
              </p>
            )}
          </div>

          {status.punch_in && !status.punch_out && (
            <p className="mt-2">
              <strong>Live Timer:</strong> {workDuration}
            </p>
          )}

          {status.punch_in && status.punch_out && (
            <p className="mt-2">
              <strong>Total Duration:</strong> {calculateWorkingHours()}
            </p>
          )}

          <div className="btn">
            <button
              className="btn btn-success flex-fill punch-btns"
              onClick={handlePunchIn}
              disabled={!!status.punch_in || !canPunchInNow}
            >
              Punch In
            </button>
            <button
              className="btn flex-fill punch-btn"
              onClick={handlePunchOut}
              disabled={!status.punch_in || !!status.punch_out || !canPunchOutNow}
            >
              Punch Out
            </button>
          </div>

          <div className="mt-4">
            <h5 className="fw-bold mb-2 text-secondary">
              <FaFileDownload className="me-2" /> Download Reports
            </h5>
            <button
              className="btn btn-outline-primary me-3"
              onClick={handleDownloadAttendance}
            >
              Attendance CSV
            </button>
            <button
              className="btn btn-outline-success"
              onClick={handleDownloadLeaves}
            >
              Leave CSV
            </button>
          </div>

          {/* Attendance Calendar */}
          <div className="attendance-calendar mt-4">
            {(() => {
              const { year, month, days, startWeekday } = getCurrentMonthCalendar();
              const monthName = new Date(year, month).toLocaleString('default', {
                month: 'long',
              });

              const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

              return (
                <>
                  <h5 className="fw-bold mb-3 text-secondary">
                    Attendance Calendar – {monthName} {year}
                  </h5>

                  <div className="calendar-header mb-2">
                    {weekDays.map((d) => (
                      <div key={d} className="calendar-cell calendar-header-cell">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="calendar-grid">
                    {Array.from({ length: startWeekday }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="calendar-cell empty-cell" />
                    ))}

                    {days.map(({ date, isoKey, punchedIn }) => {
                      // Use YYYY-MM-DD string compare to avoid timezone issues
                      const todayKey = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD"

                      let dayStatusClass = '';

                      if (isoKey > todayKey) {
                        dayStatusClass = 'day-future';
                      } else if (punchedIn) {
                        dayStatusClass = 'day-present';
                      } else {
                        dayStatusClass = 'day-absent';
                      }

                      return (
                        <div
                          key={isoKey}
                          className={`calendar-cell day-cell ${dayStatusClass}`}
                        >
                          <span className="day-number">{date.getDate()}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="calendar-legend mt-2">
                    <span className="legend-box day-present" /> Punched In
                    <span className="legend-box day-absent ms-3" /> Not Punched In
                  </div>
                </>
              );
            })()}
          </div>

          {error && <p className="text-danger mt-3">{error}</p>}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default EmployeeHome;