import { google } from 'googleapis';

// Cache structure
let tasksCache: {
  TASKS_30D: any[];
  TASKS_PRO_60: any[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getTasksFromSheets() {
  const now = Date.now();
  if (tasksCache && (now - tasksCache.timestamp < CACHE_TTL)) {
    return tasksCache;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId || !clientEmail || !privateKey) {
    console.warn("Google Sheets credentials missing. Returning MOCK data for testing.");
    return { 
      TASKS_30D: [
        {
          day: 1,
          task_id: "MOCK-1",
          task_order: 1,
          task_type: "ACTION",
          title: "Setup your Profile",
          instructions: "Complete your onboarding profile to get personalized tasks. (This is a mock task because Google Sheets is not connected)",
          estimated_time: 15,
          platform: "BOTH",
          product_type: "ALL",
          goal: "ALL",
          time_mode: 15,
          level: "BEGINNER",
          credits_cost: "0",
          ai_support_available: "YES",
          ai_prompt_template: "Give me a welcome message for {{platform}}.",
          ai_variables: "platform",
          ai_feature_id: "welcome_msg"
        },
        {
          day: 1,
          task_id: "MOCK-2",
          task_order: 2,
          task_type: "ACTION",
          title: "Post your first story",
          instructions: "Share a behind-the-scenes photo.",
          estimated_time: 10,
          platform: "IG",
          product_type: "ALL",
          goal: "BRAND",
          time_mode: 15,
          level: "BEGINNER"
        }
      ], 
      TASKS_PRO_60: [], 
      timestamp: now 
    };
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const [response30, response60] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'TASKS_30D' }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'TASKS_PRO_60' }),
    ]);

    const parseRows = (rows: any[]) => {
      if (!rows || rows.length === 0) return [];
      const headers = rows[0].map((h: string) => h.toLowerCase().trim());
      // Expect headers like: day;task_id;task_order... but user said columns. 
      // If it's a CSV like structure in a single cell, we split. 
      // But typically Sheets returns columns. 
      // User said "header row with these columns: day;task_id..." - likely semicolon separated?
      // Or separate columns? "Read each tab... parse rows into objects".
      // Assuming standard columns for simplicity. If semicolon in one cell, we'd need to split.
      // Let's assume standard columns.
      
      return rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index];
        });
        // Convert types
        obj.day = parseInt(obj.day) || 0;
        obj.task_order = parseInt(obj.task_order) || 0;
        obj.estimated_time = parseInt(obj.estimated_time) || 0;
        return obj;
      });
    };

    tasksCache = {
      TASKS_30D: parseRows(response30.data.values || []),
      TASKS_PRO_60: parseRows(response60.data.values || []),
      timestamp: now,
    };
    
    return tasksCache;
  } catch (error) {
    console.error("Error fetching sheets:", error);
    return { TASKS_30D: [], TASKS_PRO_60: [], timestamp: now };
  }
}
