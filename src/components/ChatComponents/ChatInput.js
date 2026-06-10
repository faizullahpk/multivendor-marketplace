import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Paper, styled, CircularProgress, LinearProgress, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Send as SendIcon, AddPhotoAlternate as ImageIcon, Close as CloseIcon } from '@mui/icons-material';
import { uploadToCloudinary } from '../../utils/cloudinaryConfig';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const InputContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  padding: theme.spacing(0.75, 1.5),
  borderRadius: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  [theme.breakpoints.down('sm')]: {
    borderRadius: '18px',
    padding: theme.spacing(0.5, 1),
  }
}));

const ImagePreviewContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  margin: theme.spacing(1, 0),
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(0.5, 0),
  }
}));

const ImagePreview = styled('img')({
  maxHeight: '100px',
  maxWidth: '100%',
  borderRadius: '8px',
  marginTop: '10px',
});

const RemoveImageButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '5px',
  right: '5px',
  padding: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: '#fff',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '2px',
  }
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
  borderRadius: 4,
}));

// Fallback Firebase upload function
const uploadToFirebase = async (file, currentUserUid, progressCallback = () => {}) => {
  const storage = getStorage();
  const timestamp = new Date().getTime();
  const storageRef = ref(storage, `chat_images/${currentUserUid}_${timestamp}_${file.name}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        progressCallback(progress);
      },
      (error) => {
        console.error('Error uploading image to Firebase:', error);
        reject(error);
      },
      async () => {
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(imageUrl);
      }
    );
  });
};

const ChatInput = ({ onSendMessage, currentUserUid, isAdmin, selectedChatId, disabled }) => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      setImagePreview(URL.createObjectURL(selectedImage));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  // On desktop: Ctrl/Cmd+Enter sends. On mobile: Enter key sends directly.
  const handleKeyDown = (e) => {
    if (isMobile) {
      // On Android, pressing Enter on a singleline input sends
      // multiline input already needs Shift+Enter
    } else {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    const trimmedMessage = message.replace(/^\s+|\s+$/g, '');
    if ((trimmedMessage === '' && !image) || sending) return;
    
    setSending(true);
    setUploadProgress(0);
    
    try {
      let imageUrl = null;
      
      if (image) {
        try {
          imageUrl = await uploadToCloudinary(image, (progress) => {
            setUploadProgress(progress);
          });
        } catch (cloudinaryError) {
          console.error('Cloudinary upload failed, falling back to Firebase:', cloudinaryError);
          imageUrl = await uploadToFirebase(image, currentUserUid, (progress) => {
            setUploadProgress(progress);
          });
        }
      }
      
      onSendMessage(trimmedMessage, imageUrl);
      setMessage('');
      setImage(null);
      setImagePreview('');
      setUploadProgress(0);

      // Refocus input after send (keeps keyboard open on Android)
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {imagePreview && (
        <ImagePreviewContainer>
          <ImagePreview src={imagePreview} alt="Selected" />
          <RemoveImageButton size="small" onClick={removeImage}>
            <CloseIcon fontSize={isMobile ? 'small' : 'medium'} />
          </RemoveImageButton>
        </ImagePreviewContainer>
      )}
      
      {sending && image && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Uploading image: {uploadProgress}%
          </Typography>
          <ProgressBar variant="determinate" value={uploadProgress} />
        </Box>
      )}
      
      <InputContainer elevation={1} component="form" onSubmit={handleSubmit}>
        <IconButton 
          component="label" 
          disabled={sending || disabled}
          size={isMobile ? 'small' : 'medium'}
          sx={{ 
            p: isMobile ? 0.75 : 1,
            mb: 0.25,
            flexShrink: 0,
            minWidth: 40,
            minHeight: 40,
          }}
        >
          <ImageIcon color="action" fontSize={isMobile ? 'small' : 'medium'} />
          <input
            hidden
            accept="image/*"
            type="file"
            onChange={handleImageChange}
          />
        </IconButton>
        
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="standard"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}

          disabled={sending || disabled}
          multiline
          maxRows={isMobile ? 3 : 6}
          inputProps={{
            enterKeyHint: 'send',
            autoComplete: 'off',
            autoCorrect: 'on',
            spellCheck: true,
          }}
          InputProps={{
            disableUnderline: true,
            sx: {
              px: 1,
              py: 0.5,
              fontSize: isMobile ? '1rem' : '1rem',
              lineHeight: 1.5,
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (isMobile && !e.shiftKey) {
                // Mobile: Enter sends
                e.preventDefault();
                handleSubmit(e);
              } else if (!isMobile && (e.ctrlKey || e.metaKey)) {
                // Desktop: Ctrl+Enter sends (handled in handleKeyDown too, belt+suspenders)
                e.preventDefault();
                handleSubmit(e);
              }
            }
          }}
        />
        
        <IconButton 
          color="primary" 
          type="submit" 
          disabled={sending || disabled || (message.trim() === '' && !image)}
          size={isMobile ? 'medium' : 'medium'}
          sx={{ 
            p: isMobile ? 0.75 : 1,
            mb: 0.25,
            flexShrink: 0,
            minWidth: 40,
            minHeight: 40,
            bgcolor: (!disabled && (message.trim() !== '' || image)) ? 'primary.main' : 'transparent',
            color: (!disabled && (message.trim() !== '' || image)) ? 'white' : undefined,
            borderRadius: '50%',
            transition: 'background-color 0.2s ease',
            '&:hover': {
              bgcolor: (!disabled && (message.trim() !== '' || image)) ? 'primary.dark' : undefined,
            },
            '&.Mui-disabled': { bgcolor: 'transparent' },
          }}
        >
          {sending ? 
            <CircularProgress size={isMobile ? 20 : 24} /> : 
            <SendIcon fontSize={isMobile ? 'small' : 'medium'} />
          }
        </IconButton>
      </InputContainer>
    </Box>
  );
};

export default ChatInput;
