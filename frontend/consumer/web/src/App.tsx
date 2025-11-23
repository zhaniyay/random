import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SupplierLinkPage from './pages/SupplierLinkPage';
import ProductsPage from './pages/ProductsPage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import DebugPage from './pages/DebugPage';
import Layout from './components/Layout';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Auth Route component (redirects to dashboard if already authenticated)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="supplier-link" element={<SupplierLinkPage />} />
          <Route path="products/:supplierId" element={<ProductsPage />} />
          <Route path="create-order" element={<CreateOrderPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="debug" element={<DebugPage />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
  );
}

export default App;
