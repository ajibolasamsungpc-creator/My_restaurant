import { useState } from "react";
import axios from "axios";
import "./ResetPassword.css";

const API_URL = "http://localhost:5000";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/reset-password`,
        {
          email,
          code,
          password,
        }
      );

      setMessage(
        response.data.message ||
          "Password reset successfully."
      );

      setEmail("");
      setCode("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        window.location.href = "/admin";
      }, 1200);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">

        <div className="admin-login-header">
          <p>RESTAURANT ADMIN</p>

          <h1>Reset Password</h1>

          <span>
            Enter the verification code sent to your email
            and create a new password.
          </span>
        </div>

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}
          <label htmlFor="email">
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your admin email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          {/* VERIFICATION CODE */}
          <label htmlFor="code">
            Verification Code
          </label>

          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value.replace(/\D/g, "")
              )
            }
            required
          />

          {/* NEW PASSWORD */}
          <label htmlFor="password">
            New Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            minLength={6}
            required
          />

          {/* CONFIRM PASSWORD */}
          <label htmlFor="confirm-password">
            Confirm Password
          </label>

          <input
            id="confirm-password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            minLength={6}
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </form>

        {message && (
          <p className="forgot-message">
            {message}
          </p>
        )}

        {error && (
          <p className="forgot-message">
            {error}
          </p>
        )}

        <a
          className="forgot-password"
          href="/admin"
        >
          Back to Login
        </a>

      </section>
    </main>
  );
}

export default ResetPassword;