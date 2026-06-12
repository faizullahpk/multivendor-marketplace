import React, { useState } from 'react';
import {
  Box, Typography, Avatar, Paper, styled, alpha,
  CircularProgress, IconButton, Menu, MenuItem
} from '@mui/material';
import { cloudinary } from '../../utils/cloudinaryConfig';
import { MoreVert as MoreVertIcon, Delete as DeleteIcon } from '@mui/icons-material';

// ─── Styled components ───────────────────────────────────────────────────────

const MessageContainer = styled(Box)(({ theme, isCurrentUser }) => ({
  display: 'flex',
  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.down('sm')]: { marginBottom: theme.spacing(1.5) },
}));

const MessageBubble = styled(Box)(({ theme, isCurrentUser }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1.5, 2),
  borderRadius: '1rem',
  backgroundColor: isCurrentUser ? theme.palette.primary.main : 'white',
  color: isCurrentUser ? 'white' : theme.palette.text.primary,
  alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  position: 'relative',
  '& img': { maxWidth: '100%', borderRadius: theme.spacing(1), marginTop: theme.spacing(1) },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '85%',
    padding: theme.spacing(1, 1.5),
    fontSize: '0.95rem',
  },
}));

const MessageContent = styled(Box)({ display: 'flex', flexDirection: 'column', gap: '8px' });

const MessageTimeStamp = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  alignSelf: 'flex-end',
  marginTop: '4px',
  [theme.breakpoints.down('sm')]: { fontSize: '0.65rem' },
}));

const MessageImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '200px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'block',
});

const MessageAvatar = styled(Avatar)(({ theme, isAdmin }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  backgroundColor: isAdmin ? theme.palette.primary.main : theme.palette.grey[300],
  color: isAdmin ? 'white' : theme.palette.text.primary,
  fontSize: '1rem',
  marginRight: theme.spacing(1),
  marginLeft: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    width: 30, height: 30,
    marginRight: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),
    fontSize: '0.8rem',
  },
}));

// ─── WhatsApp-style double tick component ─────────────────────────────────────
/**
 * Shows message delivery / read status for the sender.
 * isRead === true  → double BLUE ticks (read by recipient)
 * isRead === false → double GREY ticks (sent/delivered, not yet read)
 */
const MessageTicks = ({ isRead }) => {
  const color = isRead ? '#4FC3F7' : 'rgba(255,255,255,0.65)';
  return (
    <Box
      component="span"
      aria-label={isRead ? 'Read' : 'Sent'}
      title={isRead ? 'Read' : 'Delivered'}
      sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5, verticalAlign: 'middle', flexShrink: 0 }}
    >
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left tick */}
        <path d="M1 6.5L4.5 10L10 1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Right tick (slightly offset to the right – creates the double tick look) */}
        <path d="M7 6.5L10.5 10L16 1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Box>
  );
};

// ─── Cloudinary image helper ──────────────────────────────────────────────────

const CloudinaryImage = ({ publicId, url, alt, onClick }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!publicId && url) {
    return (
      <Box sx={{ position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <MessageImage
          src={url} alt={alt} onClick={onClick}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          style={{ display: loading ? 'none' : 'block' }}
        />
      </Box>
    );
  }

  const extractPublicId = (cloudinaryUrl) => {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) return null;
    try {
      const parts = cloudinaryUrl.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;
      return parts.slice(uploadIndex + 2).join('/');
    } catch { return null; }
  };

  const imagePublicId = publicId || extractPublicId(url);
  if (!imagePublicId) return null;
  if (error) return (
    <Box sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
      Image unavailable
    </Box>
  );

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <CircularProgress size={24} />
        </Box>
      )}
      <img
        src={`https://res.cloudinary.com/${cloudinary.config().cloud.cloudName}/image/upload/q_auto,f_auto,c_limit,w_800,h_600/${imagePublicId}`}
        alt={alt} onClick={onClick}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer', display: loading ? 'none' : 'block' }}
      />
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Message = ({ message, isAdmin, onDeleteMessage }) => {
  const { text, imageUrl, timestamp, senderName, senderUid, id, isRead } = message;
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const displayName =
    senderName === 'markethub@gmail.com' || senderName === 'Customer Care'
      ? 'Customer Care'
      : senderName;

  // isCurrentUserMessage: true when this message was sent by the currently logged-in user
  const isCurrentUserMessage =
    (isAdmin && (senderName === 'markethub@gmail.com' || senderName === 'Customer Care')) ||
    (!isAdmin && senderName !== 'markethub@gmail.com' && senderName !== 'Customer Care');

  // Show ticks ONLY for messages sent by the admin (read receipt for admin → seller direction)
  const showTicks = isAdmin && isCurrentUserMessage;

  const formattedTime = timestamp ? new Date(timestamp.toDate()).toLocaleString() : '';

  const handleImageClick = (url) => window.open(url, '_blank');
  const isCloudinaryImage = imageUrl && imageUrl.includes('cloudinary.com');

  const handleMenuOpen = (e) => { e.stopPropagation(); setMenuAnchorEl(e.currentTarget); };
  const handleMenuClose = () => setMenuAnchorEl(null);
  const handleDeleteMessage = () => { handleMenuClose(); if (onDeleteMessage) onDeleteMessage(id); };

  return (
    <MessageContainer isCurrentUser={isCurrentUserMessage}>
      {/* Avatar on the LEFT for incoming messages */}
      {!isCurrentUserMessage && (
        <MessageAvatar alt={displayName} isAdmin={!isAdmin} />
      )}

      <MessageBubble isCurrentUser={isCurrentUserMessage}>
        <MessageContent>
          {text && (
            <Typography variant="body2" sx={{
              fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}>
              {text}
            </Typography>
          )}

          {imageUrl && (
            isCloudinaryImage
              ? <CloudinaryImage url={imageUrl} alt="Message attachment" onClick={() => handleImageClick(imageUrl)} />
              : <MessageImage src={imageUrl} alt="Message attachment" onClick={() => handleImageClick(imageUrl)} />
          )}

          {/* Footer row: timestamp + ticks + delete menu */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, width: '100%', mt: 0.25 }}>
            {/* Timestamp for everyone */}
            <MessageTimeStamp
              variant="caption"
              sx={{ color: isCurrentUserMessage ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.45)' }}
            >
              {formattedTime}
            </MessageTimeStamp>

            {/* ── WhatsApp double ticks ── */}
            {showTicks && <MessageTicks isRead={!!isRead} />}

            {/* Delete option for admin */}
            {isAdmin && (
              <>
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ padding: '2px', color: isCurrentUserMessage ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem onClick={handleDeleteMessage}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete for everyone
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </MessageContent>
      </MessageBubble>

      {/* Avatar on the RIGHT for outgoing messages */}
      {isCurrentUserMessage && (
        <MessageAvatar
          alt={senderName === 'markethub@gmail.com' || senderName === 'Customer Care' ? 'Customer Care' : displayName}
          isAdmin={isAdmin}
        />
      )}
    </MessageContainer>
  );
};

export default Message;