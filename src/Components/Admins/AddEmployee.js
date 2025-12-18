// src/Components/Admins/AddEmployee.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import './AddEmployee.css';

const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // Validation Error State
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    role: 'employee',
    department: '',
    position: '',
    currentAddress: '',
    permanentAddress: '',
    aadhar: '',
    leave_quota: 12
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;

  // Helper: Get today's date for max attribute
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this specific field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'File size must be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Only image files are allowed', 'error');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // --- VALIDATION LOGIC ---
  const validateForm = () => {
    let newErrors = {};
    
    // 1. Validate Employee ID (Must start with ISARED or ISARAD followed by numbers)
    const empIdRegex = /^(ISARED|ISARAD)[0-9]+$/;
    if (!formData.employee_id.trim()) {
      newErrors.employee_id = "Employee ID is required";
    } else if (!formData.employee_id.startsWith('ISARED') && !formData.employee_id.startsWith('ISARAD')) {
      newErrors.employee_id = "ID must start with 'ISARED' or 'ISARAD'";
    } else if (!empIdRegex.test(formData.employee_id)) {
      newErrors.employee_id = "ID must follow prefix with numbers only (e.g., ISARED101)";
    }

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // 2. Password (Minimum 10 characters)
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 10) {
      newErrors.password = "Password must be at least 10 characters";
    }

    // Phone (10 Digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }

    // Date of Birth (Age > 17 check)
    if (!formData.dob) {
      newErrors.dob = "Date of Birth is required";
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age <= 17) {
        newErrors.dob = `Age is ${age}. Employee must be 18+`;
      }
      if (birthDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      }
    }

    // Aadhar (12 Digits)
    const aadharRegex = /^[0-9]{12}$/;
    if (!formData.aadhar) {
      newErrors.aadhar = "Aadhar number is required";
    } else if (!aadharRegex.test(formData.aadhar)) {
      newErrors.aadhar = "Aadhar must be exactly 12 digits";
    }

    // Other Required Fields
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.position.trim()) newErrors.position = "Position is required";
    if (!formData.currentAddress.trim()) newErrors.currentAddress = "Current Address is required";
    if (!formData.permanentAddress.trim()) newErrors.permanentAddress = "Permanent Address is required";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Run Validation
    const formErrors = validateForm();
    
    // 2. Update State to show Red Borders
    setErrors(formErrors);

    // 3. Check if there are errors
    if (Object.keys(formErrors).length > 0) {
      // Create Popup Message
      const errorList = Object.values(formErrors).map(err => `<li>${err}</li>`).join('');
      
      Swal.fire({
        icon: 'error',
        title: 'Validation Failed',
        html: `<ul style="text-align: left; list-style-position: inside;">${errorList}</ul>`,
        confirmButtonColor: '#d33'
      });
      return; 
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/addemployee`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add employee');
      }

      const data = await response.json();
      const newEmployeeId = data.employee._id;

      // Photo Upload
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);

        await fetch(
          `${API_BASE_URL}/api/profile/employee/${newEmployeeId}/upload-photo`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: photoFormData
          }
        );
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Employee added successfully!',
        timer: 2000,
        showConfirmButton: false
      });

      setTimeout(() => {
        navigate('/admin-dashboard/employeeprofileviewer');
      }, 2000);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: err.message
      });
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
      dob: '',
      role: 'employee',
      department: '',
      position: '',
      currentAddress: '',
      permanentAddress: '',
      aadhar: '',
      leave_quota: 12
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrors({});
  };

  return (
    <div className="add-employee-container">
      <div className="add-employee-header">
        <h1 className="page-title">
          <i className="bi bi-person-plus-fill"></i> Add New Employee
        </h1>
        <p className="page-subtitle">Fill in the details to add a new employee to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="add-employee-form" noValidate>
        {/* Profile Photo Section */}
        <div className="form-section photo-section">
          <h2 className="section-title"><i className="bi bi-camera-fill"></i> Profile Photo</h2>
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
              <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              {photoPreview && (
                <button type="button" className="btn-remove-photo" onClick={handleRemovePhoto}>
                  <i className="bi bi-trash-fill"></i> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h2 className="section-title"><i className="bi bi-person-badge-fill"></i> Basic Information</h2>
          <div className="form-grid">
            
            <div className="form-group">
              <label htmlFor="employee_id" className="form-label">Employee ID <span className="text-danger">*</span></label>
              <input
                type="text" name="employee_id" value={formData.employee_id} onChange={handleChange}
                className={`form-input ${errors.employee_id ? 'input-error' : ''}`} 
                placeholder="e.g., ISARED001 or ISARAD001"
              />
              {errors.employee_id && <small className="error-msg">{errors.employee_id}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name <span className="text-danger">*</span></label>
              <input
                type="text" name="name" value={formData.name} onChange={handleChange}
                className={`form-input ${errors.name ? 'input-error' : ''}`} placeholder="Enter full name"
              />
              {errors.name && <small className="error-msg">{errors.name}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className={`form-input ${errors.email ? 'input-error' : ''}`} placeholder="employee@example.com"
              />
              {errors.email && <small className="error-msg">{errors.email}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password <span className="text-danger">*</span></label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`} 
                placeholder="Min 10 characters"
              />
              {errors.password && <small className="error-msg">{errors.password}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number <span className="text-danger">*</span></label>
              <input
                type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className={`form-input ${errors.phone ? 'input-error' : ''}`} placeholder="10 digit number" maxLength="10"
              />
              {errors.phone && <small className="error-msg">{errors.phone}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="dob" className="form-label">Date of Birth <span className="text-danger">*</span></label>
              <input
                type="date" name="dob" value={formData.dob} onChange={handleChange}
                max={getTodayDate()} 
                className={`form-input ${errors.dob ? 'input-error' : ''}`}
              />
              {errors.dob && <small className="error-msg">{errors.dob}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="aadhar" className="form-label">Aadhar Number <span className="text-danger">*</span></label>
              <input
                type="text" name="aadhar" value={formData.aadhar} onChange={handleChange}
                className={`form-input ${errors.aadhar ? 'input-error' : ''}`} placeholder="12-digit Aadhar number" maxLength="12"
              />
              {errors.aadhar && <small className="error-msg">{errors.aadhar}</small>}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="form-section">
          <h2 className="section-title"><i className="bi bi-briefcase-fill"></i> Job Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Role <span className="text-danger">*</span></label>
              <select name="role" value={formData.role} onChange={handleChange} className="form-select">
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department <span className="text-danger">*</span></label>
              <input
                type="text" name="department" value={formData.department} onChange={handleChange}
                className={`form-input ${errors.department ? 'input-error' : ''}`}
              />
              {errors.department && <small className="error-msg">{errors.department}</small>}
            </div>

            <div className="form-group">
              <label className="form-label">Position <span className="text-danger">*</span></label>
              <input
                type="text" name="position" value={formData.position} onChange={handleChange}
                className={`form-input ${errors.position ? 'input-error' : ''}`}
              />
              {errors.position && <small className="error-msg">{errors.position}</small>}
            </div>

            <div className="form-group">
              <label className="form-label">Annual Leave Quota</label>
              <input type="number" name="leave_quota" value={formData.leave_quota} onChange={handleChange} className="form-input" min="0" />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="form-section">
          <h2 className="section-title"><i className="bi bi-geo-alt-fill"></i> Address Information</h2>
          <div className="form-grid">
            <div className="form-group form-group-full">
              <label className="form-label">Current Address <span className="text-danger">*</span></label>
              <textarea
                name="currentAddress" value={formData.currentAddress} onChange={handleChange}
                className={`form-textarea ${errors.currentAddress ? 'input-error' : ''}`} rows="3"
              />
              {errors.currentAddress && <small className="error-msg">{errors.currentAddress}</small>}
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Permanent Address <span className="text-danger">*</span></label>
              <textarea
                name="permanentAddress" value={formData.permanentAddress} onChange={handleChange}
                className={`form-textarea ${errors.permanentAddress ? 'input-error' : ''}`} rows="3"
              />
              {errors.permanentAddress && <small className="error-msg">{errors.permanentAddress}</small>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner-small"></span> : <><i className="bi bi-check-circle-fill"></i> Add Employee</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;