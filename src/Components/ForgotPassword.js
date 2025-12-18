import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaKey } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginPage.css'; // Reusing styles

export default function ForgotPassword() {
    const navigate = useNavigate();
    const API_BASE = process.env.REACT_APP_API_URL || "";

    const [step, setStep] = useState(1); // 1: Email, 2: OTP & Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

            setMessage(data.message);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/verify-otp-change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reset password');

            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="isar-login min-vh-100 d-flex align-items-center">
            <div className="container py-4 py-md-5">
                <div className="row g-4 align-items-center justify-content-center">
                    <div className="col-12 col-md-8 col-lg-5">
                        <div className="login-card shadow-soft">
                            <header className="mb-4 text-center">
                                <div className="brand-name">ISAR</div>
                                <div className="brand-sub">Password Recovery</div>
                            </header>

                            {step === 1 && (
                                <form onSubmit={handleRequestOtp}>
                                    <div className="mb-4">
                                        <label className="form-label field-label">Email Address</label>
                                        <div className="position-relative">
                                            <input
                                                type="email"
                                                className="form-control field-line ps-5"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="Enter your registered email"
                                            />
                                            <FaEnvelope className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                        </div>
                                    </div>

                                    {error && <div className="alert alert-danger">{error}</div>}
                                    {message && <div className="alert alert-success">{message}</div>}

                                    <button type="submit" className="btn btn-login w-100" disabled={loading}>
                                        {loading ? 'Sending OTP...' : 'Send OTP'}
                                    </button>
                                </form>
                            )}

                            {step === 2 && (
                                <form onSubmit={handleResetPassword}>
                                    <div className="mb-3">
                                        <label className="form-label field-label">Enter OTP</label>
                                        <div className="position-relative">
                                            <input
                                                type="text"
                                                className="form-control field-line ps-5"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                required
                                                placeholder="6-digit OTP"
                                            />
                                            <FaKey className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                        </div>
                                        <div className="form-text text-end">
                                            <button
                                                type="button"
                                                className="btn btn-link btn-sm p-0"
                                                onClick={() => setStep(1)}
                                            >
                                                Change Email?
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label field-label">New Password</label>
                                        <div className="position-relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control field-line ps-5 pe-5"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                placeholder="New Password"
                                            />
                                            <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                            <button
                                                type="button"
                                                className="btn btn-link p-0 position-absolute top-50 end-0 translate-middle-y me-3 toggle-password"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label field-label">Confirm Password</label>
                                        <div className="position-relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control field-line ps-5"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                placeholder="Confirm Password"
                                            />
                                            <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                        </div>
                                    </div>

                                    {error && <div className="alert alert-danger">{error}</div>}
                                    {message && <div className="alert alert-success">{message}</div>}

                                    <button type="submit" className="btn btn-login w-100" disabled={loading}>
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </form>
                            )}

                            <div className="text-center mt-3">
                                <Link to="/" className="small text-muted text-decoration-none">
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
