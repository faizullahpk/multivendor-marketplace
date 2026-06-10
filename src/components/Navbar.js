import React, { useEffect, useState, useRef } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Badge, 
  IconButton,
  InputBase,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Login as LoginIcon,
  ArrowDownward as FooterIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Storefront as StorefrontIcon } from '@mui/icons-material';

const Navbar = ({ isAdmin, setIsAdmin, isCustomer, setIsCustomer, isSeller, setIsSeller, isAuthenticated, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated || !!auth.currentUser);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use MUI's useTheme and useMediaQuery hooks for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';

  // Update local search term when URL search param changes
  useEffect(() => {
    const querySearchTerm = searchParams.get('search') || '';
    setSearchTerm(querySearchTerm);
  }, [searchParams]);

  // Handle search input changes
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    // Don't update the app state on every keystroke, only on submit
    // This prevents too many re-renders while typing
  };

  // Handle search submission
  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      submitSearch();
    }
  };

  // Add a submit button handler
  const handleSubmitSearch = () => {
    submitSearch();
  };

  // Common search submission logic
  const submitSearch = () => {
    if (searchTerm.trim()) {
      console.log('Search navigation with React Router:', searchTerm.trim());
      
      // First update the app state with the search term
      if (onSearch) {
        onSearch(searchTerm.trim());
      }
      
      // Then navigate to the homepage with the search parameter
      navigate({
        pathname: '/',
        search: `?search=${encodeURIComponent(searchTerm.trim())}`
      });
      
      // Close mobile menu if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    } else {
      // If empty search, clear the search param
      if (onSearch) {
        onSearch('');
      }
      navigate('/');
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
    navigate('/');
  };

  useEffect(() => {
    setIsLoggedIn(isAuthenticated || !!auth.currentUser);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      await signOut(auth);
      
      // Clear localStorage items related to "Remember Me" functionality
      // For sellers
      localStorage.removeItem('rememberedSeller');
      localStorage.removeItem('sellerId');
      localStorage.removeItem('sellerEmail');
      localStorage.removeItem('sellerName');
      localStorage.removeItem('sellerShopName');
      localStorage.removeItem('sellerStatus');
      localStorage.removeItem('sellerData');
      localStorage.removeItem('sellerLoginTime');
      
      // For admins
      localStorage.removeItem('rememberedAdmin');
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminLoginTime');

      // For customers
      localStorage.removeItem('customerId');
      localStorage.removeItem('customerEmail');
      localStorage.removeItem('isCustomer');
      
      setIsAdmin(false);
      setIsCustomer(false);
      setIsSeller(false);
      setIsLoggedIn(false);
      navigate('/');
      
      // Close mobile menu if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Determine if user is logged in using both props and direct auth check
  const hasStoredSession =
    (localStorage.getItem('isCustomer') === 'true' && localStorage.getItem('customerId')) ||
    (localStorage.getItem('rememberedSeller') === 'true' && localStorage.getItem('sellerId')) ||
    (localStorage.getItem('rememberedAdmin') === 'true' && localStorage.getItem('adminId'));
  const userIsLoggedIn = isLoggedIn || hasStoredSession;

  // Update the search field when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Function to scroll to footer
  const scrollToFooter = () => {
    const footerElement = document.getElementById('footer-section');
    if (footerElement) {
      footerElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback if ID doesn't work
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
    
    // Close mobile menu if open
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };
  
  // Mobile menu drawer content
  const mobileMenuContent = (
    <Box className='mt-12' sx={{ width: 250 }} role="presentation">
      <List>
        <ListItem sx={{ justifyContent: 'center', py: 2 }}>
          <Box
            component="img"
            src="https://th.bing.com/th/id/R.9ac86fdbff8d53b5aeaf6d2ba1711089?rik=qNffree61YfaOA&pid=ImgRaw&r=0"
            alt="E-Commerce Logo"
            sx={{
              height: 50,
              width: 'auto',
              borderRadius: '8px'
            }}
          />
        </ListItem>
        <Divider />
        
        {isHomePage && (
          <ListItem sx={{ mt: 1 }}>
            <Paper
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                borderRadius: '20px',
              }}
            >
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchSubmit}
              />
              {searchTerm && (
                <IconButton 
                  sx={{ p: '5px' }} 
                  aria-label="clear search"
                  onClick={handleClearSearch}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton 
                sx={{ p: '5px' }} 
                aria-label="search"
                onClick={handleSubmitSearch}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </Paper>
          </ListItem>
        )}

        {isAdmin && (
          <>
            <ListItem button onClick={() => {
              navigate('/admin/dashboard');
              setMobileMenuOpen(false);
            }}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
          </>
        )}
        
        {isCustomer && (
          <>
            <ListItem button onClick={() => {
              navigate('/customer/dashboard');
              setMobileMenuOpen(false);
            }}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="My Dashboard" />
            </ListItem>
            <ListItem button onClick={() => {
              navigate('/cart');
              setMobileMenuOpen(false);
            }}>
              <ListItemIcon><CartIcon /></ListItemIcon>
              <ListItemText primary="Cart" />
            </ListItem>
          </>
        )}
        
        {isSeller && (
          <ListItem button onClick={() => {
            navigate('/seller/dashboard');
            setMobileMenuOpen(false);
          }}>
            <ListItemIcon><StorefrontIcon /></ListItemIcon>
            <ListItemText primary="Seller Dashboard" />
          </ListItem>
        )}
        
        {!isAdmin && !isCustomer && !isSeller && (
          <>
            <ListItem button onClick={() => {
              navigate('/customer/login');
              setMobileMenuOpen(false);
            }}>
              <ListItemIcon><LoginIcon /></ListItemIcon>
              <ListItemText primary="Customer Login" />
            </ListItem>
            <ListItem button onClick={() => {
              navigate('/seller/login');
              setMobileMenuOpen(false);
            }}>
              <ListItemIcon><StorefrontIcon /></ListItemIcon>
              <ListItemText primary="Seller Login" />
            </ListItem>
          </>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <ListItem button onClick={scrollToFooter}>
          <ListItemIcon><FooterIcon /></ListItemIcon>
          <ListItemText primary="Footer" />
        </ListItem>
        
        {(isAdmin || isCustomer || isSeller) && (
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="fixed" sx={{ 
      zIndex: (theme) => theme.zIndex.drawer + 1, 
      boxShadow: 3,
      backgroundImage: 'linear-gradient(to bottom, #FF4D33, #FF5E46, #FF6E59)',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }
    }}>
      <Container>
        <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, p: { xs: 1, sm: 2 } }}>
          {/* Logo and brand name */}
          <Box
            component="div"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={() => navigate('/')}
          >
            {/* ManoMano hexagon logo (inline SVG — no external image needed) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="svg"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                sx={{ height: { xs: 34, sm: 40 }, width: 'auto', flexShrink: 0 }}
              >
                <defs>
                  <linearGradient id="mmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4aa" />
                    <stop offset="100%" stopColor="#00b4a0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="50,3 93,25 93,75 50,97 7,75 7,25"
                  fill="url(#mmGrad)"
                  rx="8"
                />
                <text
                  x="50" y="67"
                  textAnchor="middle"
                  fontSize="52"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  fill="white"
                >M</text>
              </Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.35rem' },
                  letterSpacing: '-0.3px',
                  display: 'block'
                }}
              >
                ManoMano
              </Typography>
            </Box>
          </Box>

          {/* Search Bar - Only show on homepage and not on mobile */}
          {isHomePage && !isMobile && (
            <Paper
              component="form"
              onSubmit={(e) => {
                e.preventDefault(); // Prevent default form submission
                submitSearch(); // Use our custom submit function
              }}
              sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: { sm: 250, md: 350, lg: 450 },
                mx: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                borderRadius: '20px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
              }}
            >
              <SearchIcon sx={{ p: '10px', color: 'white' }} />
              <InputBase
                ref={searchInputRef}
                sx={{ 
                  ml: 1, 
                  flex: 1,
                  color: 'white',
                  '& input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.8)',
                    opacity: 1,
                    fontWeight: 'medium',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                    padding: '8px 0',
                  }
                }}
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchSubmit}
                onFocus={() => setSearchFocused(true)}
                inputProps={{ 'aria-label': 'search products' }}
              />
              {searchTerm && (
                <IconButton 
                  sx={{ p: '5px', color: 'white' }} 
                  aria-label="clear search"
                  onClick={handleClearSearch}
                >
                  <Box component="span" sx={{ fontSize: 18, fontWeight: 'bold' }}>×</Box>
                </IconButton>
              )}
              <IconButton 
                sx={{ p: '5px', color: 'white' }} 
                aria-label="search"
                onClick={handleSubmitSearch}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </Paper>
          )}

          <Box sx={{ flexGrow: 1 }} />
          
          {/* Desktop Navigation Links */}
          {!isMobile && (
            <>
              {/* Footer link button */}
              {/* <Button 
                color="inherit"
                onClick={scrollToFooter}
                sx={{ 
                  mr: 2, 
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  opacity: 0.9,
                  '&:hover': {
                    opacity: 1,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Footer
              </Button> */}
              
              {isAdmin ? (
                <Box sx={{ display: 'flex' }}>
                  <Button color="inherit" onClick={() => navigate('/admin/dashboard')}>
                    Dashboard
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Logout
                  </Button>
                </Box>
              ) : isCustomer ? (
                <Box sx={{ display: 'flex' }}>
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/customer/dashboard')}
                    sx={{ display: { xs: 'none', md: 'block' } }}
                  >
                    My Dashboard
                  </Button>
                  <IconButton 
                    color="inherit" 
                    onClick={() => navigate('/cart')}
                    sx={{ mr: 1 }}
                  >
                    <CartIcon />
                  </IconButton>
                  <Button color="inherit" onClick={handleLogout}>
                    Logout
                  </Button>
                </Box>
              ) : isSeller ? (
                <Box sx={{ display: 'flex' }}>
                  <Button color="inherit" onClick={() => navigate('/seller/dashboard')}>
                    Seller Dashboard
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Logout
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained"
                    onClick={() => navigate('/customer/login')}
                    sx={{ 
                      background: 'linear-gradient(45deg, #ffffff 30%, #f5f5f5 90%)',
                      color: '#1a237e',
                      textTransform: 'none',
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      px: { xs: 1, sm: 2 },
                      py: 0.5,
                      // borderRadius: '20px',
                      boxShadow: '0 3px 5px 2px rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #f5f5f5 30%, #ffffff 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 10px 2px rgba(255, 255, 255, 0.4)',
                      },
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      border: '1px solid rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => navigate('/customer/register')}
                    sx={{ 
                      color: '#ffffff',
                      textTransform: 'none',
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      px: { xs: 1, sm: 2 },
                      py: 0.5,
                      // borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(255, 255, 255, 0.2)',
                      },
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}
                  >
                    {/* <StorefrontIcon sx={{ mr: 1, fontSize: 18 }} /> */}
                    Register
                  </Button>
                </Box>
              )}
            </>
          )}
          
          {/* Mobile login options */}
          {isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isAdmin ? (
                <IconButton color="inherit" onClick={() => navigate('/admin/dashboard')}>
                  <DashboardIcon />
                </IconButton>
              ) : isCustomer ? (
                <>
                  <IconButton color="inherit" onClick={() => navigate('/customer/dashboard')}>
                    <DashboardIcon />
                  </IconButton>
                  <IconButton color="inherit" onClick={() => navigate('/cart')}>
                    <CartIcon />
                  </IconButton>
                </>
              ) : isSeller ? (
                <IconButton color="inherit" onClick={() => navigate('/seller/dashboard')}>
                  <StorefrontIcon />
                </IconButton>
              ) : (
                // Customer and seller options removed from mobile navbar
                <Box>
                  {/* Login functionality is preserved but buttons are removed from mobile display */}
                </Box>
              )}
              {(isAdmin || isCustomer || isSeller) && (
                <IconButton color="inherit" onClick={handleLogout}>
                  <LogoutIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
      
      {/* Search functionality is preserved but the searchbar is removed from mobile display */}
    </AppBar>
  );
};

export default Navbar; 
