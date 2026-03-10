/* client/public/firebase-messaging-sw.js */

/* Firebase compat per service worker */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAOuF_M0_HjkRhzaKHnlmOgHf10qBjmHvs",
  authDomain: "social-growth-engine.firebaseapp.com",
  projectId: "social-growth-engine",
  storageBucket: "social-growth-engine.firebasestorage.app",
  messagingSenderId: "885245220430",
  appId: "1:885245220430:web:e70cdd7137e2ff4a58951f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Social Growth Engine";
  const options = {
    body: payload?.notification?.body || "Hai un aggiornamento",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload?.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = "https://app.webstudioams.it/";
  event.waitUntil(clients.openWindow(targetUrl));
});