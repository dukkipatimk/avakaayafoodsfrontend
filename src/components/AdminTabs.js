import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminTabs.css';

const AdminTabs = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Store managers only get the Orders tab; admins get everything.
  const tabs = [{ to: '/admin', label: 'Orders', end: true }];
  if (isAdmin) {
    tabs.push(
      { to: '/admin/products', label: 'Products' },
      { to: '/admin/customers', label: 'Customers' },
      { to: '/admin/users', label: 'Users' },
    );
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
