import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './LeaveSection.css';
import { authFetch } from '../utils/authFetch';

const useDidMount = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
};

const StatusPill = ({ status }) => {
  const s = (status || '').toLowerCase();
  return <span key={s} className={`status-pill ${s} animate-pulse-once`}>{status}</span>;
};

const StatCard = ({ value, label, tone = 'primary', index = 0 }) => (
  <div
    className={`stat-card tone-${tone} animate-fade-up`}
    style={{ animationDelay: `${index * 90}ms` }}
  >
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const LeaveSection = () => {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const mounted = useDidMount();

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsDesktop(window.innerWidth >= 768);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch leaves');
      const data = await res.json();
      setLeaves(data);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    }
  }, [API_BASE, token]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/api/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Leave apply failed');
      }
      setForm({ start_date: '', end_date: '', reason: '' });
      setMessage('✅ Leave applied successfully');
      setError('');
      fetchLeaves();
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/leaves/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Cancel failed');
      }
      setMessage('✅ Leave cancelled successfully');
      setError('');
      fetchLeaves();
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const leaveMonth = new Date(leave.start_date).toISOString().slice(0, 7);
      const matchMonth = !filterMonth || leaveMonth === filterMonth;
      const matchStatus = !filterStatus || (leave.status || '').toLowerCase() === filterStatus.toLowerCase();
      return matchMonth && matchStatus;
    });
  }, [leaves, filterMonth, filterStatus]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const leavesThisMonth = useMemo(
    () =>
      leaves.filter(
        (l) =>
          ['approved', 'pending'].includes((l.status || '').toLowerCase()) &&
          new Date(l.start_date).toISOString().slice(0, 7) === currentMonth
      ).length,
    [leaves, currentMonth]
  );

  const total = leaves.length;
  const pending = leaves.filter(l => (l.status || '').toLowerCase() === 'pending').length;
  const approved = leaves.filter(l => (l.status || '').toLowerCase() === 'approved').length;
  const rejected = leaves.filter(l => (l.status || '').toLowerCase() === 'rejected').length;

  return (
    <div className={`leave-page ${mounted ? 'animate-page-in' : ''}`}>
      <div className="leave-page-inner">
        <header className="leave-topbar">
          <h2 className="page-title">Leaves</h2>
          <div className="search-actions">
            <div className="search">
              <span className="icon">🔎</span>
              
              <input placeholder="Search reason or status" />
            </div>
          </div>
        </header>

        <section className="stats-row-wrapper">
          <div className="stats-row">
            <StatCard value={total} label="Total Requests" tone="primary" index={0} />
            <StatCard value={approved} label="Approved" tone="success" index={1} />
            <StatCard value={pending} label="Pending" tone="warning" index={2} />
            <StatCard value={rejected} label="Rejected" tone="danger" index={3} />
          </div>
        </section>

        <section className="panel panel-apply animate-rise">
          <div className="panel-header panel-header-apply">
            <h3>Apply for Leave</h3>
            <div className="toolbar">
              <span className="muted">
                Leaves this month: <strong>{leavesThisMonth}</strong> / 2
              </span>
            </div>
          </div>

          <form onSubmit={handleApply} className="leave-form premium">
            <div className="grid-3">
              <div className="field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Reason</label>
                <input
                  type="text"
                  placeholder="Travelling to hometown"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn tap">Apply Leave</button>
            </div>
          </form>

          {(message || error) && (
            <div className="feedback-row animate-fade-in">
              {message && <div className="alert success">{message}</div>}
              {error && <div className="alert error">{error}</div>}
            </div>
          )}
        </section>

        <section className="panel panel-requests animate-rise" style={{ animationDelay: '80ms' }}>
          <div className="panel-header panel-header-requests">
            <h3>Leave Requests</h3>
            <div className="toolbar">
              <div className="filters compact">
                <label className="sr-only">Month</label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="control"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="control"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  type="button"
                  className="ghost-btn tap"
                  onClick={() => { setFilterMonth(''); setFilterStatus(''); }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {isDesktop ? (
            <div className="table-wrap">
              <table className="leave-table premium">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.length === 0 ? (
                    <tr className="animate-fade-in">
                      <td colSpan="6" className="empty">No leave records found.</td>
                    </tr>
                  ) : (
                    filteredLeaves.map((leave, i) => (
                      <tr key={leave._id} className="row-animate" style={{ animationDelay: `${i * 35}ms` }}>
                        <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                        <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                        <td className="muted">{leave.reason}</td>
                        <td><StatusPill status={leave.status} /></td>
                        <td>{new Date(leave.created_at).toLocaleDateString()}</td>
                        <td>
                          {(leave.status || '').toLowerCase() === 'pending' ? (
                            <button onClick={() => handleCancel(leave._id)} className="danger-btn tap">
                              Cancel
                            </button>
                          ) : (
                            <button className="ghost-btn" disabled>—</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="leave-cards">
              {filteredLeaves.length === 0 ? (
                <div className="empty-card animate-fade-in">No leave records found.</div>
              ) : (
                filteredLeaves.map((leave, i) => (
                  <div
                    key={leave._id}
                    className="leave-card animate-fade-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="card-row">
                      <span className="label">From</span>
                      <span>{new Date(leave.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="card-row">
                      <span className="label">To</span>
                      <span>{new Date(leave.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="card-row">
                      <span className="label">Reason</span>
                      <span className="muted">{leave.reason}</span>
                    </div>
                    <div className="card-row">
                      <span className="label">Status</span>
                      <StatusPill status={leave.status} />
                    </div>
                    <div className="card-row">
                      <span className="label">Applied</span>
                      <span>{new Date(leave.created_at).toLocaleDateString()}</span>
                    </div>
                    {(leave.status || '').toLowerCase() === 'pending' && (
                      <div className="card-actions">
                        <button
                          onClick={() => handleCancel(leave._id)}
                          className="danger-btn block tap"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LeaveSection;
