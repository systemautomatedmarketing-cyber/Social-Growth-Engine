import { google } from "googleapis";

type Row = Record<string, string>;
const cache: Record<string, { at: number; data: Row[] }> = {};

function fixKey(k: string) {
  return (k || "").replace(/\\n/g, "\n");
}

export async function readSheet(tabName: string): Promise<Row[]> {
  const key = tabName;
  const cached = cache[key];
  if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.data;

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = fixKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:ZZ`,
  });

  const values = res.data.values || [];
  if (values.length < 2) return [];

  const headers = values[0].map((h) => String(h).trim());
  const rows = values.slice(1).map((row) => {
    const obj: Row = {};
    headers.forEach((h, i) => (obj[h] = row[i] ? String(row[i]) : ""));
    return obj;
  });

  cache[key] = { at: Date.now(), data: rows };
  return rows;
}
