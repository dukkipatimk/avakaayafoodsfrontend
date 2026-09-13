import { useEffect, useState } from 'react';
import api from '../utils/api';

// The admin counts — orders, products, customers, revenue — fetched once and
// shared. The menu wants them on every admin page and the dashboard wants them
// too; without this they would be two requests for the same numbers on the same
// screen.
//
// Cached for the life of the tab, with a short expiry so a long session does not
// keep showing yesterday's totals. `refresh()` forces a fresh read after
// something that changes them.
const TTL_MS = 60 * 1000;
let cache = null;          // { at, data }
let inflight = null;       // the promise, so parallel callers share one request

const load = (force = false) => {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.data);
  if (!force && inflight) return inflight;
  inflight = api.get('/admin/dashboard')
    .then((res) => {
      const data = res.data.stats || res.data;
      cache = { at: Date.now(), data };
      return data;
    })
    .catch(() => (cache ? cache.data : null))
    .finally(() => { inflight = null; });
  return inflight;
};

export default function useAdminStats(enabled = true) {
  const [stats, setStats] = useState(cache ? cache.data : null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    load().then((d) => { if (!cancelled && d) setStats(d); });
    return () => { cancelled = true; };
  }, [enabled]);

  const refresh = () => load(true).then((d) => { if (d) setStats(d); return d; });
  return { stats, refresh };
}
