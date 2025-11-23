import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linksApi } from '../lib/api';
import { LinkStatus } from '../models/enums';
import { Check, X, Ban, AlertCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const LinksPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Check if user can manage links (OWNER or MANAGER only)
  const canManageLinks = user?.role === 'OWNER' || user?.role === 'MANAGER';
  // Only OWNER can delete consumers
  const isOwner = user?.role === 'OWNER';

  const { data: links, isLoading, error } = useQuery({
    queryKey: ['all-links'],
    queryFn: () => linksApi.getAllLinks(), // Fetch all links, not just pending
  });

  const approveMutation = useMutation({
    mutationFn: (linkId: number) => linksApi.approveLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-links'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (linkId: number) => linksApi.rejectLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-links'] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: (linkId: number) => linksApi.blockLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-links'] });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: number) => linksApi.deleteLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-links'] });
      alert('Link removed successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to remove link';
      alert(errorMessage);
    },
  });

  const handleApprove = (linkId: number) => {
    if (window.confirm('Approve this link request? The consumer will be able to view your products.')) {
      approveMutation.mutate(linkId);
    }
  };

  const handleReject = (linkId: number) => {
    if (window.confirm('Reject this link request?')) {
      rejectMutation.mutate(linkId);
    }
  };

  const handleBlock = (linkId: number) => {
    if (window.confirm('Block this consumer? They will not be able to send new requests.')) {
      blockMutation.mutate(linkId);
    }
  };

  const handleDeleteLink = (linkId: number, consumerName: string) => {
    if (window.confirm(
      `Remove link with "${consumerName}"?\n\n` +
      'This will disconnect the consumer from your supplier. ' +
      'They will no longer be able to view your products or place orders.\n\n' +
      'The consumer account will remain, but the connection will be removed.'
    )) {
      deleteLinkMutation.mutate(linkId);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        color: '#991b1b'
      }}>
        Failed to load link requests. Please try again later.
      </div>
    );
  }

  const pendingLinks = links?.filter((link: any) => link.status === LinkStatus.PENDING) || [];
  const processedLinks = links?.filter((link: any) => link.status !== LinkStatus.PENDING) || [];

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '0.5rem'
        }}>
          Consumer Link Requests
        </h1>
        <p style={{ fontSize: '1rem', color: '#6b7280' }}>
          {canManageLinks ? 'Manage requests from consumers who want to connect with your supplier' : 'View consumer link requests'}
        </p>
      </div>

      {/* Pending Requests */}
      {pendingLinks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '1rem'
          }}>
            Pending Requests ({pendingLinks.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {pendingLinks.map((link: any) => (
              <div
                key={link.id}
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
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
                      {link.consumer?.name || `Consumer #${link.consumer_id}`}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      ID: {link.consumer_id} • Requested: {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#92400e',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '9999px'
                  }}>
                    PENDING
                  </span>
                </div>

                {canManageLinks ? (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleApprove(link.id)}
                      disabled={approveMutation.isPending}
                      style={{
                        flex: '1 1 0%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        backgroundColor: '#4CAF50',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: approveMutation.isPending ? 'not-allowed' : 'pointer',
                        opacity: approveMutation.isPending ? 0.6 : 1
                      }}
                    >
                      <Check style={{ height: '1rem', width: '1rem' }} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(link.id)}
                      disabled={rejectMutation.isPending}
                      style={{
                        flex: '1 1 0%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        backgroundColor: '#dc2626',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: rejectMutation.isPending ? 'not-allowed' : 'pointer',
                        opacity: rejectMutation.isPending ? 0.6 : 1
                      }}
                    >
                      <X style={{ height: '1rem', width: '1rem' }} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleBlock(link.id)}
                      disabled={blockMutation.isPending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        cursor: blockMutation.isPending ? 'not-allowed' : 'pointer',
                        opacity: blockMutation.isPending ? 0.6 : 1
                      }}
                    >
                      <Ban style={{ height: '1rem', width: '1rem' }} />
                      Block
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                    Only Manager or Owner can manage link requests
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Links */}
      {processedLinks.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '1rem'
          }}>
            Processed Requests ({processedLinks.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {processedLinks.map((link: any) => {
              const statusColors: Record<string, any> = {
                APPROVED: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
                REJECTED: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
                BLOCKED: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' },
              };
              const statusStyle = statusColors[link.status] || statusColors.APPROVED;

              return (
                <div
                  key={link.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ flex: '1 1 0%' }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '0.25rem'
                      }}>
                        {link.consumer?.name || `Consumer #${link.consumer_id}`}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        ID: {link.consumer_id} • {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                      {isOwner && link.status === LinkStatus.APPROVED && (
                        <button
                          onClick={() => handleDeleteLink(link.id, link.consumer?.name || `Consumer #${link.consumer_id}`)}
                          disabled={deleteLinkMutation.isPending}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#dc2626',
                            backgroundColor: '#ffffff',
                            border: '1px solid #dc2626',
                            borderRadius: '0.5rem',
                            cursor: deleteLinkMutation.isPending ? 'not-allowed' : 'pointer',
                            opacity: deleteLinkMutation.isPending ? 0.6 : 1
                          }}
                          title="Remove link"
                        >
                          <Trash2 style={{ height: '1rem', width: '1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {links && links.length === 0 && (
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
            No link requests yet
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Consumers will send requests to connect with your supplier
          </p>
        </div>
      )}
    </div>
  );
};

export default LinksPage;

