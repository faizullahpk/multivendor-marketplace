import React, { useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import Navbar                  from './components/Navbar';
import AdminLogin              from './components/AdminLogin';
import AdminDashboard          from './components/AdminDashboard';
import CustomerLogin           from './components/CustomerLogin';
import CustomerRegister        from './components/CustomerRegister';
import CustomerDashboard       from './components/CustomerDashboard';
import ProductDetail           from './components/ProductDetail';
import Cart                    from './components/Cart';
import HomePage                from './components/HomePage';
import SellerLogin             from './components/SellerLogin';
import SellerRegister          from './components/SellerRegister';
import SellerDashboard         from './components/SellerDashboard';
import SellerOrderDetailsPage  from './components/SellerOrderDetailsPage';
import Setup                   from './components/Setup';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Toolbar,
  Container,
} from '@mui/material';
import { auth }              from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { NotificationSoundProvider } from './utils/notificationSound';

const theme = createTheme();

// ── Protected-route helpers ──────────────────────────────────────────────────
// Defined outside any component so they are never recreated on re-renders.

const ProtectedAdminRoute = ({ isAdmin, children }) => {
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
};

const ProtectedCustomerRoute = ({ isCustomer, children }) => {
  const isCustomerStored = localStorage.getItem('isCustomer')  === 'true';
  const customerId       = localStorage.getItem('customerId');
  if (!isCustomer && !(isCustomerStored && customerId)) {
    return <Navigate to="/customer/login" replace />;
  }
  return children;
};

const ProtectedSellerRoute = ({ isSeller, children }) => {
  const rememberedSeller = localStorage.getItem('rememberedSeller') === 'true';
  const sellerId         = localStorage.getItem('sellerId');
  const sellerData       = localStorage.getItem('sellerData');
  if (!isSeller && !(rememberedSeller && sellerId && sellerData)) {
    return <Navigate to="/seller/login" replace />;
  }
  return children;
};
// ────────────────────────────────────────────────────────────────────────────

function App() {
  const [isAdmin,          setIsAdmin]          = useState(false);
  const [isCustomer,       setIsCustomer]       = useState(false);
  const [isSeller,         setIsSeller]         = useState(false);
  const [isAuthenticated,  setIsAuthenticated]  = useState(!!auth.currentUser);
  const [searchTerm,       setSearchTerm]       = useState('');

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  useEffect(() => {
    // Restore roles from localStorage immediately to prevent flicker
    const rememberedAdmin    = localStorage.getItem('rememberedAdmin')    === 'true';
    const adminId            = localStorage.getItem('adminId');
    const rememberedSeller   = localStorage.getItem('rememberedSeller')   === 'true';
    const sellerId           = localStorage.getItem('sellerId');
    const sellerData         = localStorage.getItem('sellerData');
    const isCustomerStored   = localStorage.getItem('isCustomer')         === 'true';
    const customerId         = localStorage.getItem('customerId');

    if (rememberedAdmin  && adminId)                    { setIsAdmin(true);    setIsAuthenticated(true); }
    if (rememberedSeller && sellerId && sellerData)     { setIsSeller(true);   setIsAuthenticated(true); }
    if (isCustomerStored && customerId)                 { setIsCustomer(true); setIsAuthenticated(true); }

    let authInitialized = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        authInitialized = true;
      } else {
        if (authInitialized) {
          // Real sign-out — clear state unless localStorage preserves the session
          setIsAuthenticated(false);
          if (!(localStorage.getItem('rememberedAdmin')  === 'true' && localStorage.getItem('adminId')))    setIsAdmin(false);
          if (!(localStorage.getItem('isCustomer')       === 'true' && localStorage.getItem('customerId'))) {
            setIsCustomer(false);
            localStorage.removeItem('customerId');
            localStorage.removeItem('customerEmail');
            localStorage.removeItem('isCustomer');
          }
          if (!(localStorage.getItem('rememberedSeller') === 'true' && localStorage.getItem('sellerId')))   setIsSeller(false);
        } else {
          // First null event — Firebase hasn't restored its session from disk yet
          authInitialized = true;
          const hasStoredSession =
            (localStorage.getItem('isCustomer')       === 'true' && localStorage.getItem('customerId')) ||
            (localStorage.getItem('rememberedSeller') === 'true' && localStorage.getItem('sellerId'))   ||
            (localStorage.getItem('rememberedAdmin')  === 'true' && localStorage.getItem('adminId'));
          if (!hasStoredSession) setIsAuthenticated(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Setup />
      <NotificationSoundProvider>
        <Router>
          <AppContent
            isAdmin={isAdmin}         setIsAdmin={setIsAdmin}
            isCustomer={isCustomer}   setIsCustomer={setIsCustomer}
            isSeller={isSeller}       setIsSeller={setIsSeller}
            isAuthenticated={isAuthenticated}
            searchTerm={searchTerm}   onSearch={handleSearch}
          />
        </Router>
      </NotificationSoundProvider>
    </ThemeProvider>
  );
}

function AppContent({
  isAdmin,    setIsAdmin,
  isCustomer, setIsCustomer,
  isSeller,   setIsSeller,
  isAuthenticated,
  searchTerm, onSearch,
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isSellerDashboard =
    location.pathname.startsWith('/seller/dashboard') ||
    location.pathname.startsWith('/seller/order');

  // Sync URL search param → app state (only on mount)
  useEffect(() => {
    const querySearchTerm = searchParams.get('search');
    if (querySearchTerm !== null) onSearch(querySearchTerm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep app state in sync with URL changes
  useEffect(() => {
    const currentSearchParam = searchParams.get('search');
    if (!currentSearchParam && searchTerm && location.pathname === '/') {
      onSearch('');
    } else if (currentSearchParam !== null && currentSearchParam !== searchTerm) {
      onSearch(currentSearchParam);
    }
  }, [searchParams, searchTerm, onSearch, location.pathname]);

  return (
    <>
      {!isSellerDashboard && (
        <>
          <Navbar
            isAdmin={isAdmin}         setIsAdmin={setIsAdmin}
            isCustomer={isCustomer}   setIsCustomer={setIsCustomer}
            isSeller={isSeller}       setIsSeller={setIsSeller}
            isAuthenticated={isAuthenticated}
            onSearch={onSearch}
          />
          <Toolbar />
        </>
      )}

      {isSellerDashboard ? (
        <Box sx={{ width: '100%', p: 0, m: 0, overflowX: 'hidden' }}>
          <Routes>
            <Route path="/seller/dashboard" element={
              <ProtectedSellerRoute isSeller={isSeller}>
                <SellerDashboard setIsSeller={setIsSeller} />
              </ProtectedSellerRoute>
            } />
            <Route path="/seller/order/:orderId" element={
              <ProtectedSellerRoute isSeller={isSeller}>
                <SellerOrderDetailsPage setIsSeller={setIsSeller} />
              </ProtectedSellerRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      ) : (
        <Routes>
          {/* Admin dashboard — full-width, outside Container */}
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute isAdmin={isAdmin}>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />

          {/* All other routes wrapped in a Container */}
          <Route path="/*" element={
            <Container maxWidth="xl">
              <Routes>
                <Route path="/" element={
                  <HomePage isAuthenticated={isAuthenticated} searchTerm={searchTerm} />
                } />

                {/* Admin */}
                <Route path="/admin/login" element={<AdminLogin setIsAdmin={setIsAdmin} />} />

                {/* Customer */}
                <Route path="/customer/login"    element={<CustomerLogin    setIsCustomer={setIsCustomer} />} />
                <Route path="/customer/register" element={<CustomerRegister />} />
                <Route path="/customer/dashboard" element={
                  <ProtectedCustomerRoute isCustomer={isCustomer}>
                    <CustomerDashboard />
                  </ProtectedCustomerRoute>
                } />
                <Route path="/product/:productId" element={
                  <ProductDetail isAuthenticated={isAuthenticated} />
                } />
                <Route path="/cart" element={
                  <ProtectedCustomerRoute isCustomer={isCustomer}>
                    <Cart />
                  </ProtectedCustomerRoute>
                } />

                {/* Seller */}
                <Route path="/seller/login"    element={<SellerLogin    setIsSeller={setIsSeller} />} />
                <Route path="/seller/register" element={<SellerRegister />} />
              </Routes>
            </Container>
          } />
        </Routes>
      )}
    </>
  );
}

export default App;
