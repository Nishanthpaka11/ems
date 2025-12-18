import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";

export default function LoginPage() {
  // form state
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ui state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!API_BASE) {
      setError(
        "Missing REACT_APP_API_URL. Please set it in your environment (e.g., .env)."
      );
      return;
    }

    if (!employeeId.trim() || !password) {
      setError("Please enter both Employee ID and Password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId.trim(),
          password,
        }),
      });

      // Attempt to parse JSON even for error responses
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Login failed");
      }

      const { token, user } = payload || {};
      if (!token || !user) {
        throw new Error("Invalid credentials or missing token.");
      }

      // persist and route
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="isar-login min-vh-100 d-flex align-items-center">
      <div className="container py-4 py-md-5">
        <div className="row g-4 align-items-center align-items-lg-start justify-content-between">
          {/* LEFT — Logo + Heading + Illustration */}
          <div className="col-12 col-lg-7 welcome-col">
            <img src="/images/isar-logo.png" alt="ISAR" className="isar-logo" />

            <div className="hi-wrapper">
              <h1 className="welcome-hi">Hi!</h1>
              <img
                src="/images/team-highfive.jpg"
                alt="Team high five"
                className="welcome-illustration"
              />
            </div>

            <div className="welcome-text">
              <h1 className="welcome-title">Welcome</h1>
              <p className="welcome-sub">To employee Management System</p>
            </div>
          </div>

          {/* RIGHT — Login Card (with API) */}
          <div className="col-12 col-lg-5">
            <div className="login-card shadow-soft">
              <header className="mb-3">
                <div className="brand-name">ISAR</div>
                <div className="brand-sub">Employee EMS</div>
              </header>

              <form noValidate onSubmit={handleLogin}>
                <div className="mb-4">
                  <label htmlFor="employeeId" className="form-label field-label">
                    Employee ID
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    className="form-control field-line"
                    inputMode="text"
                    autoComplete="username"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    disabled={loading}

                  />
                </div>

                <div className="mb-2">
                  <label htmlFor="password" className="form-label field-label">
                    Password
                  </label>
                  <div className="position-relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-control field-line pe-5"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}

                    />
                    <button
                      type="button"
                      className="btn btn-link p-0 position-absolute top-50 end-0 translate-middle-y me-3 toggle-password"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 mt-3" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-login w-100 mt-4"
                  disabled={loading}
                >
                  <span>{loading ? "Logging in..." : "LOGIN"}</span>
                  <span
                    className="login-icon ms-2"
                    aria-hidden
                    style={{ display: loading ? "inline-block" : "none" }}
                  >
                    ⟲
                  </span>
                </button>

                <div className="text-center mt-3">
                  <Link className="small text-muted" to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>

                <p className="text-center small text-muted mt-3 mb-0">
                  © {new Date().getFullYear()} ISAR
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="split-glow d-none d-lg-block" aria-hidden="true"></div>
      </div>
    </main>
  );
}
