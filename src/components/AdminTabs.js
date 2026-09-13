import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAdminStats from '../hooks/useAdminStats';
import './AdminTabs.css';

const AdminTabs = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  // The counts live on the menu items they belong to — "Orders 214" says the
  // same thing a card saying "Total Orders 214" did, without a row of tiles
  // pushing the day's work below the fold. Admin only; the endpoint is too.
  const { stats } = useAdminStats(isAdmin);

  // Store managers get Orders + Leads; admins get everything; only super admins
  // get Reports (financial data).
  const tabs = [
    {
      to: '/admin', label: 'Orders', end: true, tint: '#3b82f6',
      count: stats?.activeOrders ?? stats?.totalOrders,
      of: stats?.activeOrders !== undefined ? stats?.totalOrders : undefined,
      title: stats?.activeOrders !== undefined
        ? `${stats.activeOrders} awaiting action of ${stats.totalOrders} orders in total`
        : undefined,
    },
    { to: '/admin/leads', label: 'Leads' },
  ];
  if (isAdmin) {
    tabs.push(
      { to: '/admin/products', label: 'Products', count: stats?.totalProducts, tint: '#8b5cf6' },
      { to: '/admin/coupons', label: 'Coupons', count: stats?.totalCoupons, tint: '#0ea5e9', title: 'Active coupons' },
      { to: '/admin/combos', label: 'Combos', count: stats?.totalCombos, tint: '#14b8a6', title: 'Active combos' },
      { to: '/admin/stores', label: 'Stores', count: stats?.totalStores, tint: '#ef4444', title: 'Open stores' },
      { to: '/admin/customers', label: 'Customers', count: stats?.totalUsers, tint: '#f59e0b', title: 'Registered customers' },
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
          title={t.title}
        >
          {t.label}
          {/* Zero is a real answer and worth showing; undefined means the
              numbers have not arrived, and a flash of "0" would be a lie. */}
          {t.count !== undefined && t.count !== null && (
            <span className="admin-tab-count" style={{ '--tint': t.tint }}>
              {Number(t.count).toLocaleString('en-IN')}
              {t.of !== undefined && t.of !== null && (
                <span className="admin-tab-of">/{Number(t.of).toLocaleString('en-IN')}</span>
              )}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminTabs;
