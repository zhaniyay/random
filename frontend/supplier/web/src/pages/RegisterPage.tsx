import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle } from 'lucide-react';
import { Button, Input, Label } from '../components/ui';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    supplierName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'OWNER' as 'OWNER' | 'MANAGER' | 'SALES',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        supplier_name: formData.supplierName,
        role: formData.role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            Create supplier account
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
            <Label htmlFor="supplierName" style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
              Supplier/Company Name
            </Label>
            <Input
              id="supplierName"
              name="supplierName"
              type="text"
              placeholder="ABC Wholesale Ltd."
              style={{ height: '3rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb', padding: '0.75rem 1rem', fontSize: '1rem', border: '1px solid #e5e7eb', outline: 'none' }}
              value={formData.supplierName}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="email" style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
              Work email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              style={{ height: '3rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb', padding: '0.75rem 1rem', fontSize: '1rem', border: '1px solid #e5e7eb', outline: 'none' }}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Info box about OWNER-only registration */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            <strong>Note:</strong> Only the business OWNER can register a new supplier account. 
            MANAGER and SALES accounts must be created by the OWNER through the Staff Management page after registration.
          </div>

          <input
            type="hidden"
            name="role"
            value="OWNER"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="password" style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                style={{ height: '3rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb', padding: '0.75rem 1rem', fontSize: '1rem', border: '1px solid #e5e7eb', outline: 'none' }}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="confirmPassword" style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                style={{ height: '3rem', borderRadius: '0.75rem', backgroundColor: '#f9fafb', padding: '0.75rem 1rem', fontSize: '1rem', border: '1px solid #e5e7eb', outline: 'none' }}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', height: '3rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600, backgroundColor: '#4CAF50', color: '#ffffff', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{ fontSize: '1rem', color: '#1a1a1a', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#4CAF50')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#1a1a1a')}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

