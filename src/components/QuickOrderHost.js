import React from 'react';
import QuickOrder from './QuickOrder';
import { useUI } from '../context/UIContext';

// Renders the Quick Order sheet wherever the UI context says it should be open.
// Kept separate from App so App does not need to consume the context it provides.
const QuickOrderHost = () => {
  const { quickOrderOpen, closeQuickOrder } = useUI();
  return <QuickOrder isOpen={quickOrderOpen} onClose={closeQuickOrder} />;
};

export default QuickOrderHost;
