import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linksApi, suppliersApi } from '../lib/api';
import { LinkStatus } from '../models/enums';

const SupplierLinkPage = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ['links'],
    queryFn: () => linksApi.getMyLinks(),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAllSuppliers(),
  });

  const requestLinkMutation = useMutation({
    mutationFn: (supplierId: number) => linksApi.requestLink(supplierId),
    onSuccess: () => {
      setShowRequestForm(false);
      setSupplierId('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to request supplier link');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(supplierId);
    if (isNaN(id) || id <= 0) {
      setError('Please enter a valid supplier ID');
      return;
    }
    setError('');
    requestLinkMutation.mutate(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case LinkStatus.APPROVED:
        return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
      case LinkStatus.PENDING:
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case LinkStatus.REJECTED:
        return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
      case LinkStatus.BLOCKED:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
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
            marginBottom: '0.5rem'
          }}>
            Supplier Links
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Manage your supplier connections
          </p>
        </div>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          {showRequestForm ? 'Cancel' : 'Request New Link'}
        </button>
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Request Supplier Link
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
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Select Supplier
              </label>
              {suppliers && suppliers.length > 0 ? (
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Choose a supplier...</option>
                  {suppliers.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} (ID: {supplier.id})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}>
                  No suppliers available yet. Please contact admin.
                </div>
              )}
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                Contact your supplier to get their ID
              </p>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={requestLinkMutation.isPending}
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#ffffff',
                backgroundColor: '#4CAF50',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: requestLinkMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: requestLinkMutation.isPending ? 0.5 : 1
              }}
            >
              {requestLinkMutation.isPending ? 'Requesting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {/* Links List */}
      {links && links.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {links.map((link: any) => {
            const statusStyle = getStatusColor(link.status);
            return (
              <div
                key={link.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '0.25rem'
                    }}>
                      {link.supplier?.name || `Supplier #${link.supplier_id}`}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Requested: {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    borderRadius: '9999px'
                  }}>
                    {link.status}
                  </span>
                </div>

                {link.status === LinkStatus.APPROVED && (
                  <a
                    href={`/products/${link.supplier_id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#4CAF50',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #4CAF50',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Browse Products
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            🔗
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            No supplier links yet
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            Request your first supplier link to start ordering
          </p>
          <button
            onClick={() => setShowRequestForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Request Supplier Link
          </button>
        </div>
      )}
    </div>
  );
};

export default SupplierLinkPage;
