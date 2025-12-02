import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaWifi, FaClock, FaUserCheck, FaFileDownload, FaCamera } from 'react-icons/fa';
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
  const [photo, setPhoto] = useState(null);
  const [workDuration, setWorkDuration] = useState('00h 00m 00s');

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
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, verifyIPs]);

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

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) setPhoto(file);
  };

  const handlePunchIn = async () => {
    if (!wifiAllowed) {
      alert("❌ You're not on allowed WiFi.");
      return;
    }
    if (!photo) {
      alert('❌ Please upload a photo to Punch In.');
      return;
    }

    try {
      const localIP = await getLocalIP();
      const formData = new FormData();
      formData.append('photo', photo, 'punchin.jpg');
      formData.append('localIP', localIP);

      const res = await authFetch(`${API_BASE}/api/attendance/punch`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      alert(`✅ ${data.message}`);
      fetchStatus();
      setPhoto(null);
    } catch (err) {
      console.error('Punch In error:', err);
      alert('❌ Punch In failed');
    }
  };

  const handlePunchOut = async () => {
    if (!wifiAllowed) {
      alert("❌ You're not on allowed WiFi.");
      return;
    }

    const punchInTime = new Date(status.punch_in);
    const now = new Date();
    const timeDiff = (now - punchInTime) / (1000 * 60 * 60);

    if (timeDiff < 1) {
      alert('❌ Minimum 1 hour must pass before Punch Out.');
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

  return (
    <motion.div
      className="employee-dashboard"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* header removed so content sits under the left sidebar */}

      <motion.div
        className="container py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
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
          {/* (everything inside unchanged) */}
          <p>
            <strong>Your IP(s):</strong> {ip || 'Fetching...'}
          </p>

          {!status.punch_in && (
            <div className="photo-section">
              <label className="form-label fw-bold text-secondary">
                <FaCamera className="me-2" />
                Upload Photo for Punch In
              </label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              {photo && <p className="text-success mt-2">✅ Photo selected</p>}
            </div>
          )}

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
              disabled={!!status.punch_in}
            >
              Punch In
            </button>
            <button
              className="btn flex-fill punch-btn"
              onClick={handlePunchOut}
              disabled={!status.punch_in || !!status.punch_out}
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

          {error && <p className="text-danger mt-3">{error}</p>}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default EmployeeHome;
