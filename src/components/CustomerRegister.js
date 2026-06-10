import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const CustomerRegister = () => {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'customers', userCredential.user.uid), {
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
        role:      'customer',
        cart:      [],
      });

      setSuccess('Registration successful! Redirecting to login…');
      setTimeout(() => navigate('/customer/login'), 2000);
    } catch (err) {
      // Show user-friendly messages for common Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container maxWidth="sm" sx={{ width: '100%', px: { xs: 0, sm: 3, md: 4 } }}>
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Typography variant="h4" align="center" gutterBottom>
              Customer Registration
            </Typography>

            {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Full Name"
                value={name} onChange={(e) => setName(e.target.value)}
                margin="normal" required disabled={loading}
              />
              <TextField
                fullWidth label="Email" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                margin="normal" required disabled={loading}
                autoComplete="email"
              />
              <TextField
                fullWidth label="Phone Number" type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                margin="normal" required disabled={loading}
                inputProps={{ pattern: '[0-9+\\-\\s]{7,15}' }}
                helperText="Enter a valid phone number"
              />
              <TextField
                fullWidth label="Password" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                margin="normal" required disabled={loading}
                inputProps={{ minLength: 6 }}
                helperText="Minimum 6 characters"
                autoComplete="new-password"
              />
              <TextField
                fullWidth label="Confirm Password" type="password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal" required disabled={loading}
                autoComplete="new-password"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
              </Button>

              <Button
                fullWidth variant="text"
                sx={{ mt: 1 }}
                onClick={() => navigate('/customer/login')}
                disabled={loading}
              >
                Already have an account? Login
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
      <Footer />
    </>
  );
};

export default CustomerRegister;
