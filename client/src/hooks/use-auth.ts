import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@shared/routes";

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

import { onAuthStateChanged, sendPasswordResetEmail  } from "firebase/auth";
//import { doc, getDoc } from "firebase/firestore";
//import { db } from "@/lib/firebase";

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TRIAL_DAYS = 40;
const ms = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Se la tua UI legge user da qui, per ora mettiamo user=null
  // Poi nel prossimo step lo colleghiamo a Firestore / Worker (profilo).
  const userQuery = useQuery({
    queryKey: [api.auth.user.path],
    queryFn: async () => {
      const auth = getAuth();

  // aspetta che Firebase abbia deciso se c'è un utente loggato
    const fbUser = await new Promise<any>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        resolve(u);
      });
    });

    if (!fbUser) return null;

    // Leggi profilo Firestore
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);

    // Profilo base (se non esiste ancora)
    const baseProfile = {
      id: fbUser.uid,
      email: fbUser.email,
      currentDay: 1,
      creditsBalance: 0,
//      plan: "FREE",
      plan: "TRIAL",
      onboarding: null,
    };

    if (!snap.exists()) return baseProfile;

    return { ...baseProfile, ...snap.data() };
  },
});

//      const u = auth.currentUser;
//      if (!u) return null;
      // ritorniamo un oggetto minimo per non rompere la UI
//      return {
//        id: u.uid,
//        email: u.email,
//        currentDay: 1,
//        creditsBalance: 0,
//        plan: "FREE",
//      };
//    },
//  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const auth = getAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
      setLocation("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const auth = getAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred.user;
    },
//    onSuccess: async () => {
    onSuccess: async (fbUser) => {
      const trialEndsAt = Timestamp.fromMillis(Date.now() + ms);

      await setDoc(
        doc(db, "users", fbUser.uid),
        {
          email: fbUser.email,
          plan: "TRIAL",
          trialStartedAt: serverTimestamp(),
          trialEndsAt,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
      setLocation("/onboarding");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const auth = getAuth();
      const normalized = email.trim().toLowerCase();
      await sendPasswordResetEmail(auth, email);
      return true;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      await signOut(auth);
      return true;
    },
    onSuccess: async () => {
      queryClient.setQueryData([api.auth.user.path], null);
      setLocation("/auth");
    },
  });

const updateProfileMutation = useMutation({
  mutationFn: async ({ firstName, lastName}: { firstName: string; lastName: string }) => {
  const auth = getAuth();
  if (!auth) throw new Error("Non autenticato");
  await updateDoc(doc(db, "users", auth.uid), { firstName, lastName});
    return true;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.auth.user.path] }), // o la tua query user
});

const updateEmailMutation = useMutation({
  mutationFn: async ({ newEmail, currentPassword }: { newEmail: string; currentPassword: string }) => {
    const u = auth.currentUser;
    if (!u?.email) throw new Error("Non autenticato");

    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);

    await updateEmail(u, newEmail.trim().toLowerCase());
    return true;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }),
});

const updatePasswordMutation = useMutation({
  mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    const u = auth.currentUser;
    if (!u?.email) throw new Error("Non autenticato");

    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);

    await updatePassword(u, newPassword);
    return true;
  },
});

  return {
    user: userQuery.data as any,
    isLoading: userQuery.isLoading,
    loginMutation,
    registerMutation,
    logoutMutation,
    resetPasswordMutation,
    updateProfileMutation,
    updateEmailMutation,
    updatePasswordMutation,
  };
}
