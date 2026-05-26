import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import './AdminLeads.css';

const FILTERS = ['actionable', 'abandoned', 'hot', 'active', 'converted', 'dismissed', 'all'];

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
const dateTime = (value) => value
  ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : '-';
const locationText = (lead) => [lead.city, lead.region, lead.country].filter(Boolean).join(', ') || 'Unknown';

const CartDetails = ({ items }) => {
  const hamperNotes = items.reduce((groups, item) => {
    if (item.bundleType === 'hamper' && item.bundleId && !groups[item.bundleId]) {
      groups[item.bundleId] = item.customization || {};
    }
    return groups;
  }, {});

  return (
    <div className="lead-cart-details">
      <h3>Cart Details</h3>
      <div className="lead-cart-table-wrap">
        <table className="lead-cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.productId || item.name}-${item.weight}-${item.bundleId || index}`}>
                <td>
                  <strong>{item.name || 'Product'}</strong>
                  <small>
                    {item.weight || '-'}
                    {typeof item.isVeg === 'boolean' ? ` | ${item.isVeg ? 'Veg' : 'Non-Veg'}` : ''}
                    {item.bundleType === 'hamper' ? ' | Custom Gift Hamper' : ''}
                  </small>
                </td>
                <td>{item.quantity || 1}</td>
                <td>{money(item.price)}</td>
                <td>{money((Number(item.price) || 0) * (Number(item.quantity) || 1))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {Object.entries(hamperNotes).map(([bundleId, notes]) => (
        <div className="lead-hamper-notes" key={bundleId}>
          <strong>Custom Hamper Instructions</strong>
          <span>Style: {notes.styleInstructions || 'Not provided'}</span>
          <span>Message card: {notes.personalMessage || 'Not provided'}</span>
        </div>
      ))}
    </div>
  );
};

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [eventSummary, setEventSummary] = useState([]);
  const [statusSummary, setStatusSummary] = useState([]);
  const [regionalPageViews, setRegionalPageViews] = useState([]);
  const [leadRegions, setLeadRegions] = useState([]);
  const [filter, setFilter] = useState('actionable');
  const [region, setRegion] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadLeads = async (selected = filter, selectedRegion = region) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: selected });
      if (selectedRegion !== 'all') params.set('region', selectedRegion);
      const res = await api.get(`/tracking/leads?${params}`);
      setLeads(res.data.leads || []);
      setEventSummary(res.data.eventSummary || []);
      setStatusSummary(res.data.statusSummary || []);
      setRegionalPageViews(res.data.regionalPageViews || []);
      setLeadRegions(res.data.leadRegions || []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads(filter, region);
  }, [filter, region]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (id, status) => {
    await api.patch(`/tracking/leads/${id}`, { status });
    loadLeads();
  };

  const summary = Object.fromEntries(eventSummary.map(event => [event.eventType, Number(event.count)]));
  const statuses = Object.fromEntries(statusSummary.map(status => [status.status, Number(status.count)]));

  return (
    <div className="admin-page leads-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Leads & Activity</h1>
            <p className="leads-intro">Visitors who reached cart or checkout, with abandoned-order follow-up alerts.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => loadLeads()}>Refresh Alerts</button>
        </div>

        <AdminTabs />

        <div className="leads-metrics">
          <div className="lead-metric"><strong>{summary.page_view || 0}</strong><span>Page Views</span></div>
          <div className="lead-metric"><strong>{summary.generic_click || 0}</strong><span>Clicks</span></div>
          <div className="lead-metric"><strong>{summary.add_to_cart || 0}</strong><span>Cart Adds</span></div>
          <div className="lead-metric"><strong>{summary.begin_checkout || 0}</strong><span>Checkout Starts</span></div>
          <div className="lead-metric alert"><strong>{statuses.abandoned || 0}</strong><span>Abandoned</span></div>
        </div>

        <div className="leads-toolbar">
          <label htmlFor="lead-filter">Show</label>
          <select id="lead-filter" value={filter} onChange={e => setFilter(e.target.value)}>
            {FILTERS.map(option => (
              <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
            ))}
          </select>
          <label htmlFor="lead-region">Region</label>
          <select id="lead-region" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="all">All regions</option>
            {leadRegions.map(item => (
              <option key={item.region} value={item.region}>
                {item.region}{item.country && item.country !== item.region ? `, ${item.country}` : ''} ({item.count})
              </option>
            ))}
          </select>
          <span className="lead-alert-note">Alerts are sent after checkout is inactive for the configured delay.</span>
        </div>

        <section className="lead-regions">
          <h2>Page Views by Region</h2>
          <div className="lead-region-grid">
            {regionalPageViews.map((item, index) => (
              <div className="lead-region-row" key={`${item.region || 'unknown'}-${item.country || index}`}>
                <span>{item.region || item.country || 'Unknown region'}</span>
                {item.country && item.country !== item.region && <small>{item.country}</small>}
                <strong>{Number(item.count) || 0}</strong>
              </div>
            ))}
            {regionalPageViews.length === 0 && <p>No regional page-view data collected yet.</p>}
          </div>
        </section>

        {loading ? (
          <div className="leads-loading"><div className="loading-spinner" /></div>
        ) : (
          <div className="lead-cards">
            {leads.map(lead => (
              <article className="lead-card" key={lead._id || lead.id}>
                <div className="lead-card-head">
                  <div>
                    <h2>{lead.name || lead.email || lead.phone || 'Anonymous visitor'}</h2>
                    <p>{lead.email || 'No email'} {lead.phone ? ` | ${lead.phone}` : ''}</p>
                  </div>
                  <span className={`lead-status status-${lead.status}`}>{lead.status}</span>
                </div>

                <div className="lead-facts">
                  <span><strong>{lead.score}</strong> Score</span>
                  <span><strong>{lead.stage}</strong> Stage</span>
                  <span><strong>{money(lead.cartValue)}</strong> Cart</span>
                  <span><strong>{lead.productViews}</strong> Views</span>
                  <span><strong>{lead.cartAdds}</strong> Adds</span>
                  <span><strong>{locationText(lead)}</strong> Region</span>
                  <span><strong>{lead.ipAddress || 'Unavailable'}</strong> IP Address</span>
                </div>

                {Array.isArray(lead.cartItems) && lead.cartItems.length > 0 && (
                  <CartDetails items={lead.cartItems} />
                )}

                <div className="lead-card-foot">
                  <span>Last activity: {dateTime(lead.lastEventAt)}</span>
                  {lead.order?.orderNumber && <span>Order: #{lead.order.orderNumber} ({lead.order.paymentStatus})</span>}
                  <div className="lead-actions">
                    {lead.status !== 'dismissed' && lead.status !== 'converted' && (
                      <button onClick={() => changeStatus(lead.id, 'dismissed')}>Dismiss</button>
                    )}
                    {lead.status === 'dismissed' && (
                      <button onClick={() => changeStatus(lead.id, 'hot')}>Reopen</button>
                    )}
                    {lead.phone && <a href={`tel:${lead.phone}`}>Call</a>}
                    {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                  </div>
                </div>
              </article>
            ))}
            {leads.length === 0 && <div className="leads-empty">No leads in this view.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;
