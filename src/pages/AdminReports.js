import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import './AdminDashboard.css';
import './AdminReports.css';

/* ── helpers ── */
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const numf  = n => Number(n || 0).toLocaleString('en-IN');
const fmtDateTime = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const toCSV = (headers, rows) => {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
};
const downloadCSV = (name, headers, rows) => {
  const blob = new Blob([toCSV(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${name}-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// Human label for a sales bucket. Daily = the date; weekly/monthly = start – end.
const bucketLabel = (b, period) => {
  const d = s => new Date(`${s}T00:00:00`);
  const full = s => d(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const short = s => d(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (period === 'daily' || !b.end || b.start === b.end) return full(b.start);
  return `${short(b.start)} – ${full(b.end)}`;
};

// IST-anchored bucket → [from, to) for the order drill-down.
const bucketRange = (bucket, period) => {
  const from = new Date(`${bucket}T00:00:00+05:30`);
  const to = new Date(from);
  if (period === 'monthly') to.setMonth(to.getMonth() + 1);
  else if (period === 'weekly') to.setDate(to.getDate() + 7);
  else to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
};

const Kpi = ({ label, value, sub }) => (
  <div className="stat-card">
    <div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      {sub != null && <p className="report-kpi-sub">{sub}</p>}
    </div>
  </div>
);

const Loading = () => <div className="loading-spinner" style={{ margin: '3rem auto' }} />;
const Empty = ({ children }) => <div className="table-empty">{children}</div>;

/* ── Sales (daily / weekly / monthly + drill-down) ── */
const SalesReport = () => {
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState(null); // { label, orders }

  useEffect(() => {
    setLoading(true); setDrill(null);
    api.get(`/reports/sales?period=${period}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const openDrill = async (b) => {
    const { from, to } = bucketRange(b.bucket, period);
    const label = bucketLabel(b, period);
    setDrill({ label, orders: null });
    try {
      const res = await api.get(`/reports/orders?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setDrill({ label, orders: res.data.orders || [] });
    } catch { setDrill({ label, orders: [] }); }
  };

  const delta = (cur, prev) => {
    if (!prev) return null;
    const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
    return <span className={pct >= 0 ? 'report-delta up' : 'report-delta down'}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct)}%</span>;
  };

  const exportBuckets = () => downloadCSV(`sales-${period}`,
    ['Period', 'Start', 'End', 'Orders', 'Order value', 'Paid orders', 'Collected', 'Items sold', 'AOV'],
    (data?.buckets || []).map(b => [bucketLabel(b, period), b.start, b.end, b.orders, b.revenue, b.paidOrders, b.collected, b.itemsSold, b.aov]));

  if (loading) return <Loading />;
  const t = data?.totals || {};

  return (
    <div>
      <div className="report-controls">
        <div className="report-period-toggle">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} className={`report-period-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" onClick={exportBuckets}>⭳ Export CSV</button>
      </div>

      <div className="stats-grid report-kpis">
        <Kpi label="Order Value" value={money(t.revenue)} sub={delta(t.revenue, data?.previous?.revenue)} />
        <Kpi label="Orders" value={numf(t.orders)} sub={delta(t.orders, data?.previous?.orders)} />
        <Kpi label="Collected (paid)" value={money(t.collected)} sub={`${numf(t.paidOrders)} paid`} />
        <Kpi label="Avg Order Value" value={money(t.aov)} />
      </div>

      <p className="report-caption">
        <strong>Order Value</strong> = total of all placed orders ({numf(t.orders)}), including pending COD.
        <strong> Collected</strong> = received from the {numf(t.paidOrders)} paid orders so far.
        The gap ({money((t.revenue || 0) - (t.collected || 0))}) is payment not yet collected — mark COD orders paid to move it into Collected.
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Period</th><th>Orders</th><th>Order Value</th><th>Paid</th><th>Collected</th><th>Items</th><th>AOV</th><th></th></tr>
          </thead>
          <tbody>
            {(data?.buckets || []).map(b => (
              <tr key={b.bucket}>
                <td><strong>{bucketLabel(b, period)}</strong></td>
                <td>{numf(b.orders)}</td>
                <td><strong>{money(b.revenue)}</strong></td>
                <td>{numf(b.paidOrders)}</td>
                <td>{money(b.collected)}</td>
                <td>{numf(b.itemsSold)}</td>
                <td>{money(b.aov)}</td>
                <td><button className="user-orders-link" onClick={() => openDrill(b)}>View orders →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.buckets || data.buckets.length === 0) && <Empty>No sales in this range.</Empty>}
      </div>

      {drill && (
        <div className="modal-overlay" onClick={() => setDrill(null)}>
          <div className="staff-modal user-orders-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Orders — {drill.label}</h2>
              <button className="modal-close" onClick={() => setDrill(null)}>✕</button>
            </div>
            {drill.orders === null ? <Loading /> : drill.orders.length === 0 ? <Empty>No orders.</Empty> : (
              <div className="admin-table-wrap">
                <button className="btn btn-outline btn-sm" style={{ marginBottom: 8 }}
                  onClick={() => downloadCSV(`orders-${drill.label}`,
                    ['Order', 'Date', 'Customer', 'Email', 'Items', 'Total', 'Payment', 'Status'],
                    drill.orders.map(o => [o.orderNumber, fmtDateTime(o.createdAt), o.customer, o.email, o.items, o.total, o.paymentStatus, o.orderStatus]))}>
                  ⭳ Export
                </button>
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th></tr></thead>
                  <tbody>
                    {drill.orders.map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.orderNumber}</strong></td>
                        <td className="cell-date">{fmtDateTime(o.createdAt)}</td>
                        <td>{o.customer}<br /><span className="report-muted">{o.email}</span></td>
                        <td>{o.items}</td>
                        <td className={o.paymentStatus === 'paid' ? 'pay-paid' : 'pay-pending'}>{o.paymentStatus}</td>
                        <td>{money(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Product performance ── */
const ProductsReport = () => {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/reports/products').then(r => setD(r.data)).catch(console.error); }, []);
  if (!d) return <Loading />;
  const table = (title, rows, cols, csvName) => (
    <div className="report-block">
      <div className="report-block-head">
        <h3>{title}</h3>
        <button className="btn btn-outline btn-sm" onClick={() => downloadCSV(csvName, cols.map(c => c.label), rows.map(r => cols.map(c => c.get(r))))}>⭳</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>{cols.map(c => <th key={c.label}>{c.label}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{cols.map(c => <td key={c.label}>{c.render ? c.render(r) : c.get(r)}</td>)}</tr>)}</tbody>
        </table>
        {rows.length === 0 && <Empty>No data.</Empty>}
      </div>
    </div>
  );
  const prodCols = [
    { label: 'Product', get: r => r.name },
    { label: 'Qty', get: r => r.qty, render: r => numf(r.qty) },
    { label: 'Revenue', get: r => r.revenue, render: r => money(r.revenue) },
  ];
  return (
    <div>
      <div className="stats-grid report-kpis">
        <Kpi label="Veg revenue" value={money(d.vegSplit?.veg)} />
        <Kpi label="Non-veg revenue" value={money(d.vegSplit?.nonVeg)} />
        <Kpi label="Hamper revenue" value={money(d.hampers?.revenue)} sub={`${numf(d.hampers?.qty)} sold`} />
      </div>
      {table('Best sellers', d.topProducts || [], prodCols, 'best-sellers')}
      {table('By category', d.byCategory || [], [
        { label: 'Category', get: r => r.category },
        { label: 'Qty', get: r => r.qty, render: r => numf(r.qty) },
        { label: 'Revenue', get: r => r.revenue, render: r => money(r.revenue) },
      ], 'revenue-by-category')}
      {table('By weight / variant', d.byVariant || [], [
        { label: 'Weight', get: r => r.weight },
        { label: 'Qty', get: r => r.qty, render: r => numf(r.qty) },
        { label: 'Revenue', get: r => r.revenue, render: r => money(r.revenue) },
      ], 'revenue-by-variant')}
      {table('Slowest movers', d.worstProducts || [], prodCols, 'slow-movers')}
    </div>
  );
};

/* ── Customers & LTV ── */
const CustomersReport = () => {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/reports/customers?period=monthly').then(r => setD(r.data)).catch(console.error); }, []);
  if (!d) return <Loading />;
  const g = d.guestVsRegistered || {};
  return (
    <div>
      <div className="stats-grid report-kpis">
        <Kpi label="New customers" value={numf(d.newVsReturning?.new)} />
        <Kpi label="Returning" value={numf(d.newVsReturning?.returning)} />
        <Kpi label="Registered orders" value={numf(g.registeredOrders)} sub={money(g.registeredRevenue)} />
        <Kpi label="Guest orders" value={numf(g.guestOrders)} sub={money(g.guestRevenue)} />
      </div>
      <div className="report-block">
        <div className="report-block-head">
          <h3>Top customers (by revenue)</h3>
          <button className="btn btn-outline btn-sm" onClick={() => downloadCSV('top-customers',
            ['Name', 'Email', 'Orders', 'Revenue'], (d.topCustomers || []).map(c => [c.name, c.email, c.orders, c.revenue]))}>⭳</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email / Phone</th><th>Orders</th><th>Revenue</th></tr></thead>
            <tbody>
              {(d.topCustomers || []).map((c, i) => (
                <tr key={i}>
                  <td>
                    <strong>{c.name}</strong>
                    {c.type === 'guest' && <span className="report-guest-tag">guest</span>}
                  </td>
                  <td>{c.email}</td>
                  <td>{numf(c.orders)}</td>
                  <td>{money(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!d.topCustomers || d.topCustomers.length === 0) && <Empty>No customers in range.</Empty>}
        </div>
      </div>
      <div className="report-block">
        <div className="report-block-head"><h3>Revenue by zone</h3></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Zone</th><th>Orders</th><th>Revenue</th></tr></thead>
            <tbody>{(d.byZone || []).map((z, i) => <tr key={i}><td>{z.zone}</td><td>{numf(z.orders)}</td><td>{money(z.revenue)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Funnel & abandoned checkout ── */
const FunnelReport = () => {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/reports/funnel').then(r => setD(r.data)).catch(console.error); }, []);
  if (!d) return <Loading />;
  return (
    <div>
      <div className="stats-grid report-kpis">
        <Kpi label="Checkout → order conversion" value={`${d.conversionRate}%`} />
        <Kpi label="Abandoned checkouts" value={numf(d.abandoned?.count)} />
        <Kpi label="Abandoned cart value" value={money(d.abandoned?.value)} />
      </div>
      <div className="report-block">
        <div className="report-block-head"><h3>Conversion funnel</h3></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Stage</th><th>Sessions</th><th>% of previous</th></tr></thead>
            <tbody>{(d.funnel || []).map((s, i) => <tr key={i}><td><strong>{s.stage}</strong></td><td>{numf(s.count)}</td><td>{s.ofPrev}%</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="report-block">
        <div className="report-block-head">
          <h3>By source</h3>
          <button className="btn btn-outline btn-sm" onClick={() => downloadCSV('leads-by-source',
            ['Source', 'Sessions', 'Converted'], (d.bySource || []).map(s => [s.source, s.sessions, s.converted]))}>⭳</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Source</th><th>Sessions</th><th>Converted</th></tr></thead>
            <tbody>{(d.bySource || []).map((s, i) => <tr key={i}><td>{s.source}</td><td>{numf(s.sessions)}</td><td>{numf(s.converted)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Operations, inventory & coupons ── */
const OperationsReport = () => {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/reports/operations').then(r => setD(r.data)).catch(console.error); }, []);
  if (!d) return <Loading />;
  const a = d.actionable || {}, f = d.fulfilment || {};
  return (
    <div>
      <div className="stats-grid report-kpis">
        <Kpi label="Awaiting payment" value={numf(a.awaitingPayment)} />
        <Kpi label="UPI to verify" value={numf(a.upiAwaiting)} />
        <Kpi label="To ship" value={numf(a.toShip)} />
        <Kpi label="Avg days to deliver" value={f.avgDaysToDeliver ?? '—'} sub={f.sample ? `${f.sample} orders` : null} />
      </div>
      <div className="report-block">
        <div className="report-block-head"><h3>Orders by status</h3></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Status</th><th>Count</th></tr></thead>
            <tbody>{(d.ordersByStatus || []).map((s, i) => <tr key={i}><td>{s.status}</td><td>{numf(s.count)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="report-block">
        <div className="report-block-head">
          <h3>Low / out of stock</h3>
          <button className="btn btn-outline btn-sm" onClick={() => downloadCSV('stock-alerts',
            ['Product', 'Weight', 'Stock', 'SKU'],
            [...(d.inventory?.outOfStock || []), ...(d.inventory?.lowStock || [])].map(r => [r.product, r.weight, r.stock, r.sku]))}>⭳</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Weight</th><th>Stock</th><th>SKU</th></tr></thead>
            <tbody>
              {[...(d.inventory?.outOfStock || []), ...(d.inventory?.lowStock || [])].map((r, i) => (
                <tr key={i}><td>{r.product}</td><td>{r.weight}</td>
                  <td className={r.stock <= 0 ? 'pay-pending' : ''}><strong>{r.stock}</strong></td><td>{r.sku}</td></tr>
              ))}
            </tbody>
          </table>
          {(!d.inventory?.lowStock?.length && !d.inventory?.outOfStock?.length) && <Empty>All stock healthy.</Empty>}
        </div>
      </div>
      <div className="report-block">
        <div className="report-block-head"><h3>Coupon performance</h3></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Uses</th><th>Revenue</th><th>Discount given</th></tr></thead>
            <tbody>{(d.coupons || []).map((c, i) => <tr key={i}><td><strong>{c.code}</strong></td><td>{numf(c.uses)}</td><td>{money(c.revenue)}</td><td>{money(c.discount)}</td></tr>)}</tbody>
          </table>
          {(!d.coupons || d.coupons.length === 0) && <Empty>No coupons used in range.</Empty>}
        </div>
      </div>
    </div>
  );
};

const SECTIONS = [
  { key: 'sales', label: 'Sales', Comp: SalesReport },
  { key: 'products', label: 'Products', Comp: ProductsReport },
  { key: 'customers', label: 'Customers', Comp: CustomersReport },
  { key: 'funnel', label: 'Funnel & Leads', Comp: FunnelReport },
  { key: 'operations', label: 'Operations', Comp: OperationsReport },
];

const AdminReports = () => {
  const [section, setSection] = useState('sales');
  const Active = SECTIONS.find(s => s.key === section).Comp;
  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header"><h1 className="admin-title">Admin Dashboard</h1></div>
        <AdminTabs />

        <div className="section-header-row">
          <h2 className="section-title">Reports</h2>
        </div>

        <div className="report-section-nav">
          {SECTIONS.map(s => (
            <button key={s.key} className={`report-section-btn${section === s.key ? ' active' : ''}`} onClick={() => setSection(s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        <Active />
      </div>
    </div>
  );
};

export default AdminReports;
