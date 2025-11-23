import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Supplier Links', href: '/supplier-link' },
  { name: 'Orders', href: '/orders' },
  { name: 'Complaints', href: '/complaints' },
];

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Top Navigation */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Left - Logo and Nav Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/dashboard"
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#4CAF50',
                textDecoration: 'none',
                padding: '1rem 0'
              }}
            >
              SupplierConnect
            </Link>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? '#ffffff' : '#6b7280',
                      backgroundColor: isActive ? '#4CAF50' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right - User Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{
              fontSize: '0.95rem',
              color: '#6b7280'
            }}>
              {user?.email}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: '#6b7280',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
