import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

let heartbeatInterval = null;
let currentSellerId = null;
let visibilityHandler = null;
let unloadHandler = null;

/**
 * Updates isOnline and lastSeen fields on the seller's Firestore document.
 */
const updatePresence = async (sellerId, isOnline) => {
  if (!sellerId) return;
  try {
    await updateDoc(doc(db, 'sellers', sellerId), {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  } catch {
    // Silently fail – the seller doc may not have been created yet, or network is gone.
  }
};

/**
 * Call this once when a seller loads the app.
 * Returns a cleanup function to call on logout / component unmount.
 */
export const initSellerPresence = (sellerId) => {
  if (!sellerId) return () => {};
  // Avoid re-initialising for the same seller
  if (currentSellerId === sellerId) return () => cleanup(sellerId);

  // Clean up any previous session first
  if (currentSellerId) cleanup(currentSellerId);

  currentSellerId = sellerId;

  // --- Go online immediately ---
  updatePresence(sellerId, true);

  // --- Heartbeat every 30 s (only when tab is visible) ---
  heartbeatInterval = setInterval(() => {
    if (document.visibilityState !== 'hidden') {
      updatePresence(sellerId, true);
    }
  }, 30_000);

  // --- Visibility change (tab switch / minimise) ---
  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      updatePresence(sellerId, false);
    } else {
      updatePresence(sellerId, true);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  // --- Page/tab close ---
  unloadHandler = () => updatePresence(sellerId, false);
  window.addEventListener('beforeunload', unloadHandler);

  return () => cleanup(sellerId);
};

const cleanup = (sellerId) => {
  if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
  if (visibilityHandler) { document.removeEventListener('visibilitychange', visibilityHandler); visibilityHandler = null; }
  if (unloadHandler) { window.removeEventListener('beforeunload', unloadHandler); unloadHandler = null; }
  currentSellerId = null;
  updatePresence(sellerId, false);
};

/** Manually mark seller offline (call on logout). */
export const cleanupSellerPresence = (sellerId) => cleanup(sellerId);
