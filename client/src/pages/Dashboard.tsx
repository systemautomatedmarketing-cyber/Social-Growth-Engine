import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { Navigation } from "@/components/Navigation";
import { TaskCard } from "@/components/TaskCard";
import { KPIDialog } from "@/components/KPIDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Trophy, Loader2, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Menu, LogOut, UserCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useEffect } from "react";

export default function Dashboard() {
//  const { user } = useAuth();
  const { user, logoutMutation  } = useAuth();

//  const { todayQuery } = useTasks();
  const { todayQuery, completeDayMutation } = useTasks();
  const [kpiOpen, setKpiOpen] = useState(false);
  const [celebrateOpen, setCelebrateOpen] = useState(false);

  const { data, isLoading } = todayQuery;

const promos = (data?.meta?.promos ?? []) as any[];

useEffect(() => {
  const first = data?.tasks?.[0];
  if (first?.task_type === "KPI" && first?.status !== "Done") {
    setKpiOpen(true);
  }
}, [data]);

const err = todayQuery.error as any;

  if (todayQuery.isError) {
// TEMP    return <div>Errore caricamento: {(todayQuery.error as any)?.message}</div>;
//    return <div>{String((todayQuery.error as any)?.message || todayQuery.error)}</div>

    const isProRequired =
    err?.code === "PRO_REQUIRED" ||
    err?.message === "PRO_REQUIRED" ||
    err?.status === 402;

    if (isProRequired) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-2">🔒 Accesso PRO richiesto</h2>
            <p className="text-slate-600 mb-4">
              Dal giorno 31 in avanti il percorso è disponibile solo con piano PRO.
            </p>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => (window.location.href = "/pro")}
            >
              Passa a PRO
            </Button>

            <p className="text-xs text-slate-400 mt-3">
              Errore: {String(err?.message || "PRO_REQUIRED")}
            </p>
          </div>
        </div>
      ); 
    }
    // altri errori veri
    return (
      <div className="p-6 text-red-600">
        Errore: {String(err?.message || err)}
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress
  const totalTasks = data?.tasks.length || 0;
  const completedTasks =
    data?.tasks.filter(
      (t: any) => t.status === "Done" || t.status === "Skipped",
    ).length || 0;
  const isAllComplete = totalTasks > 0 && totalTasks === completedTasks;
  const progress = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

console.log("data?.meta: ", data?.meta);
console.log("data?.meta?.lockedAfterKpi: ", data?.meta?.lockedAfterKpi);

const kpiTask = data?.tasks?.find((t: any) => t.task_type === "KPI");
const kpiDone = kpiTask?.status === "Done";

//const lockedAfterKpi = Boolean(data?.meta?.lockedAfterKpi);
const lockedAfterKpi = Boolean(data?.meta?.lockedAfterKpi) && kpiDone;

console.log("lockedAfterKpi: ", lockedAfterKpi );

  const handleDayComplete = () => {
    if (isAllComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
//      setKpiOpen(true);
      setCelebrateOpen(true);
    }
  };

const isProRequiredError = (e: any) =>
  e?.code === "PRO_REQUIRED" ||
  e?.message === "PRO_REQUIRED" ||
  e?.status === 402;

const upgradeUrl = data?.meta?.upgradeUrl || "/pro";
const lockMessage = data?.meta?.lockMessage || "Per proseguire serve PRO.";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 md:ml-0 pb-24 md:pb-8">
        <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Giorno {user.currentDay}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString("it-IT", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-xs font-bold uppercase text-slate-400">
                Progresso Giornaliero
              </span>
              <div className="w-32 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-slate-700">
                {user.creditsBalance}
              </span>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                Crediti
              </span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-slate-700">{user.plan}</span>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                Piano Utente
              </span>
            </div>
          </div>

{/* Mobile hamburger */}
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <button className="bg-white px-3 py-2 rounded-full border border-slate-200 shadow-sm">
        <Menu className="w-5 h-5 text-slate-700" />
      </button>
    </SheetTrigger>

    <SheetContent side="right" className="w-[320px]">
      <SheetHeader>
        <SheetTitle>Account</SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        {/* Brand + Giorno */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            WS
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            WebStudioAMS
          </span>
        </div>

        <div className="px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
            Giorno Corrente
          </p>
          <p className="text-2xl font-bold text-indigo-900">
            Giorno {user.currentDay}
          </p>
        </div>

        {/* Utente */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-900">
              {user.email}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user.plan} Plan
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => logoutMutation.mutateAsync()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </SheetContent>
  </Sheet>
</div>


        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          {/* Motivation Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                Mantieni il ritmo!
              </h2>
              <p className="text-indigo-100 max-w-xl">
                Hai completato {completedTasks} su {totalTasks} attività oggi.
                La costanza è la chiave della crescita.
              </p>
            </div>
            <Trophy className="absolute right-4 bottom-[-20px] w-40 h-40 text-white opacity-10 rotate-12" />
          </div>

{promos.filter(p => p.placement === "TOP").map((p) => (
  <div key={p.id} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
    <div className="relative z-10">
      <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{p.title}</h2> 
      <p className="text-indigo-100 max-w-xl">{p.text}</p>
    </div>

      <Button
        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
        onClick={() => (window.location.href = p.ctaUrl)}
      >
        {p.ctaLabel}
      </Button>
  </div>

))}

          {/* Task List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Piano d'Azione di Oggi
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                  {totalTasks}
                </span>
              </h3>
            </div>

{data?.tasks.filter(
      (t: any) => t.goal === "ALL" || t.goal === user.goal,
    ).length || 0}

            {data?.tasks.map((task: any) => (
              <TaskCard key={task.task_id} task={task} 
                onCompleteClick={(t: any) => {
                  // Se è KPI, apri la modale (solo se non è già Done)
                 if (t?.task_type === "KPI" && t?.status !== "Done") {
                   setKpiOpen(true);
                   return;
                 }
                 // Altrimenti lascia che TaskCard gestisca normalmente (o gestiscilo qui se preferisci)
                }}
              />
            ))}

{ console.log ("kpiDone: ", kpiDone) }

            {data?.tasks.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>Nessuna attività per oggi. Goditi il riposo!</p>
              </div>
            )}
          </div>


{promos.filter(p => p.placement === "BOTTOM").map((p) => (
  <div key={p.id} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
    <div className="relative z-10">
      <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{p.title}</h2> 
      <p className="text-indigo-100 max-w-xl">{p.text}</p>
    </div>

      <Button
        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
        onClick={() => (window.location.href = p.ctaUrl)}
      >
        {p.ctaLabel} 
      </Button>
  </div>
))}


          {/* Complete Day Button */}
          <div className="sticky bottom-20 md:bottom-8 flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleDayComplete}
              disabled={!isAllComplete}
              className={clsx(
                "rounded-full px-8 py-6 text-lg font-bold shadow-2xl transition-all transform hover:-translate-y-1",
                isAllComplete
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed",
              )}
            >
              {isAllComplete ? (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Completa Giorno {user.currentDay}
                </>
              ) : (
                `Completa ${completedTasks}/${totalTasks} Attività`
              )}
            </Button>
          </div>
        </div>
      </main>


<KPIDialog open={kpiOpen} onOpenChange={setKpiOpen} todayDay={user.currentDay} kpiForDay={Math.max(1, user.currentDay - 1)} onSaved={() => todayQuery.refetch()} />


<Dialog open={celebrateOpen} onOpenChange={setCelebrateOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>🎉 Congratulazioni!</DialogTitle>
    </DialogHeader>

    <p className="text-sm text-slate-600">
      Hai completato tutte le attività del giorno. Premi il tasto per passare al giorno successivo di attività!
    </p>

    <DialogFooter>
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={completeDayMutation.isPending}
        onClick={async () => {
try {
          await completeDayMutation.mutateAsync();
          setCelebrateOpen(false);
          await todayQuery.refetch(); // ricarica giorno

} catch (e: any) {
    if (isProRequiredError(e)) {
    // opzione A: redirect
      window.location.href = "/pro";
      return;
    }
    console.error("Complete day failed:", e);
  }
        }}
      >
        Vai al giorno successivo
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>



    </div>

  );
}
