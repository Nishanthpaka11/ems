import React, { useEffect, useState, useCallback } from 'react';
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

  return (
    <div className="admin-summary-container">
      <h2>Attendance Summary</h2>

      {error && <p className="error-message">{error}</p>}

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
          ⬇️ Download CSV
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
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
      )}
    </div>
  );
};

export default AdminAttendanceSummary;
