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

  // Grouped by what each destination is FOR — today's work, the catalogue, the
  // shop and its people — because nine items in one flat row read as a list to
  // search rather than a place you know your way around. `group` only draws a
  // divider where the subject changes; it is not a heading anyone must read.
  //
  // Store managers get Orders + Leads; admins get everything; only super admins
  // get Reports (financial data).
  const tabs = [
    {
      to: '/admin', label: 'Orders', end: true, group: 'work',
      count: stats?.activeOrders ?? stats?.totalOrders,
      of: stats?.activeOrders !== undefined ? stats?.totalOrders : undefined,
      // The one count that is work waiting rather than a stock take, so it is
      // the one that gets filled in. Everything else is inventory.
      work: stats?.activeOrders !== undefined,
      title: stats?.activeOrders !== undefined
        ? `${stats.activeOrders} awaiting action of ${stats.totalOrders} orders in total`
        : undefined,
    },
    { to: '/admin/leads', label: 'Leads', group: 'work' },
  ];
  if (isAdmin) {
    tabs.push(
      { to: '/admin/products', label: 'Products', group: 'catalogue', count: stats?.totalProducts, title: 'Products listed' },
      { to: '/admin/combos', label: 'Combos', group: 'catalogue', count: stats?.totalCombos, title: 'Active combos' },
      { to: '/admin/coupons', label: 'Coupons', group: 'catalogue', count: stats?.totalCoupons, title: 'Active coupons' },
      { to: '/admin/stores', label: 'Stores', group: 'shop', count: stats?.totalStores, title: 'Open stores' },
      { to: '/admin/customers', label: 'Customers', group: 'shop', count: stats?.totalUsers, title: 'Registered customers' },
      { to: '/admin/users', label: 'Users', group: 'shop' },
    );
  }
  if (isSuperAdmin) {
    tabs.push({ to: '/admin/reports', label: 'Reports', group: 'reports' });
  }

  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      {tabs.map((t, i) => (
        <React.Fragment key={t.to}>
          {i > 0 && tabs[i - 1].group !== t.group && <span className="admin-tabs-sep" aria-hidden="true" />}
          <NavLink
            to={t.to}
            end={t.end}
            className={({ isActive }) => `admin-tab${isActive ? ' active' : ''}`}
            title={t.title}
          >
            {t.label}
            {/* Zero is a real answer and worth showing; undefined means the
                numbers have not arrived, and a flash of "0" would be a lie. */}
            {t.count !== undefined && t.count !== null && (
              <span className={`admin-tab-count${t.work ? ' admin-tab-count--work' : ''}`}>
                {Number(t.count).toLocaleString('en-IN')}
                {t.of !== undefined && t.of !== null && (
                  <span className="admin-tab-of">/{Number(t.of).toLocaleString('en-IN')}</span>
                )}
              </span>
            )}
          </NavLink>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default AdminTabs;
