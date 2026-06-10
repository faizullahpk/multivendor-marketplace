import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Input,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '../utils/cloudinaryConfig';
import CloudUploadIcon        from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Footer from './Footer';

const SELLER_SECRET_KEY = process.env.REACT_APP_SELLER_SECRET_KEY || '74682';

const SellerRegister = () => {
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name,            setName]            = useState('');
  const [phone,           setPhone]           = useState('');
  const [shopName,        setShopName]        = useState('');
  const [secretKey,       setSecretKey]       = useState('');
  const [documentType,    setDocumentType]    = useState('');
  const [frontIdFile,     setFrontIdFile]     = useState(null);
  const [backIdFile,      setBackIdFile]      = useState(null);
  const [frontIdPreview,  setFrontIdPreview]  = useState('');
  const [backIdPreview,   setBackIdPreview]   = useState('');
  const [isUploading,     setIsUploading]     = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState({ front: 0, back: 0 });
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [error,           setError]           = useState('');
  const navigate = useNavigate();

  const handleFileChange = (side, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(`Please select an image file for the ${side} side of your ID.`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`The ${side} side image is too large. Please select an image under 5 MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (side === 'front') {
      setFrontIdFile(file);
      setFrontIdPreview(previewUrl);
    } else {
      setBackIdFile(file);
      setBackIdPreview(previewUrl);
    }
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
    navigate('/seller/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ── Client-side validation ──────────────────────────────
    if (!email || !password || !confirmPassword || !name || !phone || !shopName || !secretKey) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (secretKey !== SELLER_SECRET_KEY) {
      setError('Invalid invitation code.');
      return;
    }
    if (documentType && (!frontIdFile || !backIdFile)) {
      setError('Please upload both front and back ID proof images.');
      return;
    }
    // ────────────────────────────────────────────────────────

    setIsUploading(true);
    try {
      let frontIdUrl = '';
      let backIdUrl  = '';

      if (documentType) {
        frontIdUrl = await uploadToCloudinary(frontIdFile, (p) =>
          setUploadProgress(prev => ({ ...prev, front: p }))
        );
        backIdUrl  = await uploadToCloudinary(backIdFile,  (p) =>
          setUploadProgress(prev => ({ ...prev, back: p }))
        );
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'sellers', userCredential.user.uid), {
        name,
        email,
        phone,
        shopName,
        createdAt: new Date().toISOString(),
        role:      'seller',
        status:    'pending',
        approvalRequest: {
          status:      'pending',
          submittedAt: new Date().toISOString(),
        },
        documentType: documentType || null,
        idProof: documentType
          ? { frontImage: frontIdUrl, backImage: backIdUrl }
          : null,
        walletBalance:  0,
        totalEarnings:  0,
        cashPayment:    false,
        bankPayment:    false,
        usdtPayment:    false,
        // NOTE: plainPassword is intentionally omitted — passwords are managed by Firebase Auth only.
      });

      setSuccessDialogOpen(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Container maxWidth="sm" sx={{ width: '100%', px: { xs: 0, sm: 3, md: 4 } }}>
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Typography variant="h4" align="center" gutterBottom>
              Seller Registration
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField fullWidth label="Full Name"
                value={name} onChange={(e) => setName(e.target.value)}
                margin="normal" required disabled={isUploading} />

              <TextField fullWidth label="Email" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                margin="normal" required disabled={isUploading}
                autoComplete="email" />

              <TextField fullWidth label="Phone Number" type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                margin="normal" required disabled={isUploading} />

              <TextField fullWidth label="Shop Name"
                value={shopName} onChange={(e) => setShopName(e.target.value)}
                margin="normal" required disabled={isUploading} />

              <TextField fullWidth label="Invitation Code" type="password"
                value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                margin="normal" required disabled={isUploading} />

              <TextField fullWidth label="Password" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                margin="normal" required disabled={isUploading}
                inputProps={{ minLength: 6 }}
                helperText="Minimum 6 characters"
                autoComplete="new-password" />

              <TextField fullWidth label="Confirm Password" type="password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal" required disabled={isUploading}
                autoComplete="new-password" />

              {/* ID Proof */}
              <Box sx={{ mt: 3 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Select ID Proof (Optional)</FormLabel>
                  <RadioGroup
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    <FormControlLabel value="AADHAAR"         control={<Radio />} label="ID Card" />
                    <FormControlLabel value="PASSPORT"        control={<Radio />} label="Passport" />
                    <FormControlLabel value="DRIVING_LICENSE" control={<Radio />} label="Driving License" />
                    <FormControlLabel value="SSN"             control={<Radio />} label="Social Security Card" />
                  </RadioGroup>
                </FormControl>
              </Box>

              {documentType && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>ID Proof Images</Typography>

                  {/* Front */}
                  <Box sx={{ mt: 2, border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" gutterBottom>Front Side of ID *</Typography>
                    <Input
                      type="file" inputProps={{ accept: 'image/*' }}
                      onChange={(e) => handleFileChange('front', e)}
                      sx={{ display: 'none' }} id="front-id-upload"
                    />
                    <label htmlFor="front-id-upload">
                      <Button variant="outlined" component="span"
                        startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
                        Upload Front Side
                      </Button>
                    </label>
                    {frontIdPreview && (
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <img src={frontIdPreview} alt="Front ID Preview"
                          style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                      </Box>
                    )}
                    {isUploading && uploadProgress.front > 0 && (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress variant="determinate" value={uploadProgress.front} />
                        <Typography variant="body2" align="center">{uploadProgress.front}%</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Back */}
                  <Box sx={{ mt: 2, border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" gutterBottom>Back Side of ID *</Typography>
                    <Input
                      type="file" inputProps={{ accept: 'image/*' }}
                      onChange={(e) => handleFileChange('back', e)}
                      sx={{ display: 'none' }} id="back-id-upload"
                    />
                    <label htmlFor="back-id-upload">
                      <Button variant="outlined" component="span"
                        startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
                        Upload Back Side
                      </Button>
                    </label>
                    {backIdPreview && (
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <img src={backIdPreview} alt="Back ID Preview"
                          style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                      </Box>
                    )}
                    {isUploading && uploadProgress.back > 0 && (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress variant="determinate" value={uploadProgress.back} />
                        <Typography variant="body2" align="center">{uploadProgress.back}%</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, position: 'relative' }}>
                <Button
                  type="submit" fullWidth variant="contained"
                  disabled={isUploading}
                  sx={{
                    height: 48,
                    backgroundImage: 'linear-gradient(to bottom, #FF4D33, #FF5E46, #FF6E59)',
                    '&:hover': {
                      backgroundImage: 'linear-gradient(to bottom, #FF5E46, #FF6E59, #FF7E69)',
                      boxShadow: '0 4px 8px rgba(255, 77, 51, 0.3)',
                    },
                  }}
                >
                  {isUploading
                    ? <><CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />Processing…</>
                    : 'Register as Seller'}
                </Button>
              </Box>

              <Button fullWidth variant="text" sx={{ mt: 1 }}
                onClick={() => navigate('/seller/login')} disabled={isUploading}>
                Already have a seller account? Login
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Success Dialog */}
        <Dialog open={successDialogOpen} onClose={handleCloseSuccessDialog}
          aria-labelledby="success-dialog-title"
          PaperProps={{ sx: { borderRadius: 2, maxWidth: 450 } }}>
          <DialogTitle id="success-dialog-title" sx={{ textAlign: 'center', pt: 3 }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 1 }} />
            <Typography variant="h5" component="div">Registration Successful</Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ textAlign: 'center', px: 2 }}>
              Your request for approval has been submitted. Please try to login after the admin reviews your application.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button onClick={handleCloseSuccessDialog} variant="contained"
              autoFocus sx={{ minWidth: { xs: '100%', sm: 120 }, borderRadius: 6 }}>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Footer />
    </>
  );
};

export default SellerRegister;
