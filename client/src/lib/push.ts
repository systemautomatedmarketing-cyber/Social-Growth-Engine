/* client/src/lib/push.ts */

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export async function enablePushNotifications() {
  const supported = await isSupported();
  if (!supported) {
    throw new Error("Questo browser non supporta le notifiche push FCM.");
  }

  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utente non loggato.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permesso notifiche non concesso.");
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Token notifiche non ottenuto.");
  }

  await setDoc(
    doc(db, "users", user.uid, "pushTokens", token),
    {
      token,
      enabled: true,
      platform: "web",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "users", user.uid),
    {
      notificationsEnabled: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return token;
}