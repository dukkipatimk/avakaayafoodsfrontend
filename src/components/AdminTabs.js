import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminTabs.css';

const AdminTabs = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Store managers get Orders + Leads; admins get everything; only super admins
  // get Reports (financial data).
  const tabs = [
    { to: '/admin', label: 'Orders', end: true },
    { to: '/admin/leads', label: 'Leads' },
  ];
  if (isAdmin) {
    tabs.push(
      { to: '/admin/products', label: 'Products' },
      { to: '/admin/coupons', label: 'Coupons' },
      { to: '/admin/combos', label: 'Combos' },
      { to: '/admin/stores', label: 'Stores' },
      { to: '/admin/customers', label: 'Customers' },
      { to: '/admin/users', label: 'Users' },
    );
  }
  if (isSuperAdmin) {
    tabs.push({ to: '/admin/reports', label: 'Reports' });
  }

  return (
    <nav className="admin-tabs">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `admin-tab${isActive ? ' active' : ''}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminTabs;
