import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, Divider, CircularProgress, IconButton,
  Stack, Tooltip, styled, alpha, Menu, MenuItem, useTheme,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import Message from './Message';
import ChatInput from './ChatInput';
import { db } from '../../firebase';
import {
  collection, query, where, orderBy, onSnapshot, addDoc,
  serverTimestamp, getDoc, doc, updateDoc, deleteDoc, getDocs,
  increment, writeBatch
} from 'firebase/firestore';

// ─── Styled components ────────────────────────────────────────────────────────

const ChatWindowContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  position: 'relative',
  minHeight: 0,
  overflow: 'hidden',
  // Height is controlled by parent; no override needed here.
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  textAlign: 'center',
  position: 'relative',
  [theme.breakpoints.down('sm')]: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(2) },
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(1),
  marginTop: theme.spacing(1),
  borderTop: '1px solid rgba(255,255,255,0.2)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  width: '100%',
  padding: theme.spacing(2),
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  minHeight: 0,
  // Momentum scrolling on iOS, smooth on Android
  WebkitOverflowScrolling: 'touch',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 1),
    gap: theme.spacing(1.5),
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'white',
  borderTop: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
  width: '100%',
  boxSizing: 'border-box',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 1.5),
    // iOS safe area bottom padding (notch/home indicator)
    paddingBottom: `max(${theme.spacing(1)}, env(safe-area-inset-bottom, 8px))`,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    position: 'relative',
    zIndex: 10,
  },
}));

const NoConversationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(3),
  backgroundColor: '#f5f5f5',
  textAlign: 'center',
  '& > *': { marginBottom: theme.spacing(1) },
}));

const AvatarIcon = styled(Box)(({ theme }) => ({
  width: 60, height: 60, borderRadius: '50%',
  backgroundColor: 'white',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: theme.spacing(2),
  '& svg': { width: 32, height: 32, color: theme.palette.primary.main },
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Formats a Firestore Timestamp into a "X min/h/d ago" string. */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  } catch { return ''; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const ChatWindow = ({
  selectedChatId,
  onBackClick,
  currentUserUid,
  currentUserName,
  isAdmin,
  otherUserDetails,
  onDeleteChat,
  onMessageSent,
}) => {
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]); // ref so markMessagesAsRead never stale-closes over old messages
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const [localUserDetails, setLocalUserDetails] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const theme = useTheme();
  const [sellerStatus, setSellerStatus] = useState(null);

  // ── Online / offline state for the seller (admin view only) ──────────────
  const [sellerIsOnline, setSellerIsOnline] = useState(false);
  const [sellerLastSeen, setSellerLastSeen] = useState(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Seller account status (for seller view) ───────────────────────────────
  useEffect(() => {
    if (isAdmin) return;
    const status = localStorage.getItem('sellerStatus');
    setSellerStatus(status);

    const handleStorageChange = (e) => {
      if (e.key === 'sellerStatus') setSellerStatus(e.newValue);
    };
    window.addEventListener('storage', handleStorageChange);

    const checkSellerStatus = async () => {
      try {
        const sellerId = localStorage.getItem('sellerId');
        if (!sellerId) return;
        const sellerDoc = await getDoc(doc(db, 'sellers', sellerId));
        if (sellerDoc.exists()) {
          const firebaseStatus = sellerDoc.data().status;
          if (firebaseStatus !== status) {
            localStorage.setItem('sellerStatus', firebaseStatus);
            setSellerStatus(firebaseStatus);
          }
        }
      } catch { /* ignore */ }
    };

    checkSellerStatus();
    const intervalId = setInterval(checkSellerStatus, 60_000);
    return () => { window.removeEventListener('storage', handleStorageChange); clearInterval(intervalId); };
  }, [isAdmin]);

  // ── Real-time seller online/offline subscription (admin view only) ────────
  useEffect(() => {
    if (!isAdmin || !selectedChatId) {
      setSellerIsOnline(false);
      setSellerLastSeen(null);
      return;
    }

    let unsubscribe = () => {};

    const subscribeToSellerPresence = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', selectedChatId));
        if (!chatDoc.exists()) return;
        const sellerUid = chatDoc.data().sellerUid;
        if (!sellerUid) return;

        unsubscribe = onSnapshot(doc(db, 'sellers', sellerUid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setSellerIsOnline(data.isOnline ?? false);
            setSellerLastSeen(data.lastSeen ?? null);
          }
        });
      } catch { /* ignore */ }
    };

    subscribeToSellerPresence();
    return () => unsubscribe();
  }, [isAdmin, selectedChatId]);

  // ── Scroll to bottom when messages change ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Mark messages as read (updates chat doc + individual message isRead) ──
  // NOTE: must be declared BEFORE the useEffect below that references it
  const markMessagesAsRead = useCallback(async (currentMessages) => {
    if (!selectedChatId) return;
    try {
      const chatRef = doc(db, 'chats', selectedChatId);
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) return;

      // Reset unread counter for the current user
      const fieldToUpdate = isAdmin ? 'adminUnreadCount' : 'sellerUnreadCount';
      await updateDoc(chatRef, { [fieldToUpdate]: 0 });

      // Batch-mark individual messages as read.
      // We mark messages sent by the OTHER party (not us) that are still unread.
      // Use messagesRef (not messages state) to avoid adding messages to deps and causing a refresh loop
      const msgs = currentMessages || messagesRef.current;
      const unreadFromOther = msgs.filter(m => {
        if (m.isRead) return false;
        const isAdminMessage = m.senderName === 'manomano@gmail.com' || m.senderName === 'Customer Care';
        return isAdmin ? !isAdminMessage : isAdminMessage;
      });

      if (unreadFromOther.length === 0) return;

      const batch = writeBatch(db);
      unreadFromOther.forEach(m => {
        batch.update(doc(db, 'chats', selectedChatId, 'messages', m.id), { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId, isAdmin]); // removed 'messages' — use messagesRef to avoid re-render loop

  // ── Load messages ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedChatId) { setLoading(false); return; }
    setLoading(true);

    const colRef = collection(db, 'chats', selectedChatId, 'messages');
    const messagesQuery = query(colRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      messagesRef.current = list; // keep ref in sync before calling markMessagesAsRead
      setMessages(list);
      setLoading(false);
      if (list.length > 0) markMessagesAsRead(list);
    });

    return () => unsubscribe();
  }, [selectedChatId, currentUserUid, markMessagesAsRead]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (text, imageUrl) => {
    if ((!text || text.trim() === '') && !imageUrl) return;
    try {
      let senderUid = currentUserUid;
      let senderName = currentUserName;

      if (!senderUid) {
        if (isAdmin) {
          senderUid = localStorage.getItem('adminId');
          senderName = 'Customer Care';
          if (!senderUid) return;
        } else {
          senderUid = localStorage.getItem('sellerId');
          senderName =
            localStorage.getItem('sellerName') ||
            localStorage.getItem('sellerShopName') ||
            localStorage.getItem('sellerEmail') || 'Seller';
          if (!senderUid) return;
        }
      } else if (isAdmin) {
        senderName = 'Customer Care';
      }

      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        text: text || '',
        imageUrl: imageUrl || null,
        senderUid,
        senderName,
        timestamp: serverTimestamp(),
        isRead: false,
      });

      const chatRef = doc(db, 'chats', selectedChatId);
      await updateDoc(chatRef, {
        lastMessage: { text: text || '', imageUrl: imageUrl || null, senderUid, timestamp: serverTimestamp() },
        lastMessageTime: serverTimestamp(),
        [isAdmin ? 'sellerUnreadCount' : 'adminUnreadCount']: increment(1),
      });

      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // ── Fetch other user details ──────────────────────────────────────────────
  useEffect(() => {
    const fetchOtherUserDetails = async () => {
      if (!selectedChatId) { setLocalUserDetails(null); return; }
      try {
        const chatDoc = await getDoc(doc(db, 'chats', selectedChatId));
        if (!chatDoc.exists()) return;
        const chatData = chatDoc.data();
        const otherUserUid = isAdmin ? chatData.sellerUid : chatData.adminUid;

        if (!isAdmin) {
          setLocalUserDetails({ uid: otherUserUid, displayName: 'Customer Care' });
          return;
        }

        const userDoc = await getDoc(doc(db, 'sellers', otherUserUid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLocalUserDetails({
            uid: otherUserUid,
            displayName: userData.email || 'Unknown User',
          });
        }
      } catch { /* ignore */ }
    };
    fetchOtherUserDetails();
  }, [selectedChatId, isAdmin]);

  const displayUserDetails = otherUserDetails || localUserDetails;
  const displayName =
    displayUserDetails?.displayName === 'manomano@gmail.com' ||
    displayUserDetails?.displayName === 'Customer Care'
      ? 'Customer Care'
      : displayUserDetails?.displayName || 'Chat';

  // ── Menu handlers ─────────────────────────────────────────────────────────
  const handleMenuOpen = (e) => setMenuAnchorEl(e.currentTarget);
  const handleMenuClose = () => setMenuAnchorEl(null);

  const handleDeleteChat = () => {
    if (onDeleteChat && selectedChatId) {
      if (window.confirm('Are you sure you want to clear this conversation? This will remove all messages except the initial "How can I help you?" message.')) {
        onDeleteChat(selectedChatId);
      }
    }
    handleMenuClose();
  };

  // ── Message delete ────────────────────────────────────────────────────────
  const handleMessageDelete = async (messageId) => {
    if (!messageId || !selectedChatId) return;
    try {
      setDeleteLoading(true);
      await deleteDoc(doc(db, 'chats', selectedChatId, 'messages', messageId));
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmDeleteMessage = (messageId) => { setMessageToDelete(messageId); setDeleteDialogOpen(true); };
  const handleConfirmDelete = () => {
    if (messageToDelete) handleMessageDelete(messageToDelete);
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };
  const handleCancelDelete = () => { setDeleteDialogOpen(false); setMessageToDelete(null); };

  // ── Manual refresh ────────────────────────────────────────────────────────
  const refreshMessages = async () => {
    if (!selectedChatId || refreshing) return;
    setRefreshing(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'chats', selectedChatId, 'messages'), orderBy('timestamp', 'asc')));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(list);
      if (list.length > 0) await markMessagesAsRead(list);
    } catch { /* ignore */ }
    finally { setRefreshing(false); }
  };

  // ── Online status label for the header ───────────────────────────────────
  const onlineStatusLabel = sellerIsOnline
    ? 'Online'
    : sellerLastSeen
    ? `Last seen ${formatRelativeTime(sellerLastSeen)}`
    : 'Offline';

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (!selectedChatId) {
    // Admin desktop: show a "select a conversation" prompt
    if (isAdmin) {
      return (
        <ChatWindowContainer sx={{ alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
          <Box sx={{ textAlign: 'center', p: 4, maxWidth: 320 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              bgcolor: 'primary.main', display: 'flex', alignItems: 'center',
              justifyContent: 'center', mx: 'auto', mb: 2,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="36" height="36">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
              </svg>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Select a Conversation</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a seller from the list on the left to view and reply to messages.
            </Typography>
          </Box>
        </ChatWindowContainer>
      );
    }

    // Seller: seller-facing empty state
    return (
      <ChatWindowContainer>
        <ChatHeader>
          {onBackClick && (
            <IconButton onClick={onBackClick} sx={{ position: 'absolute', left: 8, top: 8, color: 'white', [theme.breakpoints.down('sm')]: { top: 12 } }} size="small">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ mb: 2 }}>Chat</Typography>
          <AvatarIcon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
          </AvatarIcon>
          <Typography variant="h5" sx={{ fontWeight: 'medium', mb: 1 }}>Questions? Chat with us!</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Typically replies under 6 minutes</Typography>
          </Box>
          <HeaderSection>
            <Typography variant="body2">Seller Support Chat</Typography>
          </HeaderSection>
        </ChatHeader>
        <NoConversationContainer>
          <Typography variant="body1" color="text.secondary">
            Start a conversation with our customer service team
          </Typography>
        </NoConversationContainer>
      </ChatWindowContainer>
    );
  }

  // ─── Main chat view ───────────────────────────────────────────────────────
  return (
    <ChatWindowContainer>
      <ChatHeader>
        <IconButton
          onClick={onBackClick}
          sx={{ position: 'absolute', left: 8, top: 8, color: 'white', [theme.breakpoints.down('sm')]: { top: 12 } }}
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6">{displayName}</Typography>

        {/* ── Seller online / offline status (admin view) ── */}
        {isAdmin && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
            <Box
              sx={{
                width: 9, height: 9, borderRadius: '50%',
                backgroundColor: sellerIsOnline ? '#4caf50' : '#bdbdbd',
                boxShadow: sellerIsOnline ? '0 0 0 2px rgba(76,175,80,0.3)' : 'none',
                transition: 'background-color 0.4s ease',
              }}
            />
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
              {onlineStatusLabel}
            </Typography>
          </Box>
        )}

        {/* Refresh button */}
        <Tooltip title="Refresh messages">
          <IconButton
            onClick={refreshMessages}
            disabled={refreshing}
            sx={{ position: 'absolute', right: isAdmin ? 40 : 8, top: 8, color: 'white', [theme.breakpoints.down('sm')]: { top: 12 } }}
            size="small"
          >
            {refreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Admin menu */}
        {isAdmin && (
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white', [theme.breakpoints.down('sm')]: { top: 12 } }}
          >
            <MoreVertIcon />
          </IconButton>
        )}

        <HeaderSection>
          <Typography variant="body2">Seller Support Chat</Typography>
        </HeaderSection>

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleDeleteChat} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Clear Conversation
          </MenuItem>
        </Menu>
      </ChatHeader>

      {/* Seller account status banners (mobile) */}
      {!isAdmin && sellerStatus === 'pending' && (
        <Box sx={{ p: 2, bgcolor: '#FFF3E0', color: '#E65100', textAlign: 'center', fontWeight: 'bold', display: { xs: 'block', sm: 'none' } }}>
          Account is not verified. Contact your customer care.
        </Box>
      )}
      {!isAdmin && sellerStatus === 'frozen' && (
        <Box sx={{ p: 2, bgcolor: '#FFEBEE', color: 'error.dark', textAlign: 'center', fontWeight: 'bold', display: { xs: 'block', sm: 'none' } }}>
          Your account is frozen.
        </Box>
      )}

      {/* Messages */}
      <MessageContainer>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isAdmin={isAdmin}
                onDeleteMessage={isAdmin ? confirmDeleteMessage : undefined}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </MessageContainer>

      {/* Input */}
      <InputContainer>
        <ChatInput
          onSendMessage={handleSendMessage}
          isAdmin={isAdmin}
          selectedChatId={selectedChatId}
          disabled={!isAdmin && sellerStatus === 'inactive'}
        />
      </InputContainer>

      {/* Delete message dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this message for everyone? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error" variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ChatWindowContainer>
  );
};

export default ChatWindow;
