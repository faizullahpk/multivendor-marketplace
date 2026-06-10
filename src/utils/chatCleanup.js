import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

/**
 * Chat message cleanup is currently disabled — all messages are preserved permanently.
 * To re-enable deletion of messages older than a threshold, restore the logic below.
 */
export const cleanupOldChatMessages = async () => {
  // Preservation mode: no messages deleted.
  return 0;
};

/**
 * Background worker stub for chat cleanup.
 * Currently a no-op because messages are kept permanently.
 */
export const initializeChatCleanupWorker = () => {
  // No-op in preservation mode.
};
