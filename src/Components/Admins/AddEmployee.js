// src/Components/Admins/AddEmployee.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddEmployee.css';

const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',              // ✅ NEW: Date of Birth
    role: 'employee',
    department: '',
    position: '',
    currentAddress: '',
    permanentAddress: '',
    aadhar: '',
    leave_quota: 12
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validation
    if (!formData.employee_id || !formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Create the employee (calls /api/addemployee)
      const response = await fetch(`${API_BASE_URL}/api/addemployee`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData) // ✅ dob is now included automatically
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add employee');
      }

      const data = await response.json();
      const newEmployeeId = data.employee._id;

      // If photo is selected, upload it
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);

        const photoResponse = await fetch(
          `${API_BASE_URL}/api/profile/employee/${newEmployeeId}/upload-photo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: photoFormData
          }
        );

        if (!photoResponse.ok) {
          console.error('Photo upload failed, but employee was created');
        }
      }

      setMessage('Employee added successfully!');
      setTimeout(() => {
        navigate('/admin-dashboard/employeeprofileviewer');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      employee_id: '',
      name: '',
      email: '',
      password: '',
      phone: '',
      dob: '',          // ✅ reset dob too
      role: '',
      department: '',
      position: '',
      currentAddress: '',
      permanentAddress: '',
      aadhar: '',
      leave_quota: 12
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setError('');
    setMessage('');
  };

  return (
    <div className="add-employee-container">
      <div className="add-employee-header">
        <h1 className="page-title">
          <i className="bi bi-person-plus-fill"></i> Add New Employee
        </h1>
        <p className="page-subtitle">Fill in the details to add a new employee to the system</p>
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

      <form onSubmit={handleSubmit} className="add-employee-form">
        {/* Profile Photo Section */}
        <div className="form-section photo-section">
          <h2 className="section-title">
            <i className="bi bi-camera-fill"></i> Profile Photo
          </h2>
          <div className="photo-upload-area">
            <div className="photo-preview-box">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-preview-img" />
              ) : (
                <div className="photo-placeholder-large">
                  <i className="bi bi-person-circle"></i>
                  <p>No photo selected</p>
                </div>
              )}
            </div>
            <div className="photo-upload-actions">
              <label htmlFor="photo-upload" className="btn-upload-photo">
                <i className="bi bi-cloud-upload-fill"></i> Choose Photo
              </label>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              {photoPreview && (
                <button type="button" className="btn-remove-photo" onClick={handleRemovePhoto}>
                  <i className="bi bi-trash-fill"></i> Remove
                </button>
              )}
            </div>
            <small className="photo-hint">Max size: 5MB (JPG, PNG, GIF, WEBP)</small>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="bi bi-person-badge-fill"></i> Basic Information
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="employee_id" className="form-label required">Employee ID</label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., EMP001"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label required">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label required">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="employee@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label required">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter phone number"
              />
            </div>

            {/* ✅ New Date of Birth field */}
            <div className="form-group">
              <label htmlFor="dob" className="form-label">Date of Birth</label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="form-input"
                
              />
            </div>

            <div className="form-group">
              <label htmlFor="aadhar" className="form-label">Aadhar Number</label>
              <input
                type="text"
                id="aadhar"
                name="aadhar"
                value={formData.aadhar}
                onChange={handleChange}
                className="form-input"
                placeholder="12-digit Aadhar number"
                maxLength="12"
              />
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="bi bi-briefcase-fill"></i> Job Details
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="role" className="form-label">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., IT, HR, Finance"
              />
            </div>

            <div className="form-group">
              <label htmlFor="position" className="form-label">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="form-group">
              <label htmlFor="leave_quota" className="form-label">Annual Leave Quota</label>
              <input
                type="number"
                id="leave_quota"
                name="leave_quota"
                value={formData.leave_quota}
                onChange={handleChange}
                className="form-input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="bi bi-geo-alt-fill"></i> Address Information
          </h2>
          <div className="form-grid">
            <div className="form-group form-group-full">
              <label htmlFor="currentAddress" className="form-label">Current Address</label>
              <textarea
                id="currentAddress"
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter current address"
                rows="3"
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="permanentAddress" className="form-label">Permanent Address</label>
              <textarea
                id="permanentAddress"
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter permanent address"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span> Adding...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill"></i> Add Employee
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;
