import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import { ShoppingCart, Trash2, AlertCircle, Package } from 'lucide-react';
import type { OrderItemCreateIn } from '../types/api';

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, supplierId, clearCart, updateQuantity, removeItem, getTotal } = useCartStore();
  const [comment, setComment] = useState('');

  const createOrderMutation = useMutation({
    mutationFn: (data: { supplier_id: number; items: OrderItemCreateIn[]; comment?: string }) =>
      ordersApi.createOrder(data),
    onSuccess: (order) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${order.id}`);
    },
    onError: (error: any) => {
      console.error('Failed to create order:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to create order';
      alert(`❌ Error: ${errorMsg}\n\nPlease check:\n- Link is approved\n- Products are in stock\n- Quantities meet MOQ requirements`);
    },
  });

  const handleQuantityChange = (productId: number, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
  };

  const handleCreateOrder = () => {
    if (!supplierId || items.length === 0) return;

    const orderItems: OrderItemCreateIn[] = items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    createOrderMutation.mutate({
      supplier_id: supplierId,
      items: orderItems,
      comment: comment.trim() || undefined,
    });
  };

  if (items.length === 0) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          🛒
        </div>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '0.5rem'
        }}>
          Your cart is empty
        </h3>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '1.5rem'
        }}>
          Add some products to get started with your order.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
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
          Browse Products
        </button>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
            Create Order
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Review your cart and place your order with Supplier #{supplierId}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#374151',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Continue Shopping
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem'
      }}>
        {/* Cart Items */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShoppingCart style={{ height: '1.25rem', width: '1.25rem' }} />
              Cart Items ({items.length})
            </h2>
          </div>

          <div>
            {items.map((item, index) => (
              <div
                key={item.product_id}
                style={{
                  padding: '1.5rem',
                  borderBottom: index < items.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '1 1 0%', minWidth: '200px' }}>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '0.5rem'
                    }}>
                      {item.product.name}
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Unit: {item.product.unit} • MOQ: {item.product.moq} • ${Number(item.product.price).toFixed(2)} each
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label
                        htmlFor={`quantity-${item.product_id}`}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280'
                        }}
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        id={`quantity-${item.product_id}`}
                        min={item.product.moq}
                        max={item.product.stock}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 0)}
                        style={{
                          width: '80px',
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.25rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6b7280'
                      }}>
                        Subtotal
                      </span>
                      <span style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#1a1a1a'
                      }}>
                        ${(item.quantity * Number(item.product.price)).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      style={{
                        padding: '0.5rem',
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove item"
                    >
                      <Trash2 style={{ height: '1.25rem', width: '1.25rem' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
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
            marginBottom: '1rem'
          }}>
            Order Summary
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Items ({items.length})</span>
              <span style={{ fontSize: '0.875rem', color: '#1a1a1a' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{
            paddingTop: '1rem',
            borderTop: '2px solid #e5e7eb',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1a1a1a' }}>Total</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4CAF50' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="comment"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}
            >
              Order Comment (Optional)
            </label>
            <textarea
              id="comment"
              rows={3}
              placeholder="Add any special instructions or comments for this order..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Error Message */}
          {createOrderMutation.isError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle style={{ height: '1rem', width: '1rem', color: '#dc2626', flexShrink: 0 }} />
              <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                Failed to create order. Please check your cart and try again.
              </p>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handleCreateOrder}
            disabled={createOrderMutation.isPending}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: createOrderMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: createOrderMutation.isPending ? 0.6 : 1
            }}
          >
            {createOrderMutation.isPending ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating Order...
              </>
            ) : (
              <>
                <Package style={{ height: '1.25rem', width: '1.25rem' }} />
                Place Order - ${total.toFixed(2)}
              </>
            )}
          </button>
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

export default CreateOrderPage;
