import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import './AdminLeads.css';

const FILTERS = ['actionable', 'abandoned', 'hot', 'active', 'converted', 'dismissed', 'all'];

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
const dateTime = (value) => value
  ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : '-';

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [eventSummary, setEventSummary] = useState([]);
  const [statusSummary, setStatusSummary] = useState([]);
  const [filter, setFilter] = useState('actionable');
  const [loading, setLoading] = useState(true);

  const loadLeads = async (selected = filter) => {
    setLoading(true);
    try {
      const res = await api.get(`/tracking/leads?status=${selected}`);
      setLeads(res.data.leads || []);
      setEventSummary(res.data.eventSummary || []);
      setStatusSummary(res.data.statusSummary || []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads(filter);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <span className="lead-alert-note">Alerts are sent after checkout is inactive for the configured delay.</span>
        </div>

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
                </div>

                {Array.isArray(lead.cartItems) && lead.cartItems.length > 0 && (
                  <p className="lead-items">
                    {lead.cartItems.map(item => `${item.name || 'Product'} (${item.weight}) x${item.quantity}`).join(', ')}
                  </p>
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
