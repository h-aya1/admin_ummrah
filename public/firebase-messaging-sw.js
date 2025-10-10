// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBXsAdcKOB4-ejUWvWa-VLnyd34JrNn9B8",
  authDomain: "ummrah-app.firebaseapp.com",
  projectId: "ummrah-app",
  storageBucket: "ummrah-app.firebasestorage.app",
  messagingSenderId: "228855311973",
  appId: "1:228855311973:web:934913880e3fca9e9e608c"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Umrah Admin Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/vite.svg', // You can replace this with your app icon
    badge: '/vite.svg',
    tag: payload.data?.tag || 'umrah-admin-notification',
    requireInteraction: false,
    silent: false,
    // Add custom data if needed
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // You can customize what happens when notification is clicked
  // For example, focus on the app window or navigate to a specific page
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no suitable window is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});
