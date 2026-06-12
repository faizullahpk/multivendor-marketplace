import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL    = process.env.REACT_APP_ADMIN_EMAIL    || 'markethub@gmail.com';
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '123and123';

const AdminLogin = ({ setIsAdmin }) => {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const rememberedAdmin = localStorage.getItem('rememberedAdmin') === 'true';
    const adminId         = localStorage.getItem('adminId');
    if (rememberedAdmin && adminId) {
      setIsAdmin(true);
      navigate('/admin/dashboard');
    }
  }, [navigate, setIsAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const storedPassword      = localStorage.getItem('adminPassword');
    const currentAdminPassword = storedPassword || ADMIN_PASSWORD;

    if (email !== ADMIN_EMAIL || password !== currentAdminPassword) {
      setError('Invalid admin credentials. Access denied.');
      setLoading(false);
      return;
    }

    try {
      // Persist session data in localStorage
      localStorage.setItem('rememberedAdmin', rememberMe ? 'true' : 'false');
      localStorage.setItem('adminId',         'admin-' + Date.now());
      localStorage.setItem('adminEmail',      ADMIN_EMAIL);
      localStorage.setItem('adminLoginTime',  new Date().toISOString());

      // Best-effort Firebase auth (features like Storage rules may require it)
      try {
        if (rememberMe) await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, email, password);
      } catch {
        // Proceed even if Firebase auth fails; local session is sufficient
      }

      setIsAdmin(true);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ width: '100%', px: { xs: 0, sm: 3, md: 4 } }}>
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h4" align="center" gutterBottom>
            Admin Login
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
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Remember me"
              sx={{ mt: 1 }}
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
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin;