// src/Components/Employees/ProfileSection.js
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./ProfileSection.css";
import { authFetch } from "../utils/authFetch";

export default function ProfileSection() {
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Security/Password State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);

  const API_BASE = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
        setEmail(data.email);
      } catch {
        setError("Failed to load profile. Please log in again.");
      }
    };
    fetchProfile();
  }, [API_BASE, token]);

  // --- Profile Edit Logic ---

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Logic for Phone Number: Allow only numbers, max length 10
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, ""); // Remove non-digits
      if (numericValue.length <= 10) {
        setEditData({ ...editData, [name]: numericValue });
      }
    } else {
      setEditData({ ...editData, [name]: value });
    }
    // Clear error as soon as user types
    if (error) setError(""); 
  };

  const handleStartEdit = () => {
    const cleanPhone = profile.phone ? profile.phone.replace("+91", "").trim() : "";
    setEditData({ ...profile, phone: cleanPhone });
    setIsEditing(true);
    setMessage("");
    setError("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setError("");
  };

  const handleSave = async () => {
    // --- VALIDATION START ---
    
    // 1. Check for Empty Fields
    if (
      !editData.phone || 
      !editData.currentAddress || 
      !editData.permanentAddress
    ) {
      setError("⚠️ Gentle Reminder: Please fill in all mandatory fields before saving.");
      return;
    }

    // 2. Check Phone Length
    if (editData.phone.length !== 10) {
      setError("⚠️ Phone number must be exactly 10 digits.");
      return;
    }

    // --- VALIDATION END ---

    try {
      const res = await authFetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editData.name,
          phone: editData.phone, 
          currentAddress: editData.currentAddress,
          permanentAddress: editData.permanentAddress,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");

      setProfile(editData);
      setMessage("Profile updated successfully.");
      setError("");
      setIsEditing(false);
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.message || "Update failed. Please try again.");
      setMessage("");
    }
  };

  // --- Password/Security Logic ---

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setStep(2);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const res = await authFetch(`${API_BASE}/api/auth/verify-otp-change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
      setMessage("Password changed successfully.");
      setShowPasswordForm(false);
      setStep(1);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!profile) return <p className="loading">Loading profile...</p>;

  return (
    <motion.div
      className={`profile-container ${isEditing ? "edit-mode" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <motion.div
        className="profile-header glassy"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="profile-left">
          <motion.img
            src={profile.photo || "/default-avatar.png"}
            alt="Profile"
            className="profile-avatar"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          />
          <div className="profile-info">
            <h3 className="profile-name">
              <i className=" me-2 text-primary"></i>
              {profile.name || "—"}
            </h3>
            <p className="profile-role text-muted">
              <i className=" me-2"></i>
              {profile.role || "Employee"} • {profile.department || "IT"}
            </p>
          </div>
        </div>

        <div className="profile-actions">
          {!isEditing ? (
            <motion.button
              className="btn btn-edit"
              onClick={handleStartEdit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="bi bi-pencil-square"></i> Edit
            </motion.button>
          ) : (
            <>
              <motion.button
                className="btn btn-cancel"
                onClick={handleCancelEdit}
                whileHover={{ scale: 1.05 }}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </motion.button>
              <motion.button
                className="btn btn-save"
                onClick={handleSave}
                whileHover={{ scale: 1.05 }}
              >
                <i className="bi bi-check-circle"></i> Save
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <motion.div
          className="alert alert-danger-modern"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          className="alert alert-success-modern"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <i className="bi bi-check-circle me-2"></i>
          {message}
        </motion.div>
      )}

      <motion.div
        className="profile-card glassy"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* PERSONAL INFO */}
        <div className="profile-section">
          <h5 className="section-title">
            <i className="bi bi-person-lines-fill me-2 text-info"></i>
            Personal Information
          </h5>
          <div className="profile-grid">
            <div className="field">
              <label>
                <i className="bi bi-hash me-2"></i>Employee ID
              </label>
              <div className="value">{profile.employee_id || "—"}</div>
            </div>
            <div className="field">
              <label>
                <i className="bi bi-envelope me-2"></i>Email
              </label>
              <div className="value">{profile.email || "—"}</div>
            </div>
            <div className="field">
              <label>
                <i className="bi bi-telephone me-2"></i>Phone 
                {isEditing && <span className="text-danger ms-1">*</span>}
              </label>
              {!isEditing ? (
                <div className="value">
                  {profile.phone ? `+91 ${profile.phone.replace('+91', '').trim()}` : "—"}
                </div>
              ) : (
                <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                  <span 
                    className="text-muted fw-bold" 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      padding: '8px 12px', 
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    +91
                  </span>
                  <input
                    className={`input ${!editData.phone ? 'is-invalid' : ''}`}
                    name="phone"
                    type="tel"
                    value={editData?.phone || ""}
                    onChange={handleChange}
                    placeholder="Ten digits only"
                    maxLength={10}
                    style={{ flex: 1 }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ADDRESS INFO */}
        <div className="profile-section">
          <h5 className="section-title">
            <i className="bi bi-geo-alt me-2 text-success"></i>
            Address Details
          </h5>
          <div className="profile-grid">
            <div className="field">
              <label>
                <i className="bi bi-house-door me-2"></i>Current Address
                {isEditing && <span className="text-danger ms-1">*</span>}
              </label>
              {!isEditing ? (
                <div className="value">{profile.currentAddress || "—"}</div>
              ) : (
                <input
                  className={`input ${!editData.currentAddress ? 'is-invalid' : ''}`}
                  name="currentAddress"
                  value={editData?.currentAddress || ""}
                  onChange={handleChange}
                  placeholder="Enter current address"
                />
              )}
            </div>
            <div className="field">
              <label>
                <i className="bi bi-building me-2"></i>Permanent Address
                {isEditing && <span className="text-danger ms-1">*</span>}
              </label>
              {!isEditing ? (
                <div className="value">{profile.permanentAddress || "—"}</div>
              ) : (
                <input
                  className={`input ${!editData.permanentAddress ? 'is-invalid' : ''}`}
                  name="permanentAddress"
                  value={editData?.permanentAddress || ""}
                  onChange={handleChange}
                  placeholder="Enter permanent address"
                />
              )}
            </div>
          </div>
        </div>

        {/* SECURITY */}
        {isEditing && (
          <motion.div
            className="security-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h5 className="section-title">
              <i className="bi bi-shield-lock me-2 text-danger"></i>Security
            </h5>
            {!showPasswordForm ? (
              <button
                className="btn btn-outline"
                onClick={() => setShowPasswordForm(true)}
              >
                <i className="bi bi-key me-2"></i> Change Password
              </button>
            ) : (
              <div className="password-form">
                {step === 1 ? (
                  <form onSubmit={handleSendOtp}>
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                    />
                    <button type="submit" className="btn btn-save w-100">
                      <i className="bi bi-send"></i> Send OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <input
                      type="text"
                      className="input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      placeholder="Enter OTP"
                    />
                    <input
                      type="password"
                      className="input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="New password"
                    />
                    <input
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm password"
                    />
                    <div className="d-flex gap-2 mt-2">
                      <button type="submit" className="btn btn-save flex-grow-1">
                        <i className="bi bi-check2-circle"></i> Confirm
                      </button>
                      <button
                        type="button"
                        className="btn btn-cancel flex-grow-1"
                        onClick={() => setShowPasswordForm(false)}
                      >
                        <i className="bi bi-x-circle"></i> Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}