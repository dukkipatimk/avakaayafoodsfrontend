import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { reorderableItems } from '../utils/reorder';

// Orders that never completed payment aren't something to "buy again".
const REORDERABLE_STATUS = new Set([
  'placed', 'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered',
]);

// The customer's most recent re-orderable order, or null.
//
// Shared by the Buy Again card and the quick-action tiles: the tiles drop
// their "Buy Again" shortcut when the card itself is on screen, so both need
// the same answer to the same question.
export default function useLastOrder() {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) { setOrder(null); return; }
    let cancelled = false;
    api.get('/orders/my')
      .then((r) => {
        if (cancelled) return;
        // /orders/my is already sorted newest-first.
        const last = (r.data.orders || []).find(
          (o) => REORDERABLE_STATUS.has(o.orderStatus) && reorderableItems(o).length > 0
        );
        setOrder(last || null);
      })
      .catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
  }, [user]);

  return order;
}
