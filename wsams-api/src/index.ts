/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // se in futuro aggiungi binding KV/D1/Secrets li metti qui
  // Vars (wrangler.toml)

  GOOGLE_SHEETS_SPREADSHEET_ID: string;
  TASKS_TAB: string;

  FIREBASE_PROJECT_ID: string;
  FIREBASE_WEB_API_KEY: string;

  // Secrets (wrangler secret put)
  GS_CLIENT_EMAIL: string;
  GS_PRIVATE_KEY: string;

  FB_CLIENT_EMAIL: string;
  FB_PRIVATE_KEY: string;
}

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://social-growth-engine.web.app",
  "https://social-growth-engine.firebaseapp.com",
]);

const DEFAULT_ORIGIN = "http://localhost:5173";

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function withCors(resp: Response, origin: string | null) {
  const headers = new Headers(resp.headers);
  const cors = corsHeaders(origin);
  Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
}

function normalizeStatus(input: unknown, fallback = 500) {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return fallback;
  const s = Math.trunc(n);
  if (s < 200 || s > 599) return fallback;
  return s;
}

function json(data: unknown, status: unknown = 200, origin: string | null = null) {
  const safeStatus = normalizeStatus(status, 500);
  const resp = new Response(JSON.stringify(data), {
    status: safeStatus,
    headers: { "Content-Type": "application/json" },
  });
  return withCors(resp, origin);
}

// function json(data: unknown, status = 200, origin: string | null = null) {
//  const resp = new Response(JSON.stringify(data), {
//    status,
//    headers: { "Content-Type": "application/json" },
//  });
//  return withCors(resp, origin);
// }

function text(data: string, origin: string | null, status = 200) {
  return new Response(data, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

// ---------- JWT / Service Account OAuth (RS256 via WebCrypto) ----------
function pemToArrayBuffer(pem: string) {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\n/g, "")
    .trim();

//    .replace(/\s+/g, "")

//  console.log("b64: ", b64);

  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

function base64url(input: ArrayBuffer | Uint8Array | string) {
  let bytes: Uint8Array;
  if (typeof input === "string") bytes = new TextEncoder().encode(input);
  else bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwtRS256(privateKeyPem: string, data: string) {
  const keyBuf = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuf,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(data));
  return base64url(sig);
}

async function getServiceAccountAccessToken(clientEmail: string, privateKeyPem: string, scopes: string[]) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await signJwtRS256(privateKeyPem, toSign);
  const assertion = `${toSign}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) throw new Error(`OAuth token error: ${await res.text()}`);
  const data = await res.json() as { access_token: string };

  return data.access_token;
}

// ---------- Firebase verify token (simple: IdentityToolkit lookup) ----------
async function getFirebaseUidFromIdToken(idToken: string, firebaseWebApiKey: string) {
  
//  console.log("url: https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=$", firebaseWebApiKey);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseWebApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

//  console.log("res check = ", res.ok);
//  console.log("res json = ", res.json);


//  if (!res.ok) throw new Error(`Token verify failed: ${await res.text()}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`accounts:lookup failed (${res.status}): ${t}`);
  }

  const data = await res.json() as any;
  const uid = data?.users?.[0]?.localId;
  if (!uid) throw new Error("No uid in token verify response");
  return uid as string;
}

// ---------- Google Sheets read ----------
type SheetTask = Record<string, any>;

async function readTasksFromSheet(env: Env): Promise<SheetTask[]> {

  const accessToken = await getServiceAccountAccessToken(
    env.GS_CLIENT_EMAIL,
    env.GS_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  );


  // prendo tutto il tab
  const range = encodeURIComponent(`${env.TASKS_TAB}!A:AD`);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_SPREADSHEET_ID}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Sheets read error: ${await res.text()}`);
  const data = await res.json() as { values?: string[][] };

  const rows = data.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  const tasks: SheetTask[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const obj: SheetTask = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c] ?? "";
    }
    tasks.push(obj);
  }

  return tasks;
}

// ---------- Firestore read/write (REST) ----------
async function firestoreGetUserTaskStatuses(env: Env, uid: string, programId: string, day: number) {

  const token = await getServiceAccountAccessToken(
    env.FB_CLIENT_EMAIL,
    env.FB_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/datastore"]
  );


  // userTasks subcollection: users/{uid}/userTasks/{programId_day_taskId}
  // per MVP: leggiamo doc "dayStatus": users/{uid}/days/{programId_day}
  const docId = `${programId}_${day}`;
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}/days/${docId}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (res.status === 404) return {}; // nessun completamento ancora
//  if (!res.ok) throw new Error(`Firestore read error: ${await res.text()}`);
  if (!res.ok) {
    const errText = await res.text();
    console.log("Firestore error body:", errText);
    throw new Error(`Firestore read error: ${errText}`);
  }


  const data = await res.json() as any;
  const fields = data.fields ?? {};
  // fields.statuses = map taskId -> status
  const statuses: Record<string, string> = {};

  const map = fields.statuses?.mapValue?.fields ?? {};
  for (const [k, v] of Object.entries(map)) {
    // @ts-ignore
    statuses[k] = v?.stringValue ?? "Pending";
  }
  return statuses;
}

async function firestoreSetTaskStatus(env: Env, uid: string, programId: string, day: number, taskId: string, status: string) {

  const token = await getServiceAccountAccessToken(
    env.FB_CLIENT_EMAIL,
    env.FB_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/datastore"]
  );

  const docId = `${programId}_${day}`;
//  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}/days/${docId}?updateMask.fieldPaths=statuses`;
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}/days/${docId}` +
  `?updateMask.fieldPaths=statuses&updateMask.fieldPaths=updatedAt`;


  // Firestore REST "map" structure
  const body = {
    fields: {
      statuses: {
        mapValue: {
          fields: {
            [taskId]: { stringValue: status },
          },
        },
      },
      updatedAt: { timestampValue: new Date().toISOString() },
    },
  };

  // PATCH crea/aggiorna doc
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Firestore write error: ${await res.text()}`);
  return true;
}

async function firestoreGetDoc(env: Env, path: string) {
  const token = await getServiceAccountAccessToken(
    env.FB_CLIENT_EMAIL,
    env.FB_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/datastore"]
  );

  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (res.status === 404) return { exists: false, data: null as any };
  if (!res.ok) throw new Error(`Firestore GET error: ${await res.text()}`);

  return { exists: true, data: await res.json() };
}

function fsNumber(doc: any, field: string, fallback = 0) {
  const v = doc?.fields?.[field];
  const n = v?.integerValue ?? v?.doubleValue;
  return n !== undefined ? Number(n) : fallback;
}
function fsBool(doc: any, field: string, fallback = false) {
  const v = doc?.fields?.[field];
  return v?.booleanValue ?? fallback;
}

async function firestorePatchDoc(env: Env, path: string, fields: any, updateMask: string[]) {
  const token = await getServiceAccountAccessToken(
    env.FB_CLIENT_EMAIL,
    env.FB_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/datastore"]
  );

  const qs = updateMask.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}?${qs}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) throw new Error(`Firestore PATCH error: ${await res.text()}`);
  return true;
}


// ---------- API ----------
export default {
//  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const origin = request.headers.get("Origin");
//    const url = new URL(request.url);

    // ✅ Preflight CORS
//    if (request.method === "OPTIONS") {
//      return new Response(null, {
//        status: 204,
//        headers: corsHeaders(origin),
//      });
//    }

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), origin);
    }

    try {

      const url = new URL(request.url);

// Auth: token Firebase dal client
      const authHeader = request.headers.get("Authorization") || "";

      const m = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!m) return json({ error: "Missing Authorization Bearer token" }, 401, origin);

      let uid: string;

//      try {
        uid = await getFirebaseUidFromIdToken(m[1], env.FIREBASE_WEB_API_KEY);

//      } catch (e: any) {
//      return json({ error: e.message || "Invalid token" }, 401, origin);
	
//        console.log("json");

//        return json(
//          {
//            error: "Token verify failed",
//            details: e?.message ?? String(e),
//            hint: "Controlla FIREBASE_WEB_API_KEY nel Worker e che appartenga allo stesso progetto del client",
//          },
//          origin, 401
//        );
        

//      }

    // GET tasks today: legge sheet + statuses da firestore
      if (request.method === "GET" && url.pathname === "/api/tasks/today") {
      // MVP: day fisso 1 (poi lo leggiamo dal profilo users/{uid})
//        const programId = "TASKS_30D";
//        const day = 1;

        const userDoc = await firestoreGetDoc(env, `users/${uid}`);
        const day = userDoc.exists ? fsNumber(userDoc.data, "currentDay", 1) : 1;
        const programId = userDoc.exists ? (userDoc.data?.fields?.currentProgram?.stringValue ?? "TASKS_30D") : "TASKS_30D";

        const all = await readTasksFromSheet(env);

        const dayTasks = all
          .filter((t) => String(t.day).trim() === String(day))
          .sort((a, b) => Number(a.task_order || 0) - Number(b.task_order || 0))
          .map((t) => ({
            ...t,
          // normalizza nomi
            day: Number(t.day || 0),
            task_order: Number(t.task_order || 0),
            estimated_time: Number(t.estimated_time || 0),
            credits_cost: Number(t.credits_cost || 0),
            kpi_target: Number(t.kpi_target || 0),
//            task_id: t.task_id,
//            title: t.title,
//            instructions: t.instructions,
//            estimated_time: t.estimated_time,
        }));

        const statuses = await firestoreGetUserTaskStatuses(env, uid, programId, day);

        const tasksWithStatus = dayTasks.map((t: any) => ({
          ...t,
//          day: Number(t.day),
//          program: t.task_id,
//          tasks: t,
//          isComplete: statuses[t.task_id] || "Pending",
//          status: statuses[t.task_id] || "Pending",
          status: statuses[t.task_id] || "Pending", // ✅ campo status nel task
        }));

        const isComplete = tasksWithStatus.length > 0 && tasksWithStatus.every((t: any) => t.status === "Done");

        return json(
          {
            day,                 // number ✅
            program: programId,  // string ✅
            tasks: tasksWithStatus,
            isComplete,          // boolean ✅
          },
          200,
          origin
        );

//        return json({ tasks: tasksWithStatus }, 200, origin);
//        return json({ error: "Not found" }, 404, origin);
      }

    // POST /api/tasks/:taskId/status
      const matchStatus = url.pathname.match(/^\/api\/tasks\/([^/]+)\/status$/);
      if ((request.method === "POST" || request.method === "PATCH") && matchStatus) {
        const taskId = decodeURIComponent(matchStatus[1]);
        const body = await request.json().catch(() => ({}));
        const status = body?.status;
        const day = Number(body?.day || 1);
        const programId = "TASKS_30D";

        const allowed = new Set(["Pending", "Done", "Skipped", "Deferred"]);
        if (!allowed.has(status)) return json({ error: "Invalid status" }, 400, origin);
//        if (!status) return json({ error: "Missing status" }, 400, origin);

        await firestoreSetTaskStatus(env, uid, programId, day, taskId, status);
//        return json({ ok: true }, 200, origin);
        return json({ success: true }, 200, origin);
      }

// POST /api/credits/redeem
      if (request.method === "POST" && url.pathname === "/api/credits/redeem") {
        const body = await request.json().catch(() => ({}));
        const rawCode = String(body?.code || "").trim();
        if (!rawCode) return json({ message: "Missing code" }, 400, origin);

        const code = rawCode.toUpperCase();

        // 1) blocco riuso per utente
        const redeemedPath = `users/${uid}/redeemedCodes/${encodeURIComponent(code)}`;
        const redeemed = await firestoreGetDoc(env, redeemedPath);
        if (redeemed.exists) {
          return json({ message: "Code already used" }, 400, origin);
        }

        // 2) leggo info codice
        const codePath = `redeemCodes/${encodeURIComponent(code)}`;
        const codeDoc = await firestoreGetDoc(env, codePath);
        if (!codeDoc.exists) return json({ message: "Invalid code" }, 400, origin);

        const active = fsBool(codeDoc.data, "active", false);
        const creditsAdded = fsNumber(codeDoc.data, "creditsAdded", 0);
        if (!active || creditsAdded <= 0) return json({ message: "Invalid or inactive code" }, 400, origin);

        // 3) leggo saldo utente
        const userPath = `users/${uid}`;
        const userDoc = await firestoreGetDoc(env, userPath);
        const oldBalance = userDoc.exists ? fsNumber(userDoc.data, "creditsBalance", 0) : 0;
        const newBalance = oldBalance + creditsAdded;

        // 4) scrivo nuovo saldo utente
        await firestorePatchDoc(
          env,
          userPath,
          {
             creditsBalance: { integerValue: String(newBalance) },
             updatedAt: { timestampValue: new Date().toISOString() },
          },
          ["creditsBalance", "updatedAt"]
        );

        // 5) segno che questo utente ha usato il codice (anti-riuso)
        await firestorePatchDoc(
          env,
          `users/${uid}/redeemedCodes/${encodeURIComponent(code)}`,
          {
            code: { stringValue: code },
            redeemedAt: { timestampValue: new Date().toISOString() },
            creditsAdded: { integerValue: String(creditsAdded) },
          },
          ["code", "redeemedAt", "creditsAdded"]
        );

        // ✅ risposta conforme allo schema routes.ts
        return json(
          { success: true, creditsAdded, newBalance },
          200,
          origin
        );
      }

      // POST /api/ai/generate (MVP: restituisce prompt compilato)
      if (request.method === "POST" && url.pathname === "/api/ai/generate") {
        const body = await request.json().catch(() => ({}));
        const taskId = String(body?.taskId || "").trim();
        const variables = (body?.variables || {}) as Record<string, string>;

        if (!taskId) return json({ message: "Missing taskId" }, 400, origin);

        const programId = "TASKS_30D";
        const day = 1;

        // Recupera i task dal foglio (usa la tua funzione già esistente)
//        const tasks = await sheetsGetTasksForDay(env, programId, day); // <-- se il tuo helper ha un altro nome, dimmelo e lo adatto
//        const task = tasks.find((t: any) => String(t.task_id) === taskId);

        // 1) Leggi tutti i task dal Google Sheet e trova quello richiesto
        const all = await readTasksFromSheet(env);
        const task = all.find((t: any) => String(t.task_id).trim() === taskId);

        if (!task) return json({ message: "Task not found" }, 404, origin);

        const template = String(task.ai_prompt_template || "").trim();
        if (!template) return json({ message: "No AI template for this task" }, 400, origin);

//        // Sostituzione {variabile}
//        const compiled = template.replace(/\{(\w+)\}/g, (_, key) => variables?.[key] ?? `{${key}}`);

//        return json(
//          {
//            success: true,
//            output: compiled,
//            taskId,
//          },
//          200,
//          origin
//        );
//      }

        // 2) Compila il prompt sostituendo {variabile}
        const output = template.replace(/\{(\w+)\}/g, (_, key) => {
        const val = variables?.[key];
        return (val !== undefined && val !== null && String(val).trim() !== "")
          ? String(val)
          : `{${key}}`;
        });

        // 3) (MVP) decurta crediti in base al task
        const cost = Number(task.credits_cost || 0);

        // Se cost 0, non decurtare
//        if (cost > 0) {
          const userPath = `users/${uid}`;
          const userDoc = await firestoreGetDoc(env, userPath);
//          const oldBalance = userDoc.exists ? fsNumber(userDoc.data, "creditsBalance", 0) : 0;
          const plan = userDoc.exists ? (userDoc.data?.fields?.plan?.stringValue ?? "FREE") : "FREE";
          const isPro = plan === "PRO";

        if (!isPro && cost >0) {
          const oldBalance = userDoc.exists ? fsNumber(userDoc.data, "creditsBalance", 0) : 0;

          if (oldBalance < cost) {
            return json({ message: "Insufficient credits" }, 403, origin);
          }

          const newBalance = oldBalance - cost;

          await firestorePatchDoc(
            env,
            userPath,
            {
              creditsBalance: { integerValue: String(newBalance) },
              updatedAt: { timestampValue: new Date().toISOString() },
            },
            ["creditsBalance", "updatedAt"]
          );
      }

  // 4) Risposta per il frontend
  return json(
    {
      output,
//      creditsDeducted: cost,
      creditsDeducted: isPro ? 0 : cost,
      isPro, // opzionale ma utile
    },
    200,
    origin
  );
}

if (request.method === "POST" && url.pathname === "/api/tasks/complete-day") {
  const userPath = `users/${uid}`;
  const userDoc = await firestoreGetDoc(env, userPath);

  const currentDay = userDoc.exists ? fsNumber(userDoc.data, "currentDay", 1) : 1;
  const currentProgram = userDoc.exists ? (userDoc.data?.fields?.currentProgram?.stringValue ?? "TASKS_30D") : "TASKS_30D";

  const newDay = currentDay + 1;

  await firestorePatchDoc(
    env,
    userPath,
    {
      currentDay: { integerValue: String(newDay) },
      currentProgram: { stringValue: currentProgram },
      updatedAt: { timestampValue: new Date().toISOString() },
    },
    ["currentDay", "currentProgram", "updatedAt"]
  );

  return json({ newDay, newProgram: currentProgram }, 200, origin);
}


      // fallback
      return text("Not Found", origin, 404);
    } catch (err: any) {
      // ✅ anche il 500 deve avere CORS
      return json(
        { error: "Internal error", message: err?.message || String(err), stack: err?.stack || null, },
        500,
        origin,
      );
    }
  },
} satisfies ExportedHandler<Env>;
