// src/Components/EmployeeCorrectionRequest.js
import React, { useState } from 'react';
import './EmployeeCorrectionRequest.css';
import { authFetch } from '../utils/authFetch';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

function EmployeeCorrectionRequest({ token }) {
  const [form, setForm] = useState({
    date: '',
    requested_punch_in: '',
    requested_punch_out: '',
    reason: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const convertToUTC = (date, time) => {
    return dayjs.tz(`${date}T${time}`, 'Asia/Kolkata').utc().toISOString();
  };

  const handleSubmit = async () => {
    setMessage('');

    if (!form.date || !form.reason) {
      setMessage('❌ Please fill date and reason.');
      return;
    }

    if (!form.requested_punch_in && !form.requested_punch_out) {
      setMessage('❌ Enter at least one time (Punch In or Punch Out).');
      return;
    }

    let requestedPunchIn = null;
    let requestedPunchOut = null;

    try {
      if (form.requested_punch_in) {
        requestedPunchIn = convertToUTC(form.date, form.requested_punch_in);
      }
      if (form.requested_punch_out) {
        requestedPunchOut = convertToUTC(form.date, form.requested_punch_out);
      }
    } catch (error) {
      setMessage('❌ Invalid date/time format.');
      return;
    }

    const payload = {
      correction_date: form.date,
      requested_punch_in: requestedPunchIn,
      requested_punch_out: requestedPunchOut,
      reason: form.reason,
      original_punch_in: null,
      original_punch_out: null
    };

    try {
      setLoading(true);
      const res = await authFetch(`${API_BASE}/api/corrections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Submission failed');

      setMessage('✅ Correction request submitted successfully!');
      setForm({
        date: '',
        requested_punch_in: '',
        requested_punch_out: '',
        reason: ''
      });
    } catch (err) {
      console.error('❌ Correction request error:', err);
      setMessage('❌ Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="correction-request pc-card">
      {/* Header */}
      <div className="pc-header">
        <div className="pc-icon" aria-hidden="true">🕒</div>
        <div>
          <h2 className="pc-title">Punch Correction Request</h2>
          <p className="pc-subtitle">
            Submit corrections for missed or incorrect punch records.
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="pc-field">
        <label htmlFor="pc-date" className="pc-label">Date of Correction</label>
        <input
          id="pc-date"
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="pc-input"
          required
        />
      </div>

      {/* Time grid */}
      <div className="pc-grid">
        <div className="pc-field">
          <label htmlFor="pc-in" className="pc-label">
            Correct Punch In Time <span className="pc-optional">(optional)</span>
          </label>
          <input
            id="pc-in"
            type="time"
            name="requested_punch_in"
            value={form.requested_punch_in}
            onChange={handleChange}
            className="pc-input"
          />
        </div>

        <div className="pc-field">
          <label htmlFor="pc-out" className="pc-label">
            Correct Punch Out Time <span className="pc-optional">(optional)</span>
          </label>
          <input
            id="pc-out"
            type="time"
            name="requested_punch_out"
            value={form.requested_punch_out}
            onChange={handleChange}
            className="pc-input"
          />
        </div>
      </div>

      {/* Reason */}
      <div className="pc-field">
        <label htmlFor="pc-reason" className="pc-label">Reason for Correction</label>
        <textarea
          id="pc-reason"
          name="reason"
          placeholder="Explain the correction..."
          value={form.reason}
          onChange={handleChange}
          className="pc-textarea"
          required
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="pc-actions">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="pc-btn-primary"
        >
          {loading ? 'Submitting...' : 'Submit Correction'}
        </button>
      </div>

      {/* Status message */}
      {message && <p className="status-message pc-status">{message}</p>}
    </div>
  );
}

export default EmployeeCorrectionRequest;