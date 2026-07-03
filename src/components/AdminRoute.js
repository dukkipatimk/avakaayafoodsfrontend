import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// `roles` — which roles may view the wrapped page. Defaults to admin-only.
// Store managers are granted access only to pages that explicitly list them.
const AdminRoute = ({ children, roles = ['admin'] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  // super_admin is the highest role — it may view any admin page regardless of
  // the page's explicit `roles` list.
  if (!user || (user.role !== 'super_admin' && !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
