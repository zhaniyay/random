import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

import { useAuthStore } from "../stores/authStore";
import { Button, Input, Label } from "../components/ui";

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '28rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 600, color: '#4CAF50', marginBottom: '0.5rem' }}>
            SupplierConnect
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
            Supplier Portal - Sign in
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#dc2626' }}>
            <AlertCircle style={{ height: '1rem', width: '1rem', flexShrink: 0 }} />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="email" style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@supplier.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ height: '3rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb', padding: '0.75rem 1rem', fontSize: '1rem', border: '1px solid #e5e7eb', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="password" style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ height: '3rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb', padding: '0.75rem 1rem', fontSize: '1rem', border: '1px solid #e5e7eb', outline: 'none' }}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            style={{ width: '100%', height: '3rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, backgroundColor: '#4CAF50', color: '#ffffff', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', opacity: (isLoading || !email || !password) ? 0.6 : 1 }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/register"
            style={{ fontSize: '1rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#4CAF50')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#1a1a1a')}
          >
            Create supplier account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

