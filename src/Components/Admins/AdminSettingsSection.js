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
    }, 2000); // auto-hide after 2s
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
            ? data.allowed_ips.join(',')
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedIps = allowedIps
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);

      const res = await authFetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          allowed_ips: formattedIps,
          working_hours_start: startTime,
          working_hours_end: endTime
        })
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
                Allowed Wi-Fi IPs
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
