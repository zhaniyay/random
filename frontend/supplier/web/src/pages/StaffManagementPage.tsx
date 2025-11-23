import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Users, Plus, Trash2, AlertCircle, Mail, Shield } from 'lucide-react';

interface StaffUser {
  id: number;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'SALES';
  supplier_id: number;
}

const StaffManagementPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'MANAGER' as 'MANAGER' | 'SALES',
  });

  // Fetch staff list
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await api.get('/users/staff');
      return response.data as StaffUser[];
    },
    enabled: user?.role === 'OWNER',
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/users/staff', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowCreateForm(false);
      setFormData({ email: '', password: '', role: 'MANAGER' });
      alert('Staff member created successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to create staff member');
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/users/staff/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      alert('Staff member deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to delete staff member');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }
    createStaffMutation.mutate(formData);
  };

  const handleDelete = (userId: number, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete ${userEmail}?`)) {
      deleteStaffMutation.mutate(userId);
    }
  };

  // Only OWNER can access this page
  if (user?.role !== 'OWNER') {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        color: '#991b1b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <AlertCircle style={{ height: '1.5rem', width: '1.5rem', flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: 0, fontWeight: '600', fontSize: '1rem' }}>Access Denied</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Only the OWNER can access staff management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Users style={{ height: '2rem', width: '2rem' }} />
            Team Management
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
            Manage MANAGER and SALES accounts for your supplier
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <Plus style={{ height: '1rem', width: '1rem' }} />
          {showCreateForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {/* Info Box */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#dbeafe',
        border: '1px solid #93c5fd',
        borderRadius: '0.75rem',
        fontSize: '0.875rem',
        color: '#1e40af'
      }}>
        <strong>Note:</strong> Only OWNER accounts can create MANAGER and SALES users. 
        MANAGER and SALES cannot self-register or manage other staff members.
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '1.5rem'
          }}>
            Create New Staff Member
          </h3>
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@company.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Strong password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'MANAGER' | 'SALES' })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="MANAGER">MANAGER - Can manage products, orders, complaints</option>
                <option value="SALES">SALES - Can handle orders, messages, first-line complaints</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={createStaffMutation.isPending}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  backgroundColor: '#4CAF50',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: createStaffMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: createStaffMutation.isPending ? 0.6 : 1
                }}
              >
                {createStaffMutation.isPending ? 'Creating...' : 'Create Staff Member'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>
            Staff Members ({staff?.length || 0})
          </h3>
        </div>

        {isLoading ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading staff...
          </div>
        ) : staff && staff.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {staff.map((member) => {
              const roleColors = {
                OWNER: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
                MANAGER: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
                SALES: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
              };
              const roleStyle = roleColors[member.role];
              const isCurrentUser = member.id === user.id;
              const canDelete = !isCurrentUser && member.role !== 'OWNER';

              return (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.5rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: roleStyle.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {member.role === 'OWNER' ? (
                        <Shield style={{ width: '1.5rem', height: '1.5rem', color: roleStyle.color }} />
                      ) : (
                        <Users style={{ width: '1.5rem', height: '1.5rem', color: roleStyle.color }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>
                          {member.email}
                        </h4>
                        {isCurrentUser && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#6b7280',
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.25rem'
                          }}>
                            You
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        User ID: {member.id}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: roleStyle.color,
                      backgroundColor: roleStyle.bg,
                      border: `1px solid ${roleStyle.border}`,
                      borderRadius: '9999px'
                    }}>
                      {member.role}
                    </span>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(member.id, member.email)}
                        disabled={deleteStaffMutation.isPending}
                        title="Delete staff member"
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem',
                          cursor: deleteStaffMutation.isPending ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Users style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              No staff members yet. Click "Add Staff" to create MANAGER or SALES accounts.
            </p>
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '1rem'
        }}>
          Role Descriptions
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div>
            <strong style={{ color: '#92400e' }}>OWNER:</strong>
            <span style={{ color: '#6b7280' }}> Full control - Manage staff, products, orders, and all complaints</span>
          </div>
          <div>
            <strong style={{ color: '#1e40af' }}>MANAGER:</strong>
            <span style={{ color: '#6b7280' }}> Business operations - Manage products, orders, assign and resolve all complaints</span>
          </div>
          <div>
            <strong style={{ color: '#065f46' }}>SALES:</strong>
            <span style={{ color: '#6b7280' }}> Customer service - Process orders, handle messages, resolve first-line complaints</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagementPage;
