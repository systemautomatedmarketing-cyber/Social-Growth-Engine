import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { dayDocId } from "@/lib/dayKey";

export type CarryTask = {
  originalDay: number;
  originalTaskId: string;
  taskSnapshot: any; // snapshot del task com'è oggi (title, instructions, ecc)
};

export type DeferralsDoc = {
  hiddenTaskIds?: string[];
  carryOver?: CarryTask[];
  updatedAt?: any;
};

export async function getDeferrals(uid: string, day: number): Promise<DeferralsDoc> {
  const ref = doc(db, "users", uid, "deferrals", dayDocId(day));
  const snap = await getDoc(ref);
  return (snap.exists() ? (snap.data() as DeferralsDoc) : {}) ?? {};
}

/**
 * Rimanda un task da `fromDay` a `toDay` (di default fromDay+1).
 * - lo nasconde nel giorno fromDay
 * - lo aggiunge a carryOver del giorno toDay (in cima)
 * - se replacementTaskSnapshot è presente, lo aggiunge oggi come carryOver "locale" (vedi Step 5)
 */
export async function deferTask(params: {
  uid: string;
  fromDay: number;
  task: any; // task di oggi (contiene task_id)
  replacementTaskSnapshot?: any; // task sostitutivo (snapshot)
}) {


 // ✅ PRIMA estraggo i valori
  const { uid, fromDay, task, replacementTaskSnapshot } = params;

  // ✅ POI faccio i guard
if (!uid) throw new Error("deferTask: uid mancante");
if (typeof fromDay !== "number") throw new Error("deferTask: fromDay non valido");
if (!task?.task_id) throw new Error("deferTask: task.task_id mancante");

//  const { uid, fromDay, task, replacementTaskSnapshot } = params;
  const toDay = fromDay + 1;

  const fromRef = doc(db, "users", uid, "deferrals", dayDocId(fromDay));
  const toRef = doc(db, "users", uid, "deferrals", dayDocId(toDay));

  await runTransaction(db, async (tx) => {
    const fromSnap = await tx.get(fromRef);
    const toSnap = await tx.get(toRef);

    const fromData: DeferralsDoc = fromSnap.exists() ? (fromSnap.data() as any) : {};
    const toData: DeferralsDoc = toSnap.exists() ? (toSnap.data() as any) : {};

    const hidden = new Set(fromData.hiddenTaskIds ?? []);
    hidden.add(task.task_id);

    const carry: CarryTask[] = Array.isArray(toData.carryOver) ? [...toData.carryOver] : [];

    // evita doppi rimandi uguali
    const already = carry.some((c) => c.originalTaskId === task.task_id && c.originalDay === fromDay);
    if (!already) {
      carry.unshift({
        originalDay: fromDay,
        originalTaskId: task.task_id,
        taskSnapshot: task,
      });
    }

    tx.set(fromRef, { hiddenTaskIds: [...hidden], updatedAt: serverTimestamp() }, { merge: true });
    tx.set(toRef, { carryOver: carry, updatedAt: serverTimestamp() }, { merge: true });

    // Se c'è sostituzione: mettiamo il sostitutivo "oggi" come carryOver locale
    // (così appare subito nella lista senza toccare backend)
    if (replacementTaskSnapshot) {
      const todayCarry: CarryTask[] = Array.isArray(fromData.carryOver) ? [...fromData.carryOver] : [];
      todayCarry.unshift({
        originalDay: fromDay, // è “nativo” oggi
        originalTaskId: `REPLACEMENT:${crypto.randomUUID()}`,
        taskSnapshot: replacementTaskSnapshot,
      });
      tx.set(fromRef, { carryOver: todayCarry, updatedAt: serverTimestamp() }, { merge: true });
    }
  });
}

export async function setInjectedTaskStatus(params: {
  uid: string;
  day: number;
  carryOriginalTaskId: string;
  status: "Done" | "Skipped" | "Pending";
}) {
  const { uid, day, carryOriginalTaskId, status } = params;

  const ref = doc(db, "users", uid, "deferrals", dayDocId(day));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Deferrals doc not found");

    const data = snap.data() as any;
    const carry = Array.isArray(data.carryOver) ? [...data.carryOver] : [];

    const idx = carry.findIndex((c: any) => c.originalTaskId === carryOriginalTaskId);
    if (idx === -1) throw new Error("Injected task not found in carryOver");

    // aggiorno lo snapshot che poi la UI renderizza
    carry[idx] = {
      ...carry[idx],
      taskSnapshot: {
        ...carry[idx].taskSnapshot,
        status,
      },
    };

    tx.set(ref, { carryOver: carry, updatedAt: serverTimestamp() }, { merge: true });
  });
}