import React, { useEffect, useState } from 'react';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import {
  Home          as HomeIcon,
  Category      as CategoryIcon,
  ShoppingCart  as CartIcon,
  Person        as AccountIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const pathToTab = (path) => {
  if (path === '/')                                           return 0;
  if (path.includes('/category'))                            return 1;
  if (path.includes('/cart'))                                return 2;
  if (path.includes('/customer/dashboard') ||
      path.includes('/customer/login'))                      return 3;
  return 0;
};

const MobileBottomNav = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [activeTab, setActiveTab] = useState(() => pathToTab(location.pathname));

  useEffect(() => {
    setActiveTab(pathToTab(location.pathname));
  }, [location.pathname]);

  const go = (path, tab) => {
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <Paper
      sx={{
        position:             'fixed',
        bottom:               0,
        left:                 0,
        right:                0,
        display:              { xs: 'block', sm: 'none' },
        zIndex:               1000,
        borderTopLeftRadius:  16,
        borderTopRightRadius: 16,
        overflow:             'hidden',
        boxShadow:            '0px -2px 10px rgba(0,0,0,0.1)',
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={activeTab}
        sx={{
          bgcolor: '#fff',
          height:  60,
          '& .MuiBottomNavigationAction-root': {
            color: '#757575',
            '&.Mui-selected': { color: '#FF4D33' },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<HomeIcon />}
          onClick={() => go('/', 0)}
        />
        <BottomNavigationAction
          label="Categories"
          icon={<CategoryIcon />}
          onClick={() => go('/', 1)}
        />
        <BottomNavigationAction
          label="Cart"
          icon={<CartIcon />}
          onClick={() => go('/cart', 2)}
        />
        <BottomNavigationAction
          label="Account"
          icon={<AccountIcon />}
          onClick={() => go('/customer/dashboard', 3)}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
