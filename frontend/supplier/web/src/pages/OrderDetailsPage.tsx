import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, messagesApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Package, Send, Check, X, AlertCircle, Paperclip, Download, FileText, Mic } from 'lucide-react';
import type { MessageOut } from '../types/api';
import { OrderStatus } from '../models/enums';
import type { OrderStatusType } from '../models/enums';

const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user can manage orders (OWNER or MANAGER only)
  const canManageOrders = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const { data: order, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(parseInt(orderId!)),
    enabled: !!orderId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => messagesApi.getMessages(undefined, parseInt(orderId!)),
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.rejectOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      messagesApi.createMessage({ body: message, order_id: parseInt(orderId!) }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
  });

  const sendFileMutation = useMutation({
    mutationFn: ({ file, messageType, body }: { file: File; messageType: 'IMAGE' | 'FILE' | 'AUDIO'; body?: string }) =>
      messagesApi.createMessageWithFile(file, {
        body,
        order_id: parseInt(orderId!),
        message_type: messageType,
      }),
    onSuccess: () => {
      setSelectedFile(null);
      setFilePreview(null);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAcceptOrder = () => {
    if (window.confirm('Accept this order? You commit to fulfilling it.')) {
      acceptOrderMutation.mutate(parseInt(orderId!));
    }
  };

  const handleRejectOrder = () => {
    if (window.confirm('Reject this order? The consumer will be notified.')) {
      rejectOrderMutation.mutate(parseInt(orderId!));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getMessageType = (file: File): 'IMAGE' | 'FILE' | 'AUDIO' => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'FILE';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFile) {
      // Send file message
      const messageType = getMessageType(selectedFile);
      sendFileMutation.mutate({
        file: selectedFile,
        messageType,
        body: newMessage.trim() || selectedFile.name,
      });
    } else if (newMessage.trim()) {
      // Send text message
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleDownloadFile = async (messageId: number, fileName: string) => {
    try {
      const response = await messagesApi.downloadFile(messageId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const getStatusColor = (status: OrderStatusType) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case OrderStatus.ACCEPTED:
        return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
      case OrderStatus.REJECTED:
        return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
      case OrderStatus.CANCELLED:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

  if (orderLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading order details...</div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        color: '#991b1b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <AlertCircle style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
        <p>Failed to load order details. Please try again later.</p>
      </div>
    );
  }

  const statusStyle = getStatusColor(order.status);

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            Order #{order.id}
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Consumer #{order.consumer_id} • Created {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: statusStyle.color,
            backgroundColor: statusStyle.bg,
            border: `1px solid ${statusStyle.border}`,
            borderRadius: '9999px'
          }}>
            {order.status}
          </span>
          {order.status === OrderStatus.PENDING && canManageOrders && (
            <>
              <button
                onClick={handleAcceptOrder}
                disabled={acceptOrderMutation.isPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  backgroundColor: '#4CAF50',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: acceptOrderMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: acceptOrderMutation.isPending ? 0.6 : 1
                }}
              >
                <Check style={{ height: '1rem', width: '1rem' }} />
                {acceptOrderMutation.isPending ? 'Accepting...' : 'Accept Order'}
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={rejectOrderMutation.isPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: rejectOrderMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: rejectOrderMutation.isPending ? 0.6 : 1
                }}
              >
                <X style={{ height: '1rem', width: '1rem' }} />
                {rejectOrderMutation.isPending ? 'Rejecting...' : 'Reject Order'}
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/orders')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Back to Orders
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Order Items */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Package style={{ height: '1.25rem', width: '1.25rem' }} />
              Order Items
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {order.items.map((item: any) => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div style={{ flex: '1 1 0%' }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '0.25rem'
                    }}>
                      Product #{item.product_id}
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Quantity: {item.quantity} • ${Number(item.price).toFixed(2)} each
                    </p>
                  </div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#1a1a1a'
                  }}>
                    ${Number(item.line_total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '2px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1a1a1a'
                }}>
                  Total
                </span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#4CAF50'
                }}>
                  ${Number(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            {order.comment && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '0.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#166534'
                }}>
                  <span style={{ fontWeight: '600' }}>Comment:</span> {order.comment}
                </p>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            height: '600px'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '0.25rem'
              }}>
                Messages
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Communicate with the consumer
              </p>
            </div>

            <div style={{
              flex: '1 1 0%',
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {messagesLoading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading messages...</div>
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message: MessageOut) => {
                  const isMine = message.sender_user_id === user?.id;
                  const isImage = message.message_type === 'IMAGE';
                  const isAudio = message.message_type === 'AUDIO';
                  const isFile = message.message_type === 'FILE';
                  
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        gap: '0.25rem'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280'
                        }}>
                          {isMine ? 'You' : `User #${message.sender_user_id}`}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{
                        maxWidth: isImage ? '90%' : '70%',
                        padding: (isImage || isAudio || isFile) ? '0.5rem' : '0.75rem 1rem',
                        backgroundColor: isMine ? '#4CAF50' : '#f3f4f6',
                        color: isMine ? '#ffffff' : '#1a1a1a',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                      }}>
                        {isImage && message.file_path ? (
                          <div>
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/messages/${message.id}/download`}
                              alt={message.file_name || 'Image'}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '300px',
                                borderRadius: '0.5rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleDownloadFile(message.id, message.file_name || 'image.jpg')}
                            />
                            {message.body && message.body !== message.file_name && (
                              <p style={{ marginTop: '0.5rem', padding: '0 0.5rem' }}>{message.body}</p>
                            )}
                          </div>
                        ) : isAudio && message.file_path ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
                            <audio
                              controls
                              style={{ width: '100%', maxWidth: '300px' }}
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/messages/${message.id}/download`}
                            />
                            {message.body && message.body !== message.file_name && (
                              <p style={{ margin: 0 }}>{message.body}</p>
                            )}
                          </div>
                        ) : isFile && message.file_path ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.5rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleDownloadFile(message.id, message.file_name || 'file')}
                          >
                            <FileText style={{ width: '2rem', height: '2rem', flexShrink: 0 }} />
                            <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {message.file_name || 'File attachment'}
                              </p>
                              {message.file_size && (
                                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>
                                  {(message.file_size / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                            <Download style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                          </div>
                        ) : (
                          message.body
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              {/* File Preview */}
              {selectedFile && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '0.375rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '0.375rem'
                    }}>
                      {selectedFile.type.startsWith('audio/') ? (
                        <Mic style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
                      ) : (
                        <FileText style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
                      )}
                    </div>
                  )}
                  <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    style={{
                      padding: '0.375rem',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X style={{ width: '1rem', height: '1rem', color: '#ffffff' }} />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  style={{ display: 'none' }}
                />
                
                {/* Attachment button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendMessageMutation.isPending || sendFileMutation.isPending}
                  title="Attach image or file"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Paperclip style={{ height: '1.25rem', width: '1.25rem', color: '#6b7280' }} />
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={selectedFile ? "Add a caption (optional)..." : "Type your message..."}
                  disabled={sendMessageMutation.isPending || sendFileMutation.isPending}
                  style={{
                    flex: '1 1 0%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || sendFileMutation.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    backgroundColor: '#4CAF50',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: ((!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || sendFileMutation.isPending) ? 'not-allowed' : 'pointer',
                    opacity: ((!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || sendFileMutation.isPending) ? 0.5 : 1
                  }}
                >
                  {(sendMessageMutation.isPending || sendFileMutation.isPending) ? (
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : (
                    <Send style={{ height: '1rem', width: '1rem' }} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OrderDetailsPage;
