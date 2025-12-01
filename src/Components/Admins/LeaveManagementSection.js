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

  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/leaves/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch leaves');
      const data = await res.json();
      setLeaves(data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
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
      (!filter || leave.name.toLowerCase().includes(filter.toLowerCase())) &&
      (!statusFilter || leave.status.toLowerCase() === statusFilter.toLowerCase())
    );
  });

  // Stats for cards
  const approved = leaves.filter(l => l.status && l.status.trim().toLowerCase() === 'approved').length;
const pending = leaves.filter(l => l.status && l.status.trim().toLowerCase() === 'pending').length;
const rejected = leaves.filter(l => l.status && l.status.trim().toLowerCase() === 'rejected').length;


  // Monthly Leave Chart Data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep','Oct','Nov','Dec'];
  const leavesByMonth = Array(12).fill(0);
  leaves.forEach(l => {
    if (l.start_date) {
      const mIdx = new Date(l.start_date).getMonth();
      leavesByMonth[mIdx]++;
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
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 2 } }
    }
  };

  const activity = [
    ...leaves
      .filter(l => l.status === 'Approved')
      .slice(-2)
      .map(l => ({
        icon: 'bi-check-circle-fill',
        text: `${l.name}'s leave approved`,
        sub: `${l.name} was granted ${l.type} Leave`,
      })),
    ...leaves
      .filter(l => l.status === 'Pending')
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
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="leave-dashboard">
      <h2 className="dashboard-title">Admin Dashboard</h2>
      {/* Cards */}
      <div className="dashboard-cards">
        <div className="stat-card approved">
          <i className="bi bi-check2-circle"></i>
          <div>
            <div className="stat-title">Approved Leaves</div>
            <div className="stat-count">{approved}</div>
          </div>
        </div>
        <div className="stat-card pending">
          <i className="bi bi-clock"></i>
          <div>
            <div className="stat-title">Pending Leaves</div>
            <div className="stat-count">{pending}</div>
          </div>
        </div>
        <div className="stat-card rejected">
          <i className="bi bi-x-circle"></i>
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
            <div className="chart-title">Monthly Leave Trend</div>
            <Bar data={chartData} options={chartOptions} height={220} />
          </div>
        </div>
        <div className="dashboard-side">
          <div className="activity-card">
            <div className="activity-title">Recent Activity</div>
            <ul className="activity-list">
              {activity.length === 0 ? <li>No activity yet</li> : activity.map((a, i) => (
                <li key={i}>
                  <i className={`bi ${a.icon}`}></i>
                  <div>
                    <b>{a.text}</b>
                    <span>{a.sub}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="leave-requests-card">
        <div className="leave-requests-header">
          <h3>Leave Requests</h3>
          <div className="leave-requests-actions">
            {/* Filter Inputs */}
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
        {filteredLeaves.length === 0 ? (
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
                    <td>{leave.name}</td>
                    <td>{leave.type}</td>
                    <td>{formatDate(leave.start_date)}</td>
                    <td>{formatDate(leave.end_date)}</td>
                    <td>
                      <span className={`status-badge ${leave.status.toLowerCase()}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.status.toLowerCase() === 'pending' ? (
                        <>
                          <button className="approve" onClick={() => handleApprove(leave.id)}>Approve</button>
                          <button className="reject" onClick={() => handleReject(leave.id)}>Reject</button>
                        </>
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
      </div>
    </div>
  );
}

export default LeaveManagementSection;
