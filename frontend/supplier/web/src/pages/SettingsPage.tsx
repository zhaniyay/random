import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { suppliersApi } from '../lib/api';
import { Button } from '../components/ui';
import { Trash2, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (user?.role !== 'OWNER') {
      alert('Only OWNER can delete the supplier account');
      return;
    }

    setIsDeleting(true);
    try {
      await suppliersApi.deleteAccount();
      alert('Account deleted successfully');
      await logout();
      navigate('/login');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
      setConfirmText('');
    }
  };

  if (user?.role !== 'OWNER') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#fff', 
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '1rem' }}>
            Account Settings
          </h2>
          <p style={{ color: '#6b7280' }}>
            Only the account owner can manage account settings and delete the supplier account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#fff', 
        borderRadius: '0.5rem', 
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '1.5rem' }}>
          Account Settings
        </h2>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '0.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle style={{ height: '1.25rem', width: '1.25rem', color: '#dc2626' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#dc2626' }}>
              Danger Zone
            </h3>
          </div>

          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
            Deleting your supplier account will permanently remove:
          </p>
          <ul style={{ color: '#991b1b', marginLeft: '1.5rem', marginBottom: '1rem', listStyle: 'disc' }}>
            <li>All staff accounts (OWNER, MANAGER, SALES)</li>
            <li>All links with consumers</li>
            <li>All products</li>
            <li>All orders and order history</li>
            <li>All complaints</li>
            <li>All messages</li>
          </ul>

          <p style={{ color: '#991b1b', marginBottom: '1rem', fontWeight: 600 }}>
            This action cannot be undone!
          </p>

          {!showConfirm ? (
            <Button
              onClick={() => setShowConfirm(true)}
              variant="danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              <Trash2 style={{ height: '1rem', width: '1rem' }} />
              Delete Supplier Account
            </Button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#991b1b', fontWeight: 500 }}>
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #fecaca',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmText !== 'DELETE'}
                  variant="danger"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: confirmText === 'DELETE' ? '#dc2626' : '#9ca3af',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: confirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                    fontWeight: 500,
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText('');
                  }}
                  variant="ghost"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

