import React, { useEffect, useState, useCallback } from 'react';
import './LeaveManagementSection.css';
import { authFetch } from '../utils/authFetch';
import { Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function LeaveManagementSection() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authFetch(`${API_BASE}/api/leaves/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch leaves');
      const data = await res.json();
      setLeaves(data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, token]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleApprove = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/leaves/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Approve failed');
      fetchLeaves();
    } catch (err) { console.error('Approve failed', err); }
  };

  const handleReject = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/leaves/${id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Reject failed');
      fetchLeaves();
    } catch (err) { console.error('Reject failed', err); }
  };

  const filteredLeaves = leaves.filter((leave) => {
    return (
      (!filter || leave.name?.toLowerCase().includes(filter.toLowerCase())) &&
      (!statusFilter || leave.status?.toLowerCase() === statusFilter.toLowerCase())
    );
  });

  // Stats for cards
  const normalizeStatus = (s) => (s || '').trim().toLowerCase();
  const approved = leaves.filter(l => normalizeStatus(l.status) === 'approved').length;
  const pending = leaves.filter(l => normalizeStatus(l.status) === 'pending').length;
  const rejected = leaves.filter(l => normalizeStatus(l.status) === 'rejected').length;

  // Monthly Leave Chart Data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep','Oct','Nov','Dec'];
  const leavesByMonth = Array(12).fill(0);

  leaves.forEach(l => {
    if (l.start_date) {
      const mIdx = new Date(l.start_date).getMonth();
      if (!Number.isNaN(mIdx)) {
        leavesByMonth[mIdx]++;
      }
    }
  });

  const chartData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Leave Requests',
        backgroundColor: '#3b82f6',
        data: leavesByMonth,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    layout: {
      padding: { top: 8, right: 8, left: 0, bottom: 0 }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 2 } }
    }
  };

  const activity = [
    ...leaves
      .filter(l => normalizeStatus(l.status) === 'approved')
      .slice(-2)
      .map(l => ({
        icon: 'bi-check-circle-fill',
        text: `${l.name}'s leave approved`,
        sub: `${l.name} was granted ${l.type} Leave`,
      })),
    ...leaves
      .filter(l => normalizeStatus(l.status) === 'pending')
      .slice(-1)
      .map(l => ({
        icon: 'bi-clock-fill',
        text: `${l.name}'s leave requested`,
        sub: `${l.name} applied for ${l.type} Leave`
      })),
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="leave-dashboard">
      <header className="dashboard-header">
        <div>
          <h2 className="dashboard-title"> Admin Leave Dashboard </h2>
          <p className="dashboard-subtitle">Monitor requests, approve quickly, and keep track of team leave trends.</p>
        </div>
      </header>

      {/* Cards */}
      <div className="dashboard-cards">
        <div className="stat-card approved">
          <div className="stat-icon-wrapper">
            <i className="bi bi-check2-circle"></i>
          </div>
          <div>
            <div className="stat-title">Approved Leaves</div>
            <div className="stat-count">{approved}</div>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon-wrapper">
            <i className="bi bi-clock"></i>
          </div>
          <div>
            <div className="stat-title">Pending Leaves</div>
            <div className="stat-count">{pending}</div>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-icon-wrapper">
            <i className="bi bi-x-circle"></i>
          </div>
          <div>
            <div className="stat-title">Rejected Leaves</div>
            <div className="stat-count">{rejected}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-main">
          {/* Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Monthly Leave Trend</div>
                <p className="chart-subtitle">Overview of leave requests across the year.</p>
              </div>
            </div>
            <div className="chart-wrapper">
              {leaves.length === 0 ? (
                <div className="chart-empty">No leave data available yet.</div>
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-side">
          <div className="activity-card">
            <div className="activity-title">Recent Activity</div>
            <ul className="activity-list">
              {activity.length === 0 ? (
                <li className="activity-empty">No recent actions yet.</li>
              ) : (
                activity.map((a, i) => (
                  <li key={i}>
                    <i className={`bi ${a.icon}`}></i>
                    <div>
                      <b>{a.text}</b>
                      <span>{a.sub}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>

      <section className="leave-requests-card">
        <div className="leave-requests-header">
          <div>
            <h3>Leave Requests</h3>
            <p className="leave-requests-subtitle">
              Filter, review, and act on employee leave requests.
            </p>
          </div>
          <div className="leave-requests-actions">
            <input
              type="text"
              placeholder="Search by name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="mute-text">Loading leave requests…</p>
        ) : filteredLeaves.length === 0 ? (
          <p className="mute-text">No leave requests found.</p>
        ) : (
          <div className="responsive-leave-table">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td data-label="Employee">{leave.name}</td>
                    <td data-label="Leave Type">{leave.type}</td>
                    <td data-label="From">{formatDate(leave.start_date)}</td>
                    <td data-label="To">{formatDate(leave.end_date)}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${normalizeStatus(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td data-label="Actions">
                      {normalizeStatus(leave.status) === 'pending' ? (
                        <div className="actions-wrap">
                          <button
                            className="approve"
                            onClick={() => handleApprove(leave.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="reject"
                            onClick={() => handleReject(leave.id)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="mute-text">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default LeaveManagementSection;
