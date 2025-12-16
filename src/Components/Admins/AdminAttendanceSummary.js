import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, UserX, Clock, Activity, Download } from 'lucide-react';
import './AdminAttendanceSummary.css';

const AdminAttendanceSummary = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');

    if (!token) {
      setError("No token found. Admin not authenticated.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/attendance/monthly-summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        setError(`Auth Error: ${errorData.message}`);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setSummaryData(data);
      } else {
        setError("Invalid data format received.");
        setSummaryData([]);
      }
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError("Failed to fetch attendance data.");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  const filterData = useCallback(() => {
    let data = [...summaryData];

    if (searchTerm) {
      data = data.filter(item =>
        item.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMonth) {
      data = data.filter(item => item.month === selectedMonth);
    }

    setFilteredData(data);
  }, [searchTerm, selectedMonth, summaryData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  const handlePresentDaysChange = (index, value) => {
    const updated = [...filteredData];
    updated[index].present_days = Number(value);
    setFilteredData(updated);
  };

  const handleSave = async (id, present_days) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Token not found. Please login again.");
        return;
      }
      const response = await fetch(`${BASE_URL}/api/monthly-summary/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ present_days }),
      });
      const result = await response.json();
      if (response.ok) {
        fetchData();
      } else {
        alert(result.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const downloadCSV = () => {
    const csvRows = [
      ['Employee ID', 'Name', 'Present Days', 'Total Working Days'],
      ...filteredData.map(row =>
        [row.employee_id, row.employee_name, row.present_days, row.total_working_days]
      ),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map(e => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'attendance_summary.csv';
    link.click();
  };

  const months = [...new Set(summaryData.map(item => item.month))];

  // ============================================
  //  DYNAMIC DASHBOARD CALCULATIONS
  // ============================================

  // 1. Calculate Top Stat Cards
  const stats = useMemo(() => {
    const totalEmployees = filteredData.length;
    const totalDaysWorked = filteredData.reduce((acc, curr) => acc + (curr.present_days || 0), 0);
    const totalPossibleDays = filteredData.reduce((acc, curr) => acc + (curr.total_working_days || 1), 0);
    
    // Calculate Attendance %
    const attendanceRate = totalPossibleDays > 0 ? ((totalDaysWorked / totalPossibleDays) * 100).toFixed(1) : 0;
    
    // Estimate "Low Attendance" (Anyone with < 50% attendance)
    const absentCount = filteredData.filter(d => (d.present_days / d.total_working_days) < 0.5).length;

    return { totalEmployees, attendanceRate, absentCount, totalDaysWorked };
  }, [filteredData]);

  // 2. Calculate Department Data (Real-time)
  const deptData = useMemo(() => {
    const deptMap = {};

    filteredData.forEach(emp => {
      // NOTE: If your API does not have 'department', this defaults to 'General'
      const deptName = emp.department || 'General'; 
      
      if (!deptMap[deptName]) {
        deptMap[deptName] = { totalDays: 0, presentDays: 0 };
      }
      
      deptMap[deptName].totalDays += (emp.total_working_days || 1);
      deptMap[deptName].presentDays += (emp.present_days || 0);
    });

    return Object.keys(deptMap).map(key => {
      const d = deptMap[key];
      const percentage = d.totalDays > 0 ? ((d.presentDays / d.totalDays) * 100).toFixed(0) : 0;
      return { name: key, value: Number(percentage) };
    });
  }, [filteredData]);

  // 3. Pie Chart Data (Static for now as API lacks location data)
  const pieData = [
    { name: 'Office', value: 100, color: '#4f46e5' }, 
    { name: 'Remote', value: 0, color: '#f87171' }
  ];

  return (
    <div className="admin-summary-container">
      <div className="dashboard-header">
        <h2>HR Attendance Dashboard</h2>
        <p className="dashboard-subtitle">Overview of employee performance and presence</p>
      </div>

      {/* --- STATS SECTION --- */}
      <div className="stats-grid">
        <div className="stat-card">
            <div className="stat-icon-bg blue"><Users size={24} className="text-blue-600" /></div>
            <div>
                <h4>Total Employees</h4>
                <h3>{stats.totalEmployees}</h3>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon-bg red"><UserX size={24} className="text-red-600" /></div>
            <div>
                <h4>Low Attendance</h4>
                <h3>{stats.absentCount}</h3>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon-bg orange"><Clock size={24} className="text-orange-600" /></div>
            <div>
                <h4>Total Man-Days</h4>
                <h3>{stats.totalDaysWorked}</h3>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon-bg purple"><Activity size={24} className="text-purple-600" /></div>
            <div>
                <h4>Avg Attendance</h4>
                <h3>{stats.attendanceRate}%</h3>
            </div>
        </div>
      </div>

      {/* --- CHARTS SECTION --- */}
      <div className="charts-grid">
        {/* Department Chart */}
        <div className="chart-box">
            <h3>Attendance by Department</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <BarChart layout="vertical" data={deptData} margin={{ left: 10, right: 30 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                        <Tooltip />
                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                            {deptData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#6366f1" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Location Chart */}
        <div className="chart-box">
             <h3>Work Mode</h3>
             <div className="pie-chart-wrapper" style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie 
                          data={pieData} 
                          innerRadius={60} 
                          outerRadius={80} 
                          dataKey="value" 
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pie-center-text">
                    <span>{stats.totalEmployees}</span>
                    <small>Total</small>
                </div>
             </div>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {/* --- CONTROLS & TABLE --- */}
      <div className="admin-summary-controls">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="">All Months</option>
          {months.map((month, index) => (
            <option key={index} value={month}>{month}</option>
          ))}
        </select>
        <button className="download-button" onClick={downloadCSV}>
          <Download size={16} style={{marginRight: '8px'}}/> Download CSV
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-wrapper">
            <table className="admin-summary-table">
            <thead>
                <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Present Days</th>
                <th>Total Working Days</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredData.length > 0 ? (
                filteredData.map((record, index) => (
                    <tr key={record._id || `${record.employee_id}-${record.month}`}>
                    <td>{record.employee_id}</td>
                    <td>{record.employee_name}</td>
                    <td>
                        <input
                        type="number"
                        value={record.present_days}
                        onChange={(e) => handlePresentDaysChange(index, e.target.value)}
                        min={0}
                        max={record.total_working_days}
                        />
                    </td>
                    <td>{record.total_working_days}</td>
                    <td>
                        <button onClick={() => handleSave(record._id, record.present_days)}>
                        Save
                        </button>
                    </td>
                    </tr>
                ))
                ) : (
                <tr><td colSpan="5">No data found.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceSummary;