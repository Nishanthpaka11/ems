import { useEffect, useState, useCallback } from 'react';
import './adminhome.css';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

const AdminDashboard = () => {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showEmployees, setShowEmployees] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const adminName = user?.name || 'Admin';
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const fetchRecords = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/attendance/attendance-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      setRecords(data);
      setFiltered(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch attendance records.');
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
      setError('Failed to fetch employees.');
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
      result = result.filter((record) =>
        record.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        record.employee_id?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (selectedDate) {
      result = result.filter((record) => record.date === selectedDate);
    }
    setFiltered(result);
  }, [search, selectedDate, records]);

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

  const handleDeleteEmployee = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setError('Failed to delete employee.');
    }
  };

  const toggleEmployees = () => {
    if (!showEmployees) fetchEmployees();
    setShowEmployees(!showEmployees);
  };

  const updateLeaveQuota = async (id, quota) => {
    try {
      const res = await authFetch(`${API_BASE}/api/employees/${id}/leave-quota`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ leave_quota: quota })
      });
      if (!res.ok) throw new Error();
      alert('Leave quota updated');
    } catch (err) {
      console.error('Failed to update leave quota:', err);
      alert('Failed to update leave quota');
    }
  };

  const handleViewPhoto = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/attendance/photo/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error opening photo:', err);
      alert('Unable to view photo');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {adminName} 👋</h2>
      </div>

      <div className="admin-stats">
        <div className="stat-card"><h4>Total Employees</h4><p>{totalEmployees}</p></div>
        <div className="stat-card"><h4>Today's Punch-ins</h4><p>{todayPunchIns}</p></div>
        <div className="stat-card"><h4>Today's Punch-outs</h4><p>{todayPunchOuts}</p></div>
      </div>

      <div className="filter-bar">
        <input type="text" placeholder="Search by name or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button onClick={handleExportCSV}>Export CSV</button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <h3>Employees</h3>
      <button onClick={toggleEmployees} className="toggle-btn">
        {showEmployees ? 'Hide Employees' : 'Show Employees'}
      </button>

      {showEmployees && (
        <>
          {/* Removed Add Employee form */}

          <ul className="employee-list">
            {employees.map(emp => (
              <li key={emp._id}>
                <strong>{emp.name}</strong> ({emp.email})<br />
                Position: {emp.position || 'N/A'} | Role: {emp.role || 'N/A'}<br />
                Leave Quota:
                <input
                  type="number"
                  value={emp.leave_quota || 0}
                  onChange={(e) => {
                    const updatedQuota = parseInt(e.target.value, 10);
                    setEmployees(prev =>
                      prev.map(u =>
                        u._id === emp._id ? { ...u, leave_quota: updatedQuota } : u
                      )
                    );
                  }}
                  style={{ width: '60px', margin: '0 10px' }}
                />
                <button onClick={() => updateLeaveQuota(emp._id, emp.leave_quota)}>Save</button>
                <button onClick={() => handleDeleteEmployee(emp._id)}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Attendance</h3>
      {filtered.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <div className="responsive-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name (Emp ID)</th>
                <th>IP</th>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Selfie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td data-label="Name">
                    {record.employee_name} <br />
                    <small>{record.employee_id}</small>
                  </td>
                  <td data-label="IP">{record.ip}</td>
                  <td data-label="Date">
                    {record.date ? new Date(record.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '-'}
                  </td>
                  <td data-label="Punch In">{record.punch_in_time ? new Date(record.punch_in_time).toLocaleTimeString() : '-'}</td>
                  <td data-label="Punch Out">{record.punch_out_time ? new Date(record.punch_out_time).toLocaleTimeString() : '-'}</td>
                  <td data-label="Selfie">
                    {record.photo_path ? (
                      <button onClick={() => handleViewPhoto(record.id)}>View</button>
                    ) : (
                      'No Image'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
