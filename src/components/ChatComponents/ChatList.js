import React from 'react';
import {
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Typography, Badge, Divider, Box, styled, alpha, Tooltip
} from '@mui/material';

// ─── Styled helpers ───────────────────────────────────────────────────────────

const StyledListItem = styled(ListItem)(({ theme, isSelected }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  backgroundColor: isSelected
    ? alpha(theme.palette.primary.main, 0.1)
    : 'transparent',
  '&:hover': {
    backgroundColor: isSelected
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.action.hover, 0.1),
  },
}));

const UnreadBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3, top: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

const TruncatedText = styled(Typography)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/**
 * Small coloured dot that shows online/offline presence.
 * isOnline = true  → filled green
 * isOnline = false → hollow grey
 */
const PresenceDot = ({ isOnline, lastSeen }) => {
  const label = isOnline ? 'Online' : lastSeen ? `Last seen ${formatRelativeTime(lastSeen)}` : 'Offline';

  return (
    <Tooltip title={label} placement="top" arrow>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: isOnline ? '#4caf50' : '#bdbdbd',
          border: '2px solid white',
          boxShadow: isOnline ? '0 0 0 1px #4caf50' : 'none',
          flexShrink: 0,
          transition: 'background-color 0.3s ease',
        }}
      />
    </Tooltip>
  );
};

/** Formats a Firestore Timestamp into a relative string like "2 min ago". */
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

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.getFullYear() === now.getFullYear())
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
};

// ─── ChatList component ───────────────────────────────────────────────────────

/**
 * Props:
 *   chats            – array of chat objects (may include sellerIsOnline, sellerLastSeen)
 *   selectedChatId   – currently selected chat ID
 *   onSelectChat     – callback(chatId)
 *   currentUserIsAdmin – boolean
 */
const ChatList = ({ chats, selectedChatId, onSelectChat, currentUserIsAdmin }) => {
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
      {chats.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {currentUserIsAdmin
              ? 'No sellers have started a conversation yet'
              : 'Start a conversation with admin'}
          </Typography>
        </Box>
      ) : (
        chats.map((chat, index) => {
          const isCustomerCare =
            chat.otherUserName === 'manomano@gmail.com' ||
            chat.otherUserName === 'Customer Care';
          const displayName = isCustomerCare ? 'Customer Care' : (chat.otherUserName || 'Unknown User');
          const avatarLetter = isCustomerCare ? 'C' : (chat.otherUserName?.charAt(0)?.toUpperCase() || '?');

          // Online / offline data (populated by Chat.js for the admin view)
          const isOnline = chat.sellerIsOnline ?? false;
          const lastSeen = chat.sellerLastSeen ?? null;

          return (
            <React.Fragment key={chat.id}>
              <StyledListItem
                isSelected={selectedChatId === chat.id}
                onClick={() => onSelectChat(chat.id)}
                alignItems="flex-start"
              >
                <ListItemAvatar>
                  {/* Avatar with online presence dot overlay */}
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar alt={displayName}>{avatarLetter}</Avatar>
                    {/* Show presence dot only in admin view for seller chats */}
                    {currentUserIsAdmin && !isCustomerCare && (
                      <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                        <PresenceDot isOnline={isOnline} lastSeen={lastSeen} />
                      </Box>
                    )}
                  </Box>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <TruncatedText variant="subtitle2" sx={{ fontWeight: chat.unreadCount > 0 ? 700 : 400 }}>
                        {displayName}
                      </TruncatedText>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                        {formatTime(chat.lastMessageTime)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <TruncatedText
                      variant="body2"
                      color={chat.unreadCount > 0 ? 'text.primary' : 'text.secondary'}
                      sx={{ fontWeight: chat.unreadCount > 0 ? 500 : 400, display: 'inline' }}
                    >
                      {chat.lastMessage && (
                        chat.lastMessage.imageUrl ? '🖼️ Image' : (chat.lastMessage.text || 'No messages yet')
                      )}
                    </TruncatedText>
                  }
                />

                {chat.unreadCount > 0 && (
                  <UnreadBadge badgeContent={chat.unreadCount} color="primary" sx={{ alignSelf: 'center', ml: 1 }} />
                )}
              </StyledListItem>
              {index < chats.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          );
        })
      )}
    </List>
  );
};

export default ChatList;
