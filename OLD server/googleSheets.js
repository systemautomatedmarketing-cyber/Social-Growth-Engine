import { google } from "googleapis";

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE service account env vars.");
  }

  // Fix newline escaping in env var
  privateKey = privateKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

const inMemoryCache = new Map(); 
// key -> { expiresAt:number, data:any[] }

function parseRowsToObjects(values) {
  if (!values || values.length < 2) return [];
  const headers = values[0].map((h) => String(h ?? "").trim());
  const rows = values.slice(1);

  return rows
    .filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = String(r[i] ?? "").trim();
      });
      return obj;
    });
}

export async function readSheetAsObjects(sheetName, ttlSeconds = 300) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID.");

  const cacheKey = `${spreadsheetId}:${sheetName}`;
  const now = Date.now();

  const cached = inMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.data;

  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const range = `${sheetName}!A:ZZ`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

  const values = res.data.values ?? [];
  const data = parseRowsToObjects(values);

  inMemoryCache.set(cacheKey, { expiresAt: now + ttlSeconds * 1000, data });
  return data;
}
