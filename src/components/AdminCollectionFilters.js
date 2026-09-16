import React from 'react';

// `action` is the page's primary button (+ New Combo, + Create Coupon…). It sits
// in this bar rather than a row of its own: one line of controls above the table
// instead of two, and the button is beside the search people came here to use.
export default function AdminCollectionFilters({ search, onSearch, status, onStatus, count, noun, loading, action }) {
  return <div className={`admin-collection-filters${action ? ' admin-collection-filters--with-action' : ''}`}>
    <label className="admin-collection-search">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
      <input type="search" aria-label={`Search ${noun}`} placeholder={`Search ${noun}…`} value={search} onChange={e => onSearch(e.target.value)} />
    </label>
    <label className="admin-collection-status">Visibility
      <select value={status} onChange={e => onStatus(e.target.value)}><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
    </label>
    {action && <div className="admin-collection-action">{action}</div>}
    <div className="admin-collection-results"><span role="status">{loading ? 'Loading…' : `${count} ${noun}`}</span>
      {(search || status !== 'all') && <button onClick={() => { onSearch(''); onStatus('all'); }}>Clear filters</button>}
    </div>
  </div>;
}
