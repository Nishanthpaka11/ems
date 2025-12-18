// AdminDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import './adminhome.css';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
// keep: import 'bootstrap-icons/font/bootstrap-icons.css' in src/index.js
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
  // ========== Data state (UNCHANGED) ==========
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const adminName = user?.name || 'Admin';
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  // ========== Network (UNCHANGED) ==========
  const fetchRecords = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/attendance/attendance-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      setRecords(data);
      setFiltered(data);
      // setError removed
    } catch (err) {
      console.error(err);
      // setError removed
    }
  }, [token, API_BASE]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      // setError removed
    }
  }, [token, API_BASE]);

  useEffect(() => {
    if (!token) navigate('/login');
    else {
      fetchRecords();
      fetchEmployees();
    }
  }, [token, navigate, fetchRecords, fetchEmployees]);

  useEffect(() => {
    let result = records;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((record) =>
        record.employee_name?.toLowerCase().includes(q) ||
        record.employee_id?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, records]);

  // ========== Metrics (UNCHANGED) ==========
  const today = new Date().toISOString().split('T')[0];
  const totalEmployees = employees.length;

  const todayPunchIns = records.filter(r => {
    if (!r.punch_in_time) return false;
    const punchDate = new Date(r.punch_in_time).toISOString().split('T')[0];
    return punchDate === today;
  }).length;

  const todayPunchOuts = records.filter(r => {
    if (!r.punch_out_time) return false;
    const punchOutDate = new Date(r.punch_out_time).toISOString().split('T')[0];
    return punchOutDate === today;
  }).length;

  // ========== Pie chart data (NEW) ==========
  // Present = employees who have punched in today
  // Not Punched = totalEmployees - Present (never negative)
  const pieData = useMemo(() => {
    const present = todayPunchIns;
    const notPunched = Math.max(totalEmployees - present, 0);

    return [
      { name: 'Present (Punched In)', value: present },
      { name: 'Not Punched In', value: notPunched },
    ];
  }, [todayPunchIns, totalEmployees]);

  const PIE_COLORS = ['#22c55e', '#ef4444'];

  // ========== Actions (UNCHANGED) ==========
  const handleExportCSV = () => {
    const csvRows = [
      ['Emp ID', 'Name', 'IP', 'Date', 'Punch In', 'Punch Out'],
      ...filtered.map((r) => [
        r.employee_id,
        r.employee_name,
        r.ip,
        r.date,
        r.punch_in_time ? new Date(r.punch_in_time).toLocaleTimeString() : '',
        r.punch_out_time ? new Date(r.punch_out_time).toLocaleTimeString() : ''
      ])
    ];
    const blob = new Blob([csvRows.map((e) => e.join(',')).join('\n')], {
      type: 'text/csv'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'attendance_records.csv';
    a.click();
  };



  // ========== Simple derived helpers ==========
  const recordsCount = filtered.length;
  const earliestRow = useMemo(() => (filtered[0] ? filtered[0].date : ''), [filtered]);

  // ========== Render (minimal, clear) ==========
  return (
    <div className="clean-shell">
      {/* TOPBAR */}
      <header className="clean-topbar">
        <div className="brand">
          <div className="brand-name">Admin</div>
          <div className="brand-sub">Welcome, {adminName}</div>
        </div>

        
      </header>

      {/* STATS */}
      <section className="clean-stats">
        <div className="stat">
          <div className="stat-title">Total employees</div>
          <div className="stat-value">{totalEmployees}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Today's punch-ins</div>
          <div className="stat-value">{todayPunchIns}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Today's punch-outs</div>
          <div className="stat-value">{todayPunchOuts}</div>
        </div>
      </section>

      {/* ATTENDANCE PIE CHART (NEW) */}
      <section className="clean-panel attendance-chart-panel">
        <div className="panel-head">
          <h3>Attendance Overview (Today)</h3>
          <div className="panel-meta">
            Present vs Not Punched In • {today}
          </div>
        </div>

        <div className="attendance-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="attendance-chart-legend">
          <span className="legend-dot legend-present" /> Present ({pieData[0]?.value || 0})
          <span className="legend-dot legend-absent" /> Not Punched In ({pieData[1]?.value || 0})
        </div>
      </section>

     <div className="top-actions">
          <div className="search">
            <span className="icon">🔎</span>

            <input
              aria-label="Search by name or ID"
              placeholder="Search name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="clean-btn" onClick={handleExportCSV}>
            <i className="bi bi-download" /> Export
          </button>
        </div>

    
      {/* ATTENDANCE TABLE */}
      <section className="clean-panel">
        <div className="panel-head">
          <h3>Attendance</h3>
          <div className="panel-meta">{recordsCount} records</div>
        </div>

        {filtered.length === 0 ? (
          <div className="muted">No records found.</div>
        ) : (
          <div className="table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>IP</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className="name">{record.employee_name}</div>
                      <div className="muted tiny">{record.employee_id}</div>
                    </td>
                    <td className="mono">{record.ip}</td>
                    <td>
                      {record.date
                        ? new Date(record.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                        : '-'}
                    </td>
                    <td>
                      {record.punch_in_time
                        ? new Date(record.punch_in_time).toLocaleTimeString()
                        : '-'}
                    </td>
                    <td>
                      {record.punch_out_time
                        ? new Date(record.punch_out_time).toLocaleTimeString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="clean-footer">
        <div className="muted tiny">
          Built for clarity • {earliestRow ? `First record: ${earliestRow}` : ''}
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
