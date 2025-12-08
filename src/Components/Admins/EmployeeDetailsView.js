// src/Components/Admins/EmployeeDetailsView.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EmployeeDetailsView.css';

const EmployeeDetailsView = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [editedData, setEditedData] = useState({});

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchEmployeeDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployee(data);
        setEditedData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch employee details');
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...employee });
    setError('');
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...employee });
    setPhotoFile(null);
    setError('');
    setMessage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      setPhotoFile(file);
      setError('');
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('photo', photoFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/profile/employee/${employeeId}/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');

      const data = await response.json();
      setEmployee(prev => ({ ...prev, photo: data.photo }));
      setEditedData(prev => ({ ...prev, photo: data.photo }));
      setMessage('Photo uploaded successfully');
      setPhotoFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to delete this profile photo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/profile/employee/${employeeId}/delete-photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete photo');

      setEmployee(prev => ({ ...prev, photo: null }));
      setEditedData(prev => ({ ...prev, photo: null }));
      setMessage('Photo deleted successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/profile/employee/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editedData.name,
          phone: editedData.phone,
          email: editedData.email,
          department: editedData.department,
          position: editedData.position,
          currentAddress: editedData.currentAddress,
          permanentAddress: editedData.permanentAddress,
          aadhar: editedData.aadhar
        })
      });

      if (!response.ok) throw new Error('Failed to update employee');

      const data = await response.json();
      setEmployee(data.employee);
      setEditedData(data.employee);
      setMessage('Employee details updated successfully');
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="employee-details-view">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="employee-details-view">
        <div className="error-message">
          <i className="bi bi-exclamation-circle"></i> {error}
        </div>
        <button className="btn-back" onClick={handleBack}>
          <i className="bi bi-arrow-left"></i> Go Back
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="employee-details-view">
        <div className="no-data">
          <i className="bi bi-person-x"></i>
          <p>Employee not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-details-view">
      <div className="details-header-bar">
        <button className="btn-back" onClick={handleBack}>
          <i className="bi bi-arrow-left"></i>
          <span>Back to employees</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="bi bi-exclamation-circle"></i> {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle"></i> {message}
        </div>
      )}

      <div className="employee-details-card">
        {/* Profile Header Section */}
        <div className="profile-head">
          <div className="profile-photo-wrapper">
            <div className="profile-photo-large">
              {(editedData.photo || employee.photo) ? (
                <img src={editedData.photo || employee.photo} alt={employee.name} />
              ) : (
                <div className="photo-placeholder">
                  <i className="bi bi-person-fill"></i>
                </div>
              )}
            </div>

            {isEditing && (
              <>
                <div className="photo-actions">
                  <label htmlFor="photo-upload" className="photo-upload-label">
                    <i className="bi bi-camera-fill"></i>
                    Change photo
                  </label>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                  {(employee.photo || editedData.photo) && (
                    <button className="photo-delete-btn" onClick={handleDeletePhoto}>
                      <i className="bi bi-trash-fill"></i>
                      Remove
                    </button>
                  )}
                </div>

                {photoFile && (
                  <div className="photo-preview">
                    <small>{photoFile.name}</small>
                    <div className="photo-preview-actions">
                      <button
                        className="btn-upload"
                        onClick={handlePhotoUpload}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading…' : 'Upload'}
                      </button>
                      <button
                        className="btn-cancel-upload"
                        onClick={() => setPhotoFile(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="profile-info-wrapper">
            {!isEditing ? (
              <>
                <h1 className="employee-name">{employee.name}</h1>
                <p className="employee-role">
                  {employee.position || 'Employee'} • {employee.department || 'Department'}
                </p>
                <p className="employee-meta">
                  {employee.employee_id && (
                    <>
                      <i className="bi bi-upc-scan" /> {employee.employee_id}
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  name="name"
                  value={editedData.name || ''}
                  onChange={handleChange}
                  className="edit-input-name"
                  placeholder="Full name"
                />
                <div className="edit-role-row">
                  <select
                    name="role"
                    value={editedData.role || 'employee'}
                    onChange={handleChange}
                    className="edit-select-role"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input
                    type="text"
                    name="department"
                    value={editedData.department || ''}
                    onChange={handleChange}
                    className="edit-input-dept"
                    placeholder="Department"
                  />
                </div>
              </>
            )}
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <button className="btn-edit" onClick={handleEdit}>
                <i className="bi bi-pencil-square" />
                Edit profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn-save" onClick={handleSave}>
                  <i className="bi bi-check-circle" />
                  Save
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  <i className="bi bi-x-circle" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid Section */}
        <div className="details-grid">
          {/* Employee ID */}
          <div className="detail-card">
            <div className="detail-icon detail-icon-id">
              <i className="bi bi-upc-scan" />
            </div>
            <div className="detail-text">
              <label>Employee ID</label>
              <p>{employee.employee_id || '—'}</p>
            </div>
          </div>

          {/* Email */}
          <div className="detail-card">
            <div className="detail-icon detail-icon-email">
              <i className="bi bi-envelope-fill" />
            </div>
            <div className="detail-text">
              <label>Email</label>
              {!isEditing ? (
                <p>{employee.email || '—'}</p>
              ) : (
                <input
                  type="email"
                  name="email"
                  value={editedData.email || ''}
                  onChange={handleChange}
                  className="edit-field-input"
                  placeholder="Email"
                />
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="detail-card">
            <div className="detail-icon detail-icon-phone">
              <i className="bi bi-telephone-fill" />
            </div>
            <div className="detail-text">
              <label>Phone</label>
              {!isEditing ? (
                <p>{employee.phone || '—'}</p>
              ) : (
                <input
                  type="tel"
                  name="phone"
                  value={editedData.phone || ''}
                  onChange={handleChange}
                  className="edit-field-input"
                  placeholder="Phone"
                />
              )}
            </div>
          </div>

          {/* Position */}
          <div className="detail-card">
            <div className="detail-icon detail-icon-position">
              <i className="bi bi-briefcase-fill" />
            </div>
            <div className="detail-text">
              <label>Position</label>
              {!isEditing ? (
                <p>{employee.position || '—'}</p>
              ) : (
                <input
                  type="text"
                  name="position"
                  value={editedData.position || ''}
                  onChange={handleChange}
                  className="edit-field-input"
                  placeholder="Position"
                />
              )}
            </div>
          </div>

          {/* Current Address */}
          <div className="detail-card detail-card-wide">
            <div className="detail-icon detail-icon-address">
              <i className="bi bi-geo-alt-fill" />
            </div>
            <div className="detail-text">
              <label>Current address</label>
              {!isEditing ? (
                <p>{employee.currentAddress || '—'}</p>
              ) : (
                <textarea
                  name="currentAddress"
                  value={editedData.currentAddress || ''}
                  onChange={handleChange}
                  className="edit-field-textarea"
                  placeholder="Current address"
                  rows="2"
                />
              )}
            </div>
          </div>

          {/* Permanent Address */}
          <div className="detail-card detail-card-wide">
            <div className="detail-icon detail-icon-home">
              <i className="bi bi-house-fill" />
            </div>
            <div className="detail-text">
              <label>Permanent address</label>
              {!isEditing ? (
                <p>{employee.permanentAddress || '—'}</p>
              ) : (
                <textarea
                  name="permanentAddress"
                  value={editedData.permanentAddress || ''}
                  onChange={handleChange}
                  className="edit-field-textarea"
                  placeholder="Permanent address"
                  rows="2"
                />
              )}
            </div>
          </div>

          {/* Aadhar */}
          <div className="detail-card detail-card-wide">
            <div className="detail-icon detail-icon-aadhar">
              <i className="bi bi-credit-card-2-front-fill" />
            </div>
            <div className="detail-text">
              <label>Aadhar number</label>
              {!isEditing ? (
                <p>{employee.aadhar || '—'}</p>
              ) : (
                <input
                  type="text"
                  name="aadhar"
                  value={editedData.aadhar || ''}
                  onChange={handleChange}
                  className="edit-field-input"
                  placeholder="Aadhar number"
                  maxLength="12"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsView;
