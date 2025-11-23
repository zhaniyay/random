import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

const DebugPage = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/docs');
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const runTest = async (name: string, fn: () => Promise<any>) => {
    const result: any = { name, status: 'running' };
    setTestResults(prev => [...prev, result]);
    
    try {
      const data = await fn();
      result.status = 'success';
      result.data = data;
    } catch (error: any) {
      result.status = 'error';
      result.error = error.response?.data?.detail || error.message;
    }
    
    setTestResults(prev => prev.map(r => r.name === name ? result : r));
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    // Test 1: Get my links
    await runTest('GET /links/my', async () => {
      const response = await api.get('/links/my');
      return response.data;
    });
    
    // Test 2: Get my orders
    await runTest('GET /orders/my', async () => {
      const response = await api.get('/orders/my');
      return response.data;
    });
    
    // Test 3: Get products (if we have a supplier link)
    await runTest('GET /products?supplier_id=1', async () => {
      const response = await api.get('/products?supplier_id=1&only_active=true');
      return response.data;
    });
  };

  return (
    <div style={{ maxWidth: '1200px', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '2rem' }}>
        🔍 Debug & Connection Test
      </h1>

      {/* Backend Status */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Backend Status
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 
              backendStatus === 'online' ? '#4CAF50' :
              backendStatus === 'offline' ? '#dc2626' : '#fbbf24'
          }} />
          <span style={{ fontWeight: '600' }}>
            {backendStatus === 'online' ? '✅ Backend Online' :
             backendStatus === 'offline' ? '❌ Backend Offline' : '⏳ Checking...'}
          </span>
          <span style={{ color: '#6b7280', marginLeft: '1rem' }}>
            http://localhost:8000
          </span>
        </div>
      </div>

      {/* Auth Status */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Authentication Status
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
          <strong>Authenticated:</strong>
          <span style={{ color: isAuthenticated ? '#4CAF50' : '#dc2626' }}>
            {isAuthenticated ? '✅ Yes' : '❌ No'}
          </span>
          
          <strong>User ID:</strong>
          <span>{user?.id || 'N/A'}</span>
          
          <strong>Email:</strong>
          <span>{user?.email || 'N/A'}</span>
          
          <strong>Role:</strong>
          <span>{user?.role || 'N/A'}</span>
          
          <strong>Consumer ID:</strong>
          <span>{user?.consumer_id || 'N/A'}</span>
          
          <strong>Token:</strong>
          <span style={{ 
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            wordBreak: 'break-all',
            color: '#6b7280'
          }}>
            {token ? `${token.substring(0, 50)}...` : 'No token'}
          </span>
        </div>
      </div>

      {/* LocalStorage */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          LocalStorage
        </h2>
        <pre style={{
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          overflow: 'auto'
        }}>
          {JSON.stringify({
            token: localStorage.getItem('token')?.substring(0, 50) + '...',
            user: localStorage.getItem('user'),
          }, null, 2)}
        </pre>
      </div>

      {/* API Tests */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            API Tests
          </h2>
          <button
            onClick={runAllTests}
            disabled={!isAuthenticated}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isAuthenticated ? '#4CAF50' : '#9ca3af',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isAuthenticated ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            Run Tests
          </button>
        </div>

        {testResults.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Click "Run Tests" to check API connectivity</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {result.status === 'success' && <span>✅</span>}
                  {result.status === 'error' && <span>❌</span>}
                  {result.status === 'running' && <span>⏳</span>}
                  <strong>{result.name}</strong>
                </div>
                
                {result.status === 'success' && (
                  <pre style={{
                    fontSize: '0.75rem',
                    color: '#065f46',
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
                
                {result.status === 'error' && (
                  <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#fffbeb',
        border: '1px solid #fbbf24',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          💡 Troubleshooting
        </h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Backend Offline?</strong> Run: <code>uvicorn app.main:app --reload</code></li>
          <li><strong>Not Authenticated?</strong> Go to <a href="/login" style={{ color: '#4CAF50' }}>Login Page</a></li>
          <li><strong>403 Forbidden on products?</strong> Need to approve supplier link first!</li>
          <li><strong>Enum errors?</strong> Run: <code>alembic upgrade head</code></li>
        </ul>
      </div>
    </div>
  );
};

export default DebugPage;

