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

export default function Dashboard() {
  const { user } = useAuth();
  const { todayQuery } = useTasks();
  const [kpiOpen, setKpiOpen] = useState(false);

  const { data, isLoading } = todayQuery;

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

  const handleDayComplete = () => {
    if (isAllComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setKpiOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 md:ml-0 pb-24 md:pb-8">
        <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              Giorno {user.currentDay}
            </h1>
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

            {data?.tasks.map((task: any) => (
              <TaskCard key={task.task_id} task={task} />
            ))}

            {data?.tasks.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>Nessuna attività per oggi. Goditi il riposo!</p>
              </div>
            )}
          </div>

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

      <KPIDialog
        open={kpiOpen}
        onOpenChange={setKpiOpen}
        day={user.currentDay}
      />
    </div>
  );
}
