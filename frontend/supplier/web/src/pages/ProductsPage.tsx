import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Plus, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';
import type { ProductOut } from '../types/api';

const ProductsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Check if user can manage products (OWNER or MANAGER only)
  const canManageProducts = user?.role === 'OWNER' || user?.role === 'MANAGER';
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductOut | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
    moq: '',
    stock: '',
  });

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', user?.supplier_id],
    queryFn: () => productsApi.getMyProducts(user!.supplier_id),
    enabled: !!user?.supplier_id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('Product deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete product';
      alert(errorMessage);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      price: '',
      moq: '',
      stock: '',
    });
    setEditingProduct(null);
    setShowCreateForm(false);
  };

  const handleEdit = (product: ProductOut) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      unit: product.unit,
      price: product.price.toString(),
      moq: product.moq.toString(),
      stock: product.stock.toString(),
    });
    setShowCreateForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      unit: formData.unit,
      price: parseFloat(formData.price),
      moq: parseInt(formData.moq),
      stock: parseInt(formData.stock),
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Delete product "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
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
        color: '#991b1b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <AlertCircle style={{ height: '1.25rem', width: '1.25rem' }} />
        <p>Failed to load products. Please try again later.</p>
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
            Products
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            {canManageProducts ? 'Manage your product catalog' : 'View product catalog'}
          </p>
        </div>
        {canManageProducts && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(!showCreateForm);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
            <Plus style={{ height: '1.125rem', width: '1.125rem' }} />
            {showCreateForm ? 'Cancel' : 'Add Product'}
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
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
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
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
                Unit *
              </label>
              <input
                type="text"
                placeholder="e.g., kg, pcs, box"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
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
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
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
                MOQ (Minimum Order Quantity) *
              </label>
              <input
                type="number"
                value={formData.moq}
                onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
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
                Stock *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  outline: 'none'
                }}
              />
            </div>


            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={resetForm}
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  backgroundColor: '#4CAF50',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: (createMutation.isPending || updateMutation.isPending) ? 'not-allowed' : 'pointer',
                  opacity: (createMutation.isPending || updateMutation.isPending) ? 0.6 : 1
                }}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1a1a1a'
              }}>
                {product.name}
              </h3>

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

              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#4CAF50',
                paddingTop: '0.5rem'
              }}>
                ${Number(product.price).toFixed(2)}
              </div>

              {canManageProducts && (
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      flex: '1 1 0%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#4CAF50',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #4CAF50',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 style={{ height: '1rem', width: '1rem' }} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={deleteMutation.isPending}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#dc2626',
                      backgroundColor: '#ffffff',
                      border: '1px solid #dc2626',
                      borderRadius: '0.5rem',
                      cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                      opacity: deleteMutation.isPending ? 0.6 : 1
                    }}
                  >
                    <Trash2 style={{ height: '1rem', width: '1rem' }} />
                  </button>
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
            No products yet
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            {canManageProducts ? 'Create your first product to start selling' : 'No products available'}
          </p>
          {canManageProducts && (
            <button
              onClick={() => setShowCreateForm(true)}
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
              Add First Product
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;

