import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import './AdminLeads.css';

const FILTERS = ['actionable', 'abandoned', 'hot', 'active', 'converted', 'dismissed', 'all'];
const TREND_OPTIONS = [
  { value: 'daily', label: 'Daily', title: 'Last 30 Days' },
  { value: 'weekly', label: 'Weekly', title: 'Last 12 Weeks' },
  { value: 'monthly', label: 'Monthly', title: 'Last 12 Months' },
];

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
const dateTime = (value) => value
  ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : '-';
const locationText = (lead) => [lead.city, lead.region, lead.country].filter(Boolean).join(', ') || 'Unknown';
const leadTitle = (lead) => lead?.name || lead?.email || lead?.phone || 'Anonymous visitor';
const cartItemCount = (lead) => Array.isArray(lead?.cartItems)
  ? lead.cartItems.reduce((total, item) => total + (Number(item.quantity) || 1), 0)
  : 0;
const leadId = (lead) => lead?.id || lead?._id;
const asCartItems = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
const normalizeLead = (lead) => ({
  ...lead,
  cartItems: asCartItems(lead?.cartItems),
});
const newestLeadFirst = (a, b) => new Date(b.lastEventAt || 0) - new Date(a.lastEventAt || 0);
const addressSource = (lead) => (
  lead?.shippingAddress ||
  lead?.customerAddress ||
  lead?.address ||
  lead?.order?.shippingAddress ||
  lead?.metadata?.shippingAddress ||
  lead?.metadata?.address ||
  null
);
const customerAddressLines = (lead) => {
  const address = addressSource(lead);
  if (typeof address === 'string') return address.trim() ? [address.trim()] : [];

  const line1 = address?.line1 || address?.addressLine1 || address?.street || address?.address1;
  const line2 = address?.line2 || address?.addressLine2 || address?.landmark || address?.address2;
  const city = address?.city || lead?.city;
  const state = address?.state || address?.region || lead?.region;
  const pincode = address?.pincode || address?.postalCode || address?.zip;
  const country = address?.country || lead?.country;
  const localityLine = [city, state, pincode].filter(Boolean).join(', ');

  return [line1, line2, localityLine, country].filter(Boolean);
};
const trendLabel = (period, unit) => {
  if (unit === 'weekly') return String(period || '').replace('-W', ' W');
  if (unit === 'monthly') {
    const [year, month] = String(period || '').split('-');
    if (year && month) {
      return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
  }
  if (unit === 'daily' && period) {
    return new Date(`${period}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
  return period || '-';
};
const trendRows = (rows = []) => {
  const byPeriod = rows.reduce((groups, row) => {
    const period = row.period;
    if (!period) return groups;
    if (!groups[period]) groups[period] = { period, pageViews: 0, clicks: 0 };
    if (row.eventType === 'page_view') groups[period].pageViews = Number(row.count) || 0;
    if (row.eventType === 'generic_click') groups[period].clicks = Number(row.count) || 0;
    return groups;
  }, {});
  return Object.values(byPeriod).sort((a, b) => String(a.period).localeCompare(String(b.period)));
};

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

const AnalyticsTrendChart = ({ rows, unit }) => {
  const data = trendRows(rows);
  const maxValue = Math.max(1, ...data.flatMap(item => [item.pageViews, item.clicks]));

  return (
    <div className="lead-trend-chart">
      {data.length > 0 ? data.map(item => (
        <div className="lead-trend-column" key={item.period}>
          <div className="lead-trend-bars" title={`${trendLabel(item.period, unit)}: ${item.pageViews} views, ${item.clicks} clicks`}>
            <span
              className="lead-trend-bar lead-trend-bar--views"
              style={{ height: `${Math.max(4, (item.pageViews / maxValue) * 100)}%` }}
            />
            <span
              className="lead-trend-bar lead-trend-bar--clicks"
              style={{ height: `${Math.max(4, (item.clicks / maxValue) * 100)}%` }}
            />
          </div>
          <span className="lead-trend-label">{trendLabel(item.period, unit)}</span>
        </div>
      )) : (
        <div className="lead-trend-empty">No dated analytics data found for this period.</div>
      )}
    </div>
  );
};

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [eventSummary, setEventSummary] = useState([]);
  const [statusSummary, setStatusSummary] = useState([]);
  const [regionalPageViews, setRegionalPageViews] = useState([]);
  const [leadRegions, setLeadRegions] = useState([]);
  const [analyticsTrends, setAnalyticsTrends] = useState({ daily: [], weekly: [], monthly: [] });
  const [trendView, setTrendView] = useState('daily');
  const [filter, setFilter] = useState('actionable');
  const [region, setRegion] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  const loadLeads = async (selected = filter, selectedRegion = region) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: selected });
      if (selectedRegion !== 'all') params.set('region', selectedRegion);
      const res = await api.get(`/tracking/leads?${params}`);
      const nextLeads = (res.data.leads || []).map(normalizeLead).sort(newestLeadFirst);
      setLeads(nextLeads);
      setSelectedLead(current => current
        ? nextLeads.find(lead => leadId(lead) === leadId(current)) || null
        : null
      );
      setEventSummary(res.data.eventSummary || []);
      setStatusSummary(res.data.statusSummary || []);
      setRegionalPageViews(res.data.regionalPageViews || []);
      setLeadRegions(res.data.leadRegions || []);
      setAnalyticsTrends({
        daily: res.data.analyticsTrends?.daily || [],
        weekly: res.data.analyticsTrends?.weekly || [],
        monthly: res.data.analyticsTrends?.monthly || [],
      });
    } catch {
      setLeads([]);
      setAnalyticsTrends({ daily: [], weekly: [], monthly: [] });
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
  const openLead = (lead) => setSelectedLead(normalizeLead(lead));
  const closeLead = () => setSelectedLead(null);
  const onLeadKeyDown = (event, lead) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLead(lead);
    }
  };

  const summary = Object.fromEntries(eventSummary.map(event => [event.eventType, Number(event.count)]));
  const statuses = Object.fromEntries(statusSummary.map(status => [status.status, Number(status.count)]));
  const activeTrend = TREND_OPTIONS.find(option => option.value === trendView) || TREND_OPTIONS[0];

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

        <section className="lead-trends-panel">
          <div className="lead-section-head">
            <div>
              <h2>Views & Clicks</h2>
              <p>{activeTrend.title}</p>
            </div>
            <div className="lead-trend-tabs" role="tablist" aria-label="Analytics period">
              {TREND_OPTIONS.map(option => (
                <button
                  type="button"
                  key={option.value}
                  className={trendView === option.value ? 'active' : ''}
                  onClick={() => setTrendView(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="lead-trend-legend">
            <span><i className="views" /> Page Views</span>
            <span><i className="clicks" /> Page Clicks</span>
          </div>
          <AnalyticsTrendChart rows={analyticsTrends[trendView]} unit={trendView} />
        </section>

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
              <article
                className="lead-card lead-card-clickable"
                key={lead._id || lead.id}
                role="button"
                tabIndex={0}
                onClick={() => openLead(lead)}
                onKeyDown={(event) => onLeadKeyDown(event, lead)}
                aria-label={`Open lead details for ${leadTitle(lead)}`}
              >
                <div className="lead-card-head">
                  <div>
                    <h2>{leadTitle(lead)}</h2>
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
                  <span><strong>{cartItemCount(lead)}</strong> Product Qty</span>
                </div>

                <div className="lead-product-preview">
                  <strong>{Array.isArray(lead.cartItems) && lead.cartItems.length ? `${lead.cartItems.length} product line${lead.cartItems.length === 1 ? '' : 's'}` : 'No cart products captured yet'}</strong>
                  <span>Click lead to check product details</span>
                </div>

                <div className="lead-card-foot">
                  <span>Last activity: {dateTime(lead.lastEventAt)}</span>
                  {lead.order?.orderNumber && <span>Order: #{lead.order.orderNumber} ({lead.order.paymentStatus})</span>}
                  <div className="lead-actions">
                    {lead.status !== 'dismissed' && lead.status !== 'converted' && (
                      <button onClick={(event) => { event.stopPropagation(); changeStatus(leadId(lead), 'dismissed'); }}>Dismiss</button>
                    )}
                    {lead.status === 'dismissed' && (
                      <button onClick={(event) => { event.stopPropagation(); changeStatus(leadId(lead), 'hot'); }}>Reopen</button>
                    )}
                    <button className="lead-view-products" onClick={(event) => { event.stopPropagation(); openLead(lead); }}>
                      View Products
                    </button>
                    {lead.phone && <a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()}>Call</a>}
                    {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>WhatsApp</a>}
                  </div>
                </div>
              </article>
            ))}
            {leads.length === 0 && <div className="leads-empty">No leads in this view.</div>}
          </div>
        )}
      </div>

      {selectedLead && (
        <div className="lead-detail-backdrop" onClick={closeLead}>
          <aside className="lead-detail-panel" role="dialog" aria-modal="true" aria-label={`Lead details for ${leadTitle(selectedLead)}`} onClick={(event) => event.stopPropagation()}>
            <div className="lead-detail-head">
              <div>
                <span className="lead-detail-kicker">Lead Details</span>
                <h2>{leadTitle(selectedLead)}</h2>
                <p>{selectedLead.email || 'No email'} {selectedLead.phone ? ` | ${selectedLead.phone}` : ''}</p>
              </div>
              <button className="lead-detail-close" onClick={closeLead} aria-label="Close lead details">&times;</button>
            </div>

            <div className="lead-detail-summary">
              <span><strong>{selectedLead.score}</strong> Score</span>
              <span><strong>{selectedLead.stage}</strong> Stage</span>
              <span><strong>{money(selectedLead.cartValue)}</strong> Cart Value</span>
              <span><strong>{selectedLead.status}</strong> Status</span>
              <span><strong>{dateTime(selectedLead.lastEventAt)}</strong> Last Activity</span>
              {selectedLead.order?.orderNumber && <span><strong>#{selectedLead.order.orderNumber}</strong> Order</span>}
            </div>

            <div className="lead-customer-address">
              <h3>Customer Address</h3>
              {customerAddressLines(selectedLead).length > 0 ? (
                <address>
                  {customerAddressLines(selectedLead).map((line, index) => (
                    <span key={`${line}-${index}`}>{line}</span>
                  ))}
                </address>
              ) : (
                <p>No customer address captured yet.</p>
              )}
            </div>

            {Array.isArray(selectedLead.cartItems) && selectedLead.cartItems.length > 0 ? (
              <CartDetails items={selectedLead.cartItems} />
            ) : (
              <div className="lead-no-products">No product details captured for this lead yet.</div>
            )}

            <div className="lead-detail-actions">
              {selectedLead.status !== 'dismissed' && selectedLead.status !== 'converted' && (
                <button onClick={() => changeStatus(leadId(selectedLead), 'dismissed')}>Dismiss Lead</button>
              )}
              {selectedLead.status === 'dismissed' && (
                <button onClick={() => changeStatus(leadId(selectedLead), 'hot')}>Reopen Lead</button>
              )}
              {selectedLead.phone && <a href={`tel:${selectedLead.phone}`}>Call</a>}
              {selectedLead.phone && <a href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminLeads;
