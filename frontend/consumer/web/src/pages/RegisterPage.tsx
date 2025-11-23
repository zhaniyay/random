import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    consumerName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        consumer_name: formData.consumerName,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            Create your account
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
            <label htmlFor="consumerName" style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              Full name
            </label>
            <input
              id="consumerName"
              name="consumerName"
              type="text"
              placeholder="Sarah Nguyen"
              value={formData.consumerName}
              onChange={handleChange}
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
            <label htmlFor="email" style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
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
            <label htmlFor="confirmPassword" style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            disabled={isLoading}
            style={{
              width: '100%',
              height: '3rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Creating account…' : 'Get started'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              fontSize: '1rem',
              color: '#1a1a1a',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
