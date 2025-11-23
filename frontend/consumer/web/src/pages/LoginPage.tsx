import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../stores/authStore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: '600',
            color: '#4CAF50',
            marginBottom: '0.5rem'
          }}>
            SupplierConnect
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#6b7280'
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '0.5rem',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="email" style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                height: '3rem',
                padding: '0 1rem',
                fontSize: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                backgroundColor: '#f9fafb',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="password" style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                height: '3rem',
                padding: '0 1rem',
                fontSize: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                backgroundColor: '#f9fafb',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            style={{
              width: '100%',
              height: '3rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer',
              opacity: isLoading || !email || !password ? 0.5 : 1
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/register"
            style={{
              fontSize: '1rem',
              color: '#1a1a1a',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
