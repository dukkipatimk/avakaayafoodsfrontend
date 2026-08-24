import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Shared chrome that more than one part of the app needs to open — the Quick
// Order sheet is triggered from both the home page tiles and the bottom nav,
// so its open state cannot live inside either of them.
const UIContext = createContext({
  quickOrderOpen: false,
  openQuickOrder: () => {},
  closeQuickOrder: () => {},
  focusSearch: () => {},
});

export const UIProvider = ({ children }) => {
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  const openQuickOrder = useCallback(() => setQuickOrderOpen(true), []);
  const closeQuickOrder = useCallback(() => setQuickOrderOpen(false), []);

  // Scrolls the header search into view and focuses it. Used by the bottom
  // nav's Search tab, which has no page of its own to navigate to.
  const focusSearch = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Wait for the scroll to settle before focusing, otherwise iOS yanks the
    // viewport back down as the keyboard opens.
    setTimeout(() => {
      const input = document.querySelector('.header-search-input');
      if (input) input.focus();
    }, 320);
  }, []);

  const value = useMemo(
    () => ({ quickOrderOpen, openQuickOrder, closeQuickOrder, focusSearch }),
    [quickOrderOpen, openQuickOrder, closeQuickOrder, focusSearch]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => useContext(UIContext);
