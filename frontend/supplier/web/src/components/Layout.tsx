import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  Package,
  Link2,
  ShoppingBag,
  FileWarning,
  AlertTriangle,
  LogOut,
  User,
  Users,
  Settings,
} from 'lucide-react';
import { Button } from './ui';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'SALES'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['OWNER', 'MANAGER', 'SALES'] },
  { name: 'Orders', href: '/orders', icon: ShoppingBag, roles: ['OWNER', 'MANAGER', 'SALES'] },
  { name: 'Link Requests', href: '/links', icon: Link2, roles: ['OWNER', 'MANAGER', 'SALES'] },
  { name: 'Complaints', href: '/complaints', icon: AlertTriangle, roles: ['OWNER', 'MANAGER', 'SALES'] },
  { name: 'Staff Management', href: '/staff', icon: Users, roles: ['OWNER'] },
];

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  
  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => 
    item.roles.includes(user?.role as string)
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ height: '2rem', width: '2rem', borderRadius: '0.5rem', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package style={{ height: '1.25rem', width: '1.25rem', color: '#4CAF50' }} />
          </div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#4CAF50' }}>SupplierConnect</h1>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginLeft: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
            SUPPLIER
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? '#4CAF50' : 'transparent',
                  color: isActive ? '#ffffff' : '#4a4a4a',
                  boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                  textDecoration: 'none',
                }}
              >
                <Icon style={{ height: '1rem', width: '1rem' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ height: '2.25rem', width: '2.25rem', borderRadius: '9999px', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ height: '1rem', width: '1rem', color: '#4CAF50' }} />
            </div>
            <div style={{ flex: '1 1 0%', minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user?.role}</p>
            </div>
            {user?.role === 'OWNER' && (
              <Link
                to="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: '2.25rem',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: location.pathname === '/settings' ? '#4CAF50' : '#6b7280',
                  transition: 'background-color 0.2s',
                  textDecoration: 'none',
                  backgroundColor: location.pathname === '/settings' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                }}
              >
                <Settings style={{ height: '1rem', width: '1rem' }} />
              </Link>
            )}
            <Button onClick={logout} variant="ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '2.25rem', padding: '0.5rem', borderRadius: '0.5rem', color: '#6b7280', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}>
              <LogOut style={{ height: '1rem', width: '1rem' }} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main style={{ flex: '1 1 0%', overflowY: 'auto', padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

