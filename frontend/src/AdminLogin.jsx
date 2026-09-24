import { useState } from "react";
import axios from "axios";
import "./AdminLogin.css";

const API_URL = "http://localhost:5000";

function AdminLogin({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // ADMIN LOGIN
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        formData,
        {
          withCredentials: true,
        }
      );

      console.log(
        "Admin login successful:",
        response.data
      );

      localStorage.setItem(
        "adminLoggedIn",
        "true"
      );

      onLogin();
    } catch (error) {
      console.error(
        "Admin login error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEND PASSWORD RESET CODE
  // ==========================================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      setForgotLoading(true);
      setForgotMessage("");

      const response = await axios.post(
        `${API_URL}/auth/forgot-password`,
        {
          email: forgotEmail,
        }
      );

      setForgotMessage(
        response.data.message ||
          "A verification code has been sent to your email."
      );

      // Go to the reset password page
      // after the code has been sent.
      setTimeout(() => {
        window.location.href =
          "/admin/reset-password";
      }, 1000);

    } catch (error) {
      console.error(
        "Forgot password error:",
        error.response?.data || error.message
      );

      setForgotMessage(
        error.response?.data?.message ||
          "Unable to send verification code."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        {!showForgotPassword ? (
          <>
            <div className="admin-login-header">
              <p>RESTAURANT ADMIN</p>

              <h1>Welcome Back</h1>

              <span>
                Sign in to manage your restaurant.
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter admin email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label>Password</label>

              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                >
                  <span
                    className={`password-eye${
                      showPassword ? " is-visible" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <span className="password-eye-pupil" />
                  </span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>

            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setShowForgotPassword(true);
                setForgotMessage("");
              }}
            >
              Forgot Password?
            </button>
          </>
        ) : (
          <>
            <div className="admin-login-header">
              <p>RESTAURANT ADMIN</p>

              <h1>Forgot Password</h1>

              <span>
                Enter your admin email and we'll
                send you a 6-digit verification code.
              </span>
            </div>

            <form onSubmit={handleForgotPassword}>
              <label htmlFor="forgot-email">
                Email Address
              </label>

              <input
                id="forgot-email"
                type="email"
                placeholder="Enter admin email"
                value={forgotEmail}
                onChange={(e) =>
                  setForgotEmail(e.target.value)
                }
                required
              />

              <button
                type="submit"
                disabled={forgotLoading}
              >
                {forgotLoading
                  ? "Sending Code..."
                  : "Send Verification Code"}
              </button>
            </form>

            {forgotMessage && (
              <p className="forgot-message">
                {forgotMessage}
              </p>
            )}

            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotMessage("");
              }}
            >
              ← Back to Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default AdminLogin;