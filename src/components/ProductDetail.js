import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper, 
  Divider,
  Chip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Store          as StoreIcon,
  ArrowBack      as BackIcon,
  AddShoppingCart as AddCartIcon,
  ShoppingCart   as CartIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const ProductDetail = ({ isAuthenticated }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    action: null
  });

  // Define a local placeholder image path
  const placeholderImage = process.env.PUBLIC_URL + '/images/product1.jpg';
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    const uid = auth.currentUser?.uid || localStorage.getItem('customerId');
    if (!uid) {
      setSnackbar({ open: true, message: 'Please login to add items to cart', severity: 'warning', action: null });
      return;
    }
    setAddingToCart(true);
    try {
      const customerRef = doc(db, 'customers', uid);
      const customerDoc = await getDoc(customerRef);
      if (!customerDoc.exists()) {
        setSnackbar({ open: true, message: 'Customer account not found', severity: 'error', action: null });
        return;
      }
      const currentCart = customerDoc.data().cart || [];
      const existingIdx = currentCart.findIndex(item => item.id === product.id);
      let updatedCart;
      if (existingIdx >= 0) {
        updatedCart = currentCart.map((item, i) =>
          i === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        updatedCart = [...currentCart, {
          id:       product.id,
          name:     product.name,
          price:    product.price,
          imageUrl: product.imageUrl || '',
          quantity,
          seller:   seller ? { shopName: seller.shopName } : null,
        }];
      }
      await updateDoc(customerRef, { cart: updatedCart });
      setSnackbar({ open: true, message: `${product.name} added to cart!`, severity: 'success', action: null });
    } catch (err) {
      console.error('Add to cart error:', err);
      setSnackbar({ open: true, message: 'Failed to add to cart. Please try again.', severity: 'error', action: null });
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        // Fetch product details
        const productDoc = await getDoc(doc(db, 'products', productId));
        
        if (!productDoc.exists()) {
          setSnackbar({
            open: true,
            message: 'Product not found',
            severity: 'error'
          });
          return;
        }
        
        const productData = productDoc.data();
        setProduct({ id: productDoc.id, ...productData });
        
        // If product has seller info, fetch seller details
        if (productData.sellerId) {
          const sellerDoc = await getDoc(doc(db, 'sellers', productData.sellerId));
          if (sellerDoc.exists()) {
            setSeller({ id: sellerDoc.id, ...sellerDoc.data() });
          }
        } else if (productData.seller) {
          // If product already has embedded seller data, use that
          setSeller(productData.seller);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load product details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Product not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This product may have been removed or the link is invalid.
          </Typography>
          <Button variant="contained" startIcon={<BackIcon />} onClick={() => navigate('/')}>
            Back to Store
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src={imageError ? placeholderImage : product.imageUrl}
              alt={product.name}
              onError={handleImageError}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 400,
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: '#f5f5f5',
                display: 'block',
                mb: 2
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {product.name}
            </Typography>
            
            {seller && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StoreIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Sold by: {seller.shopName || 'Unknown Shop'}
                </Typography>
              </Box>
            )}
            
            <Typography variant="h5" color="primary" gutterBottom>
              ${product.price || 0}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body1" paragraph>
              {product.description}
            </Typography>
            
            {product.category && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Category:
                </Typography>
                <Chip label={product.category} color="primary" variant="outlined" />
              </Box>
            )}

            {/* Quantity selector + Add to Cart */}
            <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ border: 'none', background: 'none', padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}
                  aria-label="decrease quantity"
                >−</button>
                <span style={{ padding: '0 12px', fontWeight: 600, minWidth: 32, textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  style={{ border: 'none', background: 'none', padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}
                  aria-label="increase quantity"
                >+</button>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={addingToCart ? null : <AddCartIcon />}
                onClick={handleAddToCart}
                disabled={addingToCart}
                sx={{
                  flex: 1,
                  minWidth: 180,
                  backgroundImage: 'linear-gradient(to bottom, #FF4D33, #FF5E46, #FF6E59)',
                  '&:hover': {
                    backgroundImage: 'linear-gradient(to bottom, #FF5E46, #FF6E59, #FF7E69)',
                    boxShadow: '0 4px 8px rgba(255, 77, 51, 0.3)',
                  },
                }}
              >
                {addingToCart ? 'Adding…' : 'Add to Cart'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          action={snackbar.action}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetail; 
