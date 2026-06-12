importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker using actual project credentials
firebase.initializeApp({
  apiKey: "AIzaSyA1m2EIC4VVV9fO3r1KFMPa-j0GIdgq1WU",
  authDomain: "gen-lang-client-0932215682.firebaseapp.com",
  projectId: "gen-lang-client-0932215682",
  storageBucket: "gen-lang-client-0932215682.firebasestorage.app",
  messagingSenderId: "26521095497",
  appId: "1:26521095497:web:51b5b4bd7291137b5c9e98"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message: ', payload);
  const notificationTitle = payload.notification?.title || 'PulsePoint Health';
  const notificationOptions = {
    body: payload.notification?.body || 'New message received.',
    icon: '/favicon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
