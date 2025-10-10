// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBXsAdcKOB4-ejUWvWa-VLnyd34JrNn9B8",
  authDomain: "ummrah-app.firebaseapp.com",
  projectId: "ummrah-app",
  storageBucket: "ummrah-app.firebasestorage.app",
  messagingSenderId: "228855311973",
  appId: "1:228855311973:web:934913880e3fca9e9e608c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = getMessaging(app);

/**
 * Requests permission for notifications and retrieves the FCM token.
 * Uses the new VAPID key approach instead of legacy key.
 * @returns {Promise<string|null>} The FCM token or null if permission denied
 */
export const requestForToken = async () => {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // TODO: Replace with your VAPID key
    const vapidKey = 'BMeb_TnFFxhGL_UM0A21T1fiPYk0NBAqWBiQQMB_JHYKcZfPP5uWf9NcfF6lwGirYuej_Ef2OjP5ktTlBJNqvl8';

    // Get the token
    const currentToken = await getToken(messaging, { vapidKey });

    if (currentToken) {
      console.log('Registration token available:', currentToken);
      // TODO: Send this token to your backend for storing and sending notifications
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

/**
 * Listens for messages when the app is in the foreground.
 * @param {Function} callback - Function to call when a message is received
 * @returns {Function} Unsubscribe function to remove the listener
 */
export const onMessageListener = (callback) => {
  try {
    return onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

export default app;
