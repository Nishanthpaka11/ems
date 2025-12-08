// AdminDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import './adminhome.css';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
// keep: import 'bootstrap-icons/font/bootstrap-icons.css' in src/index.js

const AdminDashboard = () => {
  // ========== Data state (UNCHANGED) ==========
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

  // ========== PI Chat state (NEW) ==========
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(() => [
    {
      sender: 'pi',
      text: `Hi ${adminName.split(' ')[0] || 'Admin'} 👋, I’m your attendance assistant. Try asking things like “How many employees punched in today?” or “Show me attendance for ${new Date().toISOString().split('T')[0]}”.`,
      ts: new Date().toISOString()
    }
  ]);

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
      const q = search.toLowerCase();
      result = result.filter((record) =>
        record.employee_name?.toLowerCase().includes(q) ||
        record.employee_id?.toLowerCase().includes(q)
      );
    }
    if (selectedDate) {
      result = result.filter((record) => record.date === selectedDate);
    }
    setFiltered(result);
  }, [search, selectedDate, records]);

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

  // ========== Simple derived helpers ==========
  const recordsCount = filtered.length;
  const earliestRow = useMemo(() => (filtered[0] ? filtered[0].date : ''), [filtered]);

  // ========== PI Chat: simple attendance Q&A (NEW) ==========
  const buildPiAnswer = (q) => {
    const text = q.toLowerCase().trim();

    // date detection: yyyy-mm-dd in question
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    let targetDate = today;
    if (dateMatch) {
      targetDate = dateMatch[0];
    } else if (text.includes('yesterday')) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      targetDate = d.toISOString().split('T')[0];
    }

    const forDate = (dateStr) =>
      records.filter(r => {
        if (!r.date) return false;
        return r.date === dateStr;
      });

    const dayRecords = forDate(targetDate);
    const dayPunchIns = dayRecords.filter(r => r.punch_in_time).length;
    const dayPunchOuts = dayRecords.filter(r => r.punch_out_time).length;

    // some basic intents
    if (text.includes('present') || text.includes('punched in')) {
      return `On ${targetDate}, ${dayPunchIns} employee(s) have punched in.`;
    }

    if (text.includes('punch out') || text.includes('left')) {
      return `On ${targetDate}, ${dayPunchOuts} employee(s) have punched out.`;
    }

    if (text.includes('total employee') || text.includes('how many employee')) {
      return `You currently have ${totalEmployees} employee(s) in the system.`;
    }

    if (text.includes('summary') || text.includes('today') || text.includes('overview')) {
      return `Today (${today}) summary:\n• Total employees: ${totalEmployees}\n• Punch-ins: ${todayPunchIns}\n• Punch-outs: ${todayPunchOuts}\n• Filtered records in table: ${recordsCount}`;
    }

    if (text.includes('help') || text === '' || text.length < 4) {
      return `You can ask things like:
• "How many employees punched in today?"
• "Attendance summary for ${today}"
• "How many employees do we have?"
• "How many punched out yesterday?"`;
    }

    // Fallback generic answer
    return `Here’s what I know right now:\n• Total employees: ${totalEmployees}\n• Today's punch-ins: ${todayPunchIns}\n• Today's punch-outs: ${todayPunchOuts}\nYou can be more specific, e.g. "summary for ${today}" or "punch-outs yesterday".`;
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const questionMsg = {
      sender: 'admin',
      text: trimmed,
      ts: new Date().toISOString()
    };

    const answerText = buildPiAnswer(trimmed);
    const answerMsg = {
      sender: 'pi',
      text: answerText,
      ts: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, questionMsg, answerMsg]);
    setChatInput('');
  };

  // ========== Render (minimal, clear) ==========
  return (
    <div className="clean-shell">
      {/* TOPBAR */}
      <header className="clean-topbar">
        <div className="brand">
          <div className="brand-name">Company Admin</div>
          <div className="brand-sub">Welcome, {adminName}</div>
        </div>

        <div className="top-actions">
          <div className="search">
            <i className="bi bi-search" aria-hidden="true" />
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

      {/* FILTERS */}
      <section className="clean-filters">
        <label className="frow">
          <span>Date</span>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </label>

        <div className="frow">
          <button className="link" onClick={toggleEmployees}>
            {showEmployees ? 'Hide Employees' : 'Show Employees'}
          </button>
          <button className="link" onClick={() => fetchRecords()}>Refresh</button>
        </div>
      </section>

      {/* ERROR */}
      {error && <div className="clean-error">{error}</div>}

      {/* EMPLOYEES (simple list) */}
      <section className="clean-panel">
        <div className="panel-head">
          <h3>Employees</h3>
          <div className="panel-meta">{employees.length} total</div>
        </div>

        {showEmployees ? (
          <ul className="emp-list">
            {employees.map(emp => (
              <li key={emp._id} className="emp-row">
                <div className="emp-left">
                  <div className="avatar">{emp.name?.charAt(0).toUpperCase()}</div>
                  <div className="emp-info">
                    <div className="emp-name">{emp.name}</div>
                    <div className="emp-email">{emp.email}</div>
                    <div className="emp-meta">
                      Position: {emp.position || 'N/A'} • Role: {emp.role || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="emp-actions">
                  <span className="tiny muted">Leave</span>
                  <input
                    type="number"
                    value={emp.leave_quota || 0}
                    onChange={(e) => {
                      const updatedQuota = parseInt(e.target.value || '0', 10);
                      setEmployees(prev =>
                        prev.map(u =>
                          u._id === emp._id ? { ...u, leave_quota: updatedQuota } : u
                        )
                      );
                    }}
                  />
                  <button
                    className="icon-only"
                    title="Save"
                    onClick={() => updateLeaveQuota(emp._id, emp.leave_quota)}
                  >
                    <i className="bi bi-check-lg" />
                  </button>
                  <button
                    className="icon-only danger"
                    title="Delete"
                    onClick={() => handleDeleteEmployee(emp._id)}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="muted">Employees hidden — click "Show Employees" to view.</div>
        )}
      </section>

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
                  <th>Selfie</th>
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
                    <td>
                      {record.photo_path ? (
                        <button
                          className="clean-link"
                          onClick={() => handleViewPhoto(record.id)}
                        >
                          <i className="bi bi-camera" /> View
                        </button>
                      ) : (
                        <span className="muted tiny">No Image</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* PI CHAT PANEL (NEW) */}
      <section className="clean-panel pi-chat-panel">
        <div className="panel-head">
          <div>
            <h3 className="pi-chat-title">
              <i className="bi bi-robot" /> Attendance PI Chat
            </h3>
            <div className="panel-meta">
              Ask quick questions about attendance — today, yesterday, or a specific date.
            </div>
          </div>
        </div>

        <div className="pi-chat-body">
          <div className="pi-chat-messages">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`pi-msg ${m.sender === 'admin' ? 'me' : 'bot'}`}
              >
                <div className="pi-msg-label">
                  {m.sender === 'admin' ? 'You' : 'PI'}
                </div>
                <div className="pi-msg-bubble">
                  {m.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form className="pi-chat-input-row" onSubmit={handleChatSubmit}>
            <input
              type="text"
              placeholder={`Ask about attendance… e.g. "summary for ${today}"`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="clean-btn pi-send-btn">
              <i className="bi bi-send" />
            </button>
          </form>
        </div>
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
