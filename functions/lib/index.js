"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sheets_1 = require("./api/sheets");
admin.initializeApp();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: "2mb" }));
// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));
async function getUidFromAuth(req) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token)
        throw new Error("Missing Bearer token");
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
}
function matches(onb, t) {
    const u = onb || {};
    const eqOrAll = (field, anyVal) => {
        const uv = String(u[field] || "");
        const tv = String(t[field] || "");
        if (!uv || !tv)
            return false;
        if (uv === anyVal)
            return true;
        if (field === "platform" && uv === "BOTH")
            return true;
        return uv === tv;
    };
    return (eqOrAll("platform", "BOTH") &&
        eqOrAll("product_type", "ALL") &&
        eqOrAll("goal", "ALL") &&
        String(u.time_mode || "") === String(t.time_mode || "") &&
        String(u.level || "") === String(t.level || ""));
}
// Today tasks
app.get("/api/tasks/today", async (req, res) => {
    try {
        const uid = await getUidFromAuth(req);
        const profileRef = admin.firestore().doc(`profiles/${uid}`);
        const snap = await profileRef.get();
        if (!snap.exists)
            return res.status(400).json({ error: "Profile missing" });
        const profile = snap.data();
        const program = profile.current_program || "TASKS_30D";
        const day = profile.current_day || 1;
        const onboarding = profile.onboarding || {};
        const tab = program === "TASKS_PRO_60" ? "TASKS_PRO_60" : "TASKS_30D";
        const all = await (0, sheets_1.readSheet)(tab);
        const tasks = all
            .filter((t) => String(t.day) === String(day))
            .filter((t) => matches(onboarding, t))
            .sort((a, b) => Number(a.task_order || 0) - Number(b.task_order || 0));
        res.json({ program, day, tasks });
    }
    catch (e) {
        res.status(401).json({ error: e.message || "Unauthorized" });
    }
});
exports.api = (0, https_1.onRequest)({ region: "us-central1" }, app);
