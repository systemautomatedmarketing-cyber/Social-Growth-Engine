import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

import { API_BASE } from "@/config";
import { getAuth } from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


async function authFetch(pathOrUrl: string, init: RequestInit = {}) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("Not logged in");

  const token = await user.getIdToken();

  // Se è già un URL completo lo uso così, altrimenti lo prefisso con API_BASE
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${API_BASE}${pathOrUrl}`;

  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  // Se invii JSON e non hai già Content-Type, lo imposto
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}

export function useTasks() {
  const queryClient = useQueryClient();

  const todayQuery = useQuery({
    queryKey: [api.tasks.today.path],
    queryFn: async () => {
      const res = await authFetch(api.tasks.today.path);
      
      if (!res.ok) throw new Error(await res.text());
      return api.tasks.today.responses[200].parse(await res.json());
    },
  });


//  const updateStatusMutation = useMutation({
//    mutationFn: async ({
//      taskId,
//      status,
//      day,
//    }: {
//      taskId: string;
//      status: "Pending" | "Done" | "Skipped" | "Deferred";
//      day: number;
//    }) => {
//      const url = buildUrl(api.tasks.updateStatus.path, { taskId });

//      const res = await authFetch(url, {
//        method: api.tasks.updateStatus.method,
// //        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify({ status, day }),
// //        credentials: "include",
//      });
// //      if (!res.ok) throw new Error("Failed to update status");
//      if (!res.ok) throw new Error(await res.text());
//      return res.json();
//    },
//    onSuccess: () => {
//      queryClient.invalidateQueries({ queryKey: [api.tasks.today.path] });
//    },
//  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status, day }) => {
      const path = buildUrl(api.tasks.updateStatus.path, { taskId }); // /api/tasks/:taskId/status
      const res = await authFetch(path, {
        method: api.tasks.updateStatus.method, // PATCH
        body: JSON.stringify({ status, day }),
      });
      if (!res.ok) throw new Error(await res.text());
      return api.tasks.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tasks.today.path] }),
  });

  const completeDayMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch(api.tasks.completeDay.path, {
        method: api.tasks.completeDay.method,
//        credentials: "include",
      });

//      if (!res.ok) throw new Error("Failed to complete day");
      if (!res.ok) throw new Error(await res.text());
      return api.tasks.completeDay.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.today.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
    },
  });

  const generateAiMutation = useMutation({
    mutationFn: async ({
      taskId,
      variables,
//      ai_prompt_template,
    }: {
      taskId: string;
      variables: Record<string, string>;
//      ai_prompt_template: string;
    }) => {
      const res = await authFetch(api.ai.generate.path, {
        method: api.ai.generate.method,
//        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, variables}),
        //        body: JSON.stringify({ taskId, variables, instructions }),
//        body: JSON.stringify({ taskId, ai_prompt_template }),
//        credentials: "include",
      });

      console.log("AI res.status: ", res.status);


      if (!res.ok) {
        const errText = await res.text();
        console.log("AI error:", res.status, errText);
        if (res.status === 403) throw new Error(errText || "Insufficient credits");
        throw new Error(errText || "AI generation failed");
      }

//      if (!res.ok) {
//        if (res.status === 403)
//          throw new Error("Insufficient credits or pro plan required");
//        throw new Error(await res.text());
//        throw new Error("AI generation failed");
//      }

      return api.ai.generate.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.today.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
    },
  });

  const submitKpiMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch(api.kpi.submit.path, {
        method: api.kpi.submit.method,
//        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
//        credentials: "include",
      });
//      if (!res.ok) throw new Error("Failed to submit KPI");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.today.path] });
    },
  });

  return {
    todayQuery,
    updateStatusMutation,
    completeDayMutation,
    generateAiMutation,
    submitKpiMutation,
  };
}

export function useOnboarding() {
  const queryClient = useQueryClient();

//  return useMutation({
//    mutationFn: async (data: any) => {
//      const res = await fetch(api.onboarding.update.path, {
//        method: api.onboarding.update.method,
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify(data),
//        credentials: "include",
//      });
//      if (!res.ok) throw new Error("Failed to save onboarding");
//      return api.onboarding.update.responses[200].parse(await res.json());
//    },
//    onSuccess: (data) => {
//      queryClient.setQueryData([api.auth.user.path], data);
  return useMutation({
    mutationFn: async (data: any) => {
      const auth = getAuth();
      const u = auth.currentUser;
      if (!u) throw new Error("Not logged in");

//      const ref = doc(db, "users", u.uid);

      // salviamo onboarding + campi base produzione
      await setDoc(
        doc(db, "users", u.uid),
        {
          email: u.email,
          onboarding: data,
          currentDay: 1,
          creditsBalance: 0,
          plan: "FREE",
          updatedAt: new Date().toISOString(),
          onboardingCompletedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      return data;
//      return { ok: true };
    },

//    onSuccess: async () => {
      // ricarica user profile (così ProtectedRoute smette di rimandare a onboarding)

//    onSuccess: async (_res, variables) => {
     onSuccess: async (onboardingData) => {
     // variables = i dati di onboarding inviati
      queryClient.setQueryData([api.auth.user.path], (prev: any) => {
        if (!prev) return prev;
//        return { ...prev, onboarding: variables };
        return { ...prev, onboarding: onboardingData };
      });

      await queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
    },
  });
}

export function useCredits() {
  const queryClient = useQueryClient();

  console.log("queryClient: ", queryClient);

  const redeemMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await authFetch(api.credits.redeem.path, {
        method: api.credits.redeem.method,
//        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
//        credentials: "include",
      });

      console.log("res.ok: ", res.ok);

      if (!res.ok) {
        if (res.status === 400) throw new Error("Invalid or expired code");
        throw new Error(await res.text());
//        throw new Error("Redemption failed");
      }

      return api.credits.redeem.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
    },
  });

  return { redeemMutation };
}
