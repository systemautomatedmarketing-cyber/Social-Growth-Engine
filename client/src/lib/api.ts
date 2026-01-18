import { getAuth } from "firebase/auth";
import { API_BASE } from "../config";

async function getAuthToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utente non loggato");
  }
  return await user.getIdToken();
}

export async function getTodayTasks() {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}/api/tasks/today`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}
