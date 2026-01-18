import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { readSheet } from "./api/sheets";

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

async function getUidFromAuth(req: any): Promise<string> {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) throw new Error("Missing Bearer token");
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

function matches(onb: any, t: any) {
  const u = onb || {};
  const eqOrAll = (field: string, anyVal: string) => {
    const uv = String(u[field] || "");
    const tv = String(t[field] || "");
    if (!uv || !tv) return false;
    if (uv === anyVal) return true;
    if (field === "platform" && uv === "BOTH") return true;
    return uv === tv;
  };

  return (
    eqOrAll("platform", "BOTH") &&
    eqOrAll("product_type", "ALL") &&
    eqOrAll("goal", "ALL") &&
    String(u.time_mode || "") === String(t.time_mode || "") &&
    String(u.level || "") === String(t.level || "")
  );
}

// Today tasks
app.get("/api/tasks/today", async (req, res) => {
  try {
    const uid = await getUidFromAuth(req);

    const profileRef = admin.firestore().doc(`profiles/${uid}`);
    const snap = await profileRef.get();
    if (!snap.exists) return res.status(400).json({ error: "Profile missing" });

    const profile = snap.data()!;
    const program = profile.current_program || "TASKS_30D";
    const day = profile.current_day || 1;
    const onboarding = profile.onboarding || {};

    const tab = program === "TASKS_PRO_60" ? "TASKS_PRO_60" : "TASKS_30D";
    const all = await readSheet(tab);

    const tasks = all
      .filter((t) => String(t.day) === String(day))
      .filter((t) => matches(onboarding, t))
      .sort((a, b) => Number(a.task_order || 0) - Number(b.task_order || 0));

    res.json({ program, day, tasks });
  } catch (e: any) {
    res.status(401).json({ error: e.message || "Unauthorized" });
  }
});

export const api = onRequest({ region: "us-central1" }, app);
