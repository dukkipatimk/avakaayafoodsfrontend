import { useEffect, useState } from 'react';
import api from './api';

// Product categories: the six built-ins plus any the admin adds (Admin → Products →
// Categories). Pages start with the built-ins so menus render instantly, then pick
// up the admin's own once /settings/categories answers. One fetch is shared by all.
export const BUILT_IN_CATEGORIES = [
  { value: 'pickles', label: 'Pickles', builtIn: true },
  { value: 'powders', label: 'Podis & Powders', builtIn: true },
  { value: 'snacks', label: 'Snacks', builtIn: true },
  { value: 'sweets', label: 'Sweets', builtIn: true },
  { value: 'ghee', label: 'Ghee', builtIn: true },
  { value: 'gift-hampers', label: 'Gift Hampers', builtIn: true },
];

let cache = null;
let inflight = null;
const listeners = new Set();

export const setCategories = (list) => {
  cache = Array.isArray(list) && list.length ? list : BUILT_IN_CATEGORIES;
  listeners.forEach((fn) => fn(cache));
};

export const loadCategories = () => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api.get('/settings/categories')
      .then(({ data }) => { setCategories(data.categories); return cache; })
      .catch(() => BUILT_IN_CATEGORIES)
      .finally(() => { inflight = null; });
  }
  return inflight;
};

export const useCategories = () => {
  const [list, setList] = useState(cache || BUILT_IN_CATEGORIES);
  useEffect(() => {
    listeners.add(setList);
    loadCategories();
    return () => listeners.delete(setList);
  }, []);
  return list;
};

// Only the ones the admin added — menus already list the built-ins by hand.
export const customCategories = (list) => (list || []).filter((c) => !c.builtIn);
