import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const CustomerLogin = ({ setIsCustomer }) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userDoc = await getDoc(doc(db, 'customers', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'customer') {
        setIsCustomer(true);
        localStorage.setItem('customerId',    userCredential.user.uid);
        localStorage.setItem('customerEmail', userCredential.user.email);
        localStorage.setItem('isCustomer',    'true');
        navigate('/');
      } else {
        setError('Not authorized as customer.');
        await auth.signOut();
        setLoading(false);
      }
    } catch {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <>
      <Container maxWidth="sm" sx={{ width: '100%', px: { xs: 0, sm: 3, md: 4 } }}>
        <Box sx={{ mt: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <IconButton
              onClick={() => navigate('/')}
              aria-label="back to home"
              sx={{ color: 'primary.main' }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>

          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Typography variant="h4" align="center" gutterBottom>
              Customer Login
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  backgroundImage: 'linear-gradient(to bottom, #FF4D33, #FF5E46, #FF6E59)',
                  '&:hover': {
                    backgroundImage: 'linear-gradient(to bottom, #FF5E46, #FF6E59, #FF7E69)',
                    boxShadow: '0 4px 8px rgba(255, 77, 51, 0.3)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Divider>
                <Typography variant="body2" color="textSecondary">
                  New to the store?
                </Typography>
              </Divider>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/customer/register')}
              sx={{ mt: 1 }}
              disabled={loading}
            >
              Create New Account
            </Button>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Divider>
                <Typography variant="body2" color="textSecondary">
                  Are you a seller?
                </Typography>
              </Divider>
            </Box>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/seller/login')}
              disabled={loading}
              sx={{
                mt: 1,
                color: 'secondary.main',
                '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.04)' },
              }}
            >
              Seller Login
            </Button>
          </Paper>
        </Box>
      </Container>
      <Footer />
    </>
  );
};

export default CustomerLogin;
