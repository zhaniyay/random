import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import { ShoppingCart, Package, AlertCircle } from 'lucide-react';
import type { ProductOut } from '../types/api';

const ProductsPage = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { addItem, getItemCount } = useCartStore();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', supplierId],
    queryFn: () => productsApi.getProducts(parseInt(supplierId!)),
    enabled: !!supplierId,
  });

  const handleQuantityChange = (productId: number, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }));
  };

  const handleAddToCart = (product: ProductOut) => {
    const quantity = quantities[product.id] || product.moq;
    if (quantity > 0 && quantity <= product.stock) {
      addItem(product.id, quantity, product);
      setQuantities(prev => ({
        ...prev,
        [product.id]: product.moq, // Reset to MOQ after adding
      }));
      // Visual feedback
      alert(`✅ Added ${quantity} ${product.unit} of ${product.name} to cart!`);
    }
  };

  const cartItemCount = getItemCount();

  if (!supplierId) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#6b7280' }}>Invalid supplier ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading products...</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle style={{ height: '1.25rem', width: '1.25rem', flexShrink: 0 }} />
          <p>Failed to load products. Please try again later.</p>
        </div>
      </div>
    );
  }

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
            Products from Supplier #{supplierId}
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Browse and add products to your cart
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/create-order')}
            disabled={cartItemCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: cartItemCount === 0 ? '#9ca3af' : '#4CAF50',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: cartItemCount === 0 ? 'not-allowed' : 'pointer',
              opacity: cartItemCount === 0 ? 0.5 : 1
            }}
          >
            <ShoppingCart style={{ height: '1.125rem', width: '1.125rem' }} />
            View Cart ({cartItemCount})
          </button>
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
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {products.map((product: ProductOut) => (
            <div
              key={product.id}
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
              {/* Product Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: '0.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  flex: '1 1 0%'
                }}>
                  {product.name}
                </h3>
              </div>

              {/* Product Details */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Unit:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a1a1a' }}>{product.unit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>MOQ:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a1a1a' }}>{product.moq}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Stock:</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: product.stock > 0 ? '#065f46' : '#991b1b'
                  }}>
                    {product.stock}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#4CAF50',
                paddingTop: '0.5rem'
              }}>
                ${Number(product.price).toFixed(2)}
              </div>

              {/* Add to Cart Section */}
              {product.stock > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <div>
                    <label
                      htmlFor={`quantity-${product.id}`}
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      id={`quantity-${product.id}`}
                      min={product.moq}
                      max={product.stock}
                      value={quantities[product.id] || product.moq}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        outline: 'none'
                      }}
                    />
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      Min: {product.moq}, Max: {product.stock}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={(quantities[product.id] || product.moq) < product.moq ||
                             (quantities[product.id] || product.moq) > product.stock}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#ffffff',
                      backgroundColor: '#4CAF50',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      opacity: ((quantities[product.id] || product.moq) < product.moq ||
                               (quantities[product.id] || product.moq) > product.stock) ? 0.5 : 1
                    }}
                  >
                    <ShoppingCart style={{ height: '1rem', width: '1rem' }} />
                    Add to Cart
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#6b7280'
                }}>
                  {product.stock === 0 ? 'Out of Stock' : 'Not Available'}
                </div>
              )}
            </div>
          ))}
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
            📦
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            No products found
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            This supplier doesn't have any active products available.
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
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Floating Cart Summary */}
      {cartItemCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          backgroundColor: '#4CAF50',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart style={{ height: '1.5rem', width: '1.5rem' }} />
              <span style={{ fontWeight: '600', fontSize: '1rem' }}>{cartItemCount} items in cart</span>
            </div>
            <button
              onClick={() => navigate('/create-order')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#4CAF50',
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
