// src/Components/admin/AdminSettingsSection.js
import React, { useEffect, useState } from 'react';
import './AdminSettingsSection.css';
import { authFetch } from '../utils/authFetch';

const AdminSettingsSection = () => {
  const [allowedIps, setAllowedIps] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // popup state
  const [popup, setPopup] = useState({ show: false, message: '', type: '' });

  const token = localStorage.getItem('token');
  const API_BASE = process.env.REACT_APP_API_URL;

  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type });

    setTimeout(() => {
      setPopup({ show: false, message: '', type: '' });
    }, 3000); // Increased to 3s to read error messages
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/admin/settings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();

        setAllowedIps(
          Array.isArray(data.allowed_ips)
            ? data.allowed_ips.join(', ')
            : data.allowed_ips || ''
        );

        setStartTime(data.working_hours_start || '');
        setEndTime(data.working_hours_end || '');
      } catch (err) {
        console.error('Error fetching admin settings:', err);
      }
    };

    fetchSettings();
  }, [API_BASE, token]);

  // --- VALIDATION LOGIC ---
  const isValidIPv4 = (ip) => {
    // Regex for strict IPv4 validation (0-255 range checks)
    const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
  };

const parseTimeToMinutes = (timeStr) => {
  // Handles both "HH:MM" and "HH:MM AM/PM"
  const date = new Date(`1970-01-01 ${timeStr}`);
  if (isNaN(date.getTime())) return NaN;

  return date.getHours() * 60 + date.getMinutes();
};

const isValidWorkingTimeRange = (start, end) => {
  if (!start || !end) return true;

  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (isNaN(startMinutes) || isNaN(endMinutes)) return false;

  const endOfDay = 23 * 60 + 59;

  // ❌ Punch-out must be AFTER punch-in
  if (endMinutes <= startMinutes) return false;

  // ❌ Must be at least 1 hour difference
  if (endMinutes - startMinutes < 60) return false;

  // ❌ Must be same day (before 11:59 PM)
  if (endMinutes > endOfDay) return false;

  return true;
};



  const handleSubmit = async (e) => {
  e.preventDefault();

  // 1. Process IPs
  const formattedIps = allowedIps
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  // 2. Empty check
  if (formattedIps.length === 0) {
    showPopup('❌ Allowed IPs cannot be empty.', 'error');
    return;
  }

  // 3. Invalid IP check
  const invalidIps = formattedIps.filter(ip => !isValidIPv4(ip));
  if (invalidIps.length > 0) {
    showPopup(`❌ Invalid IP format detected: ${invalidIps.join(', ')}`, 'error');
    return;
  }

  // 4️⃣ ⏱ TIME VALIDATION (FIX)
 if (!isValidWorkingTimeRange(startTime, endTime)) {
  showPopup(
    '❌ Punch-out time must be at least 1 hour after punch-in and within the same day (up to 11:59 PM).',
    'error'
  );
  return;
}

  // 5. API CALL (only if all validations pass)
  try {
    const res = await authFetch(`${API_BASE}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        allowed_ips: formattedIps,
        working_hours_start: startTime,
        working_hours_end: endTime,
      }),
    });

    if (!res.ok) throw new Error('Failed to update settings');

    showPopup('✅ Settings updated successfully', 'success');
  } catch (err) {
    console.error('Error updating settings:', err);
    showPopup('❌ Failed to update settings', 'error');
  }
};


  return (
    <div className="admin-settings-shell">
      {/* Center popup message */}
      {popup.show && (
        <div className={`popup-message ${popup.type}`}>
          {popup.message}
        </div>
      )}

      <div className="admin-settings-header">
        <div>
          <h3 className="admin-settings-title">
            <span className="settings-icon-circle">
              <i className="bi bi-gear-fill" />
            </span>
            Admin Settings
          </h3>
          <p className="admin-settings-subtitle">
            Configure allowed Wi-Fi IPs and office working hours. These settings
            control when and from where employees can punch in.
          </p>
        </div>
      </div>

      <div className="admin-settings-card">
        <form onSubmit={handleSubmit} className="settings-form">
          {/* Allowed IPs */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h4>Network / Wi-Fi</h4>
              <p>Only these IPs will be allowed to punch in and out.</p>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="allowedIps">
                Allowed Wi-Fi IPs <span style={{color: 'red'}}>*</span>
                <span className="settings-label-pill">comma separated</span>
              </label>
              <textarea
                id="allowedIps"
                className="settings-input settings-textarea"
                value={allowedIps}
                onChange={(e) => setAllowedIps(e.target.value)}
                placeholder="e.g. 192.168.1.10, 192.168.0.105"
                rows={3}
              />
            </div>
          </div>

          {/* Working hours */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h4>Working Hours</h4>
              <p>Define when attendance is considered within working hours.</p>
            </div>

            <div className="settings-grid">
              <div className="settings-field">
                <label className="settings-label" htmlFor="startTime">
                  Working start time
                </label>
                <input
                  id="startTime"
                  type="time"
                  className="settings-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="endTime">
                  Working end time
                </label>
                <input
                  id="endTime"
                  type="time"
                  className="settings-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <p className="settings-help">
              Times are interpreted in the server&apos;s configured timezone.
            </p>
          </div>

          {/* Actions */}
          <div className="settings-actions">
            <button
              type="button"

              
              className="settings-btn settings-btn-ghost"
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-counterclockwise" />
              Reset
            </button>

            <button type="submit" className="settings-btn settings-btn-primary">
              <i className="bi bi-save" />
              Update settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsSection;