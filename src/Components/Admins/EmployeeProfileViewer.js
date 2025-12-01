import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeProfileViewer.css';

const EmployeeProfileViewer = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/profile/profiles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched profiles:', data);
          setProfiles(data);
          setFilteredProfiles(data);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch employee profiles:', errorData);
          setError(errorData.message || 'Failed to fetch profiles');
        }
      } catch (err) {
        console.error('Error fetching employee profiles:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [API_BASE_URL]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = profiles.filter(
      (emp) =>
        (emp.name && emp.name.toLowerCase().includes(value)) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(value)) ||
        (emp.email && emp.email.toLowerCase().includes(value)) ||
        (emp.role && emp.role.toLowerCase().includes(value))
    );

    setFilteredProfiles(filtered);
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleEmail = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleViewDetails = (emp) => {
    const employeeId = emp._id || emp.id;
    if (!employeeId) {
      console.error('No employee ID found:', emp);
      alert('Cannot view details: Employee ID not found');
      return;
    }
    console.log('Navigating to employee details:', employeeId);
    navigate(`/admin-dashboard/employee-details/${employeeId}`);
  };

  if (loading) {
    return (
      <div className="employee-profile-viewer">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-profile-viewer">
        <div className="error-message">
          <i className="bi bi-exclamation-circle"></i> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="employee-profile-viewer">
      <div className="viewer-header">
        <h1 className="viewer-title">Employees</h1>
        <div className="search-bar">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="no-results">
          <i className="bi bi-people"></i>
          <p>{searchTerm ? 'No profiles match your search.' : 'No profiles found.'}</p>
        </div>
      ) : (
        <div className="employee-cards-grid">
          {filteredProfiles.map((emp) => (
            <div className="employee-card" key={emp._id || emp.id}>
              <div className="card-content">
                {/* Profile Photo */}
                <div className="employee-photo-section">
                  {emp.photo ? (
                    <img src={emp.photo} alt={emp.name} className="employee-photo" />
                  ) : (
                    <div className="employee-photo-placeholder">
                      <i className="bi bi-person-circle"></i>
                    </div>
                  )}
                </div>

                {/* Employee Info */}
                <div className="employee-info-section">
                  <div className="employee-avatar-icon">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <h3 className="employee-name">{emp.name}</h3>
                  <p className="employee-id">{emp.employee_id}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="card-actions">
                <button 
                  className="action-btn call-btn"
                  onClick={() => handleCall(emp.phone)}
                  disabled={!emp.phone}
                  title="Call"
                >
                  <i className="bi bi-telephone-fill"></i>
                </button>
                <button 
                  className="action-btn email-btn"
                  onClick={() => handleEmail(emp.email)}
                  title="Email"
                >
                  <i className="bi bi-envelope-fill"></i>
                </button>
                <button 
                  className="action-btn details-btn"
                  onClick={() => handleViewDetails(emp)}
                  title="View Details"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeProfileViewer;
