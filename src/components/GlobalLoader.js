import React, { useEffect, useState } from 'react';
import { onLoadingChange } from '../utils/api';
import './GlobalLoader.css';

// Slim animated top bar that shows automatically while any backend
// request (via the shared `api` instance) is in flight.
const GlobalLoader = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let hideTimer;
    const unsubscribe = onLoadingChange((pending) => {
      if (pending > 0) {
        clearTimeout(hideTimer);
        setActive(true);
      } else {
        // small delay so rapid back-to-back requests don't flicker the bar
        hideTimer = setTimeout(() => setActive(false), 250);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(hideTimer);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="global-loader" role="status" aria-label="Loading">
      <div className="global-loader-bar" />
    </div>
  );
};

export default GlobalLoader;
