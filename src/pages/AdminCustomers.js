import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import AdminCollectionFilters from '../components/AdminCollectionFilters';
import './AdminDashboard.css';
import './AdminCustomers.css';

const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');

  useEffect(() => {
    api.get('/admin/users?role=customer')
      .then(res => setCustomers(res.data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase();
  const filtered = customers.filter(c => {
    // isActive is the account switch, not email verification — a customer can
    // be verified and still be closed, so the two columns say different things.
    if (visibility === 'active' && c.isActive === false) return false;
    if (visibility === 'inactive' && c.isActive !== false) return false;
    return c.name?.toLowerCase().includes(q)
      || c.email?.toLowerCase().includes(q)
      || c.phone?.toLowerCase().includes(q);
  });

  return (
    <div className="admin-page admin-workspace">
      <div className="container">
        <AdminTabs />

        {/* The same bar as every other collection. No create button — customers
            arrive by shopping, not by being added here. */}
        <AdminCollectionFilters
          search={search} onSearch={setSearch}
          status={visibility} onStatus={setVisibility}
          count={filtered.length} noun="customers" loading={loading}
        />

        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Email Verified</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.name}</strong>
                      {/* Closed accounts sit in the same list; without this the
                          filter would hide rows for no visible reason. */}
                      {c.isActive === false && <span className="status-toggle inactive" title="Account closed — cannot sign in">Inactive</span>}
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <span className={`payment-status ${c.isEmailVerified ? 'paid' : 'pending'}`}>
                        {c.isEmailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="cell-date">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="table-empty">No customers found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
