import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import Header from './components/Header';
import Footer from './components/Footer';
import StoreCartDock from './components/StoreCartDock';
import QuickOrderHost from './components/QuickOrderHost';
import Home from './pages/Home';
import HomeV2 from './pages/HomeV2';   // the 2026 design, parked at /home-v2
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import CheckoutFailed from './pages/CheckoutFailed';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Account from './pages/Account';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';

import AdminUsers from './pages/AdminUsers';
import AdminCoupons from './pages/AdminCoupons';
import AdminCombos from './pages/AdminCombos';
import AdminStores from './pages/AdminStores';
import AdminLeads from './pages/AdminLeads';
import AdminReports from './pages/AdminReports';
import ShippingInfo from './pages/ShippingInfo';
import About from './pages/About';
import Contact from './pages/Contact';
import StoreLocations from './pages/StoreLocations';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import Wishlist from './pages/Wishlist';
import GiftHamper from './pages/GiftHamper';
import CombosPage from './pages/CombosPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import GlobalLoader from './components/GlobalLoader';
import AnalyticsTracker from './components/AnalyticsTracker';
import RouteSeo from './components/RouteSeo';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './components/AdminWorkspace.css';

// The footer is on every page, admin included. It was hidden on /admin alone,
// which meant the orders screen ended in nothing while every other admin page
// closed properly — one page behaving differently for no stated reason.

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <UIProvider>
        <Router>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: '14px',
                background: '#1a2e1a',
                color: '#e4c87a',
              },
              success: { iconTheme: { primary: '#c9a84c', secondary: '#1a2e1a' } },
              error: { style: { background: '#c0392b', color: '#fff' } }
            }}
          />
          <GlobalLoader />
          <RouteSeo />
          <AnalyticsTracker />
          <ScrollToTop />
          <Header />
          <main style={{ minHeight: '60vh' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              {/* The 2026 design, parked at /home2 until it is signed off.
                  /home-v2 was its first address and is in the wild, so it
                  forwards rather than 404s. */}
              <Route path="/home2" element={<HomeV2 />} />
              <Route path="/home-v2" element={<Navigate to="/home2" replace />} />
              <Route path="/products" element={<Products />} />
              <Route path="/collections/:category" element={<Products collectionPage />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/success" element={<OrderSuccess />} />
              <Route path="/checkout/failed" element={<CheckoutFailed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/shipping-info" element={<ShippingInfo />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/store-locations" element={<StoreLocations />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/gift-hamper" element={<GiftHamper />} />
              <Route path="/combos" element={<CombosPage />} />
              <Route path="/admin" element={<AdminRoute roles={['admin', 'store_manager']}><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              {/* Customers was the Users list filtered to one role. Old links
                  and bookmarks land on the list that replaced it. */}
              <Route path="/admin/customers" element={<Navigate to="/admin/users" replace />} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
              <Route path="/admin/combos" element={<AdminRoute><AdminCombos /></AdminRoute>} />
              <Route path="/admin/stores" element={<AdminRoute><AdminStores /></AdminRoute>} />
              <Route path="/admin/leads" element={<AdminRoute roles={['admin', 'store_manager']}><AdminLeads /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute roles={['super_admin']}><AdminReports /></AdminRoute>} />
            </Routes>
          </main>
          <Footer />
          <StoreCartDock />
          <QuickOrderHost />
        </Router>
        </UIProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
