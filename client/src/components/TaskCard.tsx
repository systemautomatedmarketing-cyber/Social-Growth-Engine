import { useState } from "react";
import { type Task } from "@shared/schema";
import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  SkipForward,
  Clock,
  Bot,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiVariables, setAiVariables] = useState<Record<string, string>>({});
  const { updateStatusMutation, generateAiMutation } = useTasks();

  const isCompleted = task.status === "Done";
  const isSkipped = task.status === "Skipped";
  const isPending = task.status === "Pending" || !task.status;

  const handleGenerateAI = async () => {
    try {
      const result = await generateAiMutation.mutateAsync({
        taskId: task.task_id,
        variables: aiVariables,
      });

      if (result?.output) setAiModalOpen(false);
//      setAiModalOpen(false);
    } catch (e: any) {
      // Error is handled by query client, but we can customize the message if needed
      // The backend returns { message: "Insufficient credits" }
      console.error("AI generate failed:", e?.message || e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-2xl border transition-all duration-300 overflow-hidden",
        isCompleted
          ? "bg-slate-50 border-slate-200"
          : "bg-white border-border shadow-sm hover:shadow-md hover:border-indigo-200",
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={clsx(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  {
                    "bg-indigo-50 text-indigo-600 border-indigo-100":
                      task.task_type === "ACTION",
                    "bg-emerald-50 text-emerald-600 border-emerald-100":
                      task.task_type === "KPI",
                    "bg-amber-50 text-amber-600 border-amber-100":
                      task.task_type === "LEARNING",
                  },
                )}
              >
                {task.task_type === "ACTION"
                  ? "AZIONE"
                  : task.task_type === "KPI"
                    ? "KPI"
                    : "APPRENDIMENTO"}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.estimated_time}
              </span>
              {task.ai_support_available === "YES" && (
                <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  <Bot className="w-3 h-3" /> Potenziato da AI
                </span>
              )}
            </div>

            <h3
              className={clsx(
                "text-lg font-bold font-display mb-1 transition-colors",
                isCompleted ? "text-slate-400 line-through" : "text-foreground",
              )}
            >
              {task.title}
            </h3>

            <p
              className={clsx(
                "text-sm text-muted-foreground line-clamp-2",
                expanded && "line-clamp-none",
              )}
            >
              {task.instructions}
            </p>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-dashed border-slate-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Obiettivo
                  </span>
                  <p className="font-medium">{task.goal}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Piattaforma
                  </span>
                  <p className="font-medium">{task.platform}</p>
                </div>
                {task.kpi_target && (
                  <div className="col-span-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3" /> Metrica di Successo
                    </span>
                    <p className="font-medium text-emerald-900">
                      {task.kpi_target} {task.kpi_name}
                    </p>
                  </div>
                )}
              </div>

              {task.ai_support_available === "YES" && !isCompleted && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900">
                      Assistente AI Disponibile
                    </h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    Usa l'AI per generare istantaneamente contenuti per questa
                    attività.
                  </p>


                {!generateAiMutation.data?.output ? (
 
                  <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg shadow-purple-200">
                        <Zap className="w-4 h-4 mr-2" />
                        Genera con AI
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Genera Contenuto</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          {/*                       Inserisci i dettagli qui sotto per generare contenuti
                          su misura.*/}
                          Ecco i dettagli per la generazione tramite AI:
                        </p>
                        {/* Dynamic fields based on generic placeholder for now since schema doesn't define exact vars */}
                        <div className="space-y-2">
                          {/*                       <Label>Argomento / Contesto</Label>
                          <Input
                            placeholder="Di cosa tratta questo post?"
                            onChange={(e) =>
                              setAiVariables({
                                ...aiVariables,
                                topic: e.target.value,
                              })
                            }
                          />*/}
                          <Label>Piano Utente: {user.plan} </Label>
                          <Label>Crediti Residui: </Label>
                          <Label> {user?.creditsBalance} Crediti </Label>
                        </div>
                        <div className="space-y-2">
                          {/*                          <Label>Tono</Label>
                          <Input
                            placeholder="Professionale, divertente, urgente..."
                            onChange={(e) =>
                              setAiVariables({
                                ...aiVariables,
                                tone: e.target.value,
                              })
                            }
                          />*/}
                          <Label>
                            Crediti necessari per questa operazione:{" "}
                          </Label>
                          <Label> {task.credits_cost} Crediti </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <a href="https://buy.stripe.com/fZu9ATb2v43f1Vz4zT7AI03">
                          <Button className="w-full">
                            Acquista 100 Crediti!
                          </Button>
                        </a>
                        <br></br>
                        <Button
                          onClick={handleGenerateAI}
                          disabled={generateAiMutation.isPending}
                          className="w-full">
                          {generateAiMutation.isPending
                            ? "Generazione in corso..."
                            : "Genera Contenuto"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-white p-3 rounded-lg border border-purple-100 shadow-sm"
                    >
                      <p className="text-sm font-mono whitespace-pre-wrap">
                        {generateAiMutation.data.output}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            generateAiMutation.data.output,
                          )
                        }
                      >
                        Copia negli Appunti
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                {isPending && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          taskId: task.task_id,
                          status: "Deferred",
                          day: task.day,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Rimanda a domani
                    </Button>
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          taskId: task.task_id,
                          status: "Done",
                          day: task.day,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Segna come completato
                    </Button>
                  </>
                )}
                {isCompleted && (
                  <Button
                    variant="outline"
                    disabled
                    className="text-green-600 border-green-200 bg-green-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completato
                  </Button>
                )}
                {isSkipped && (
                  <Button
                    variant="outline"
                    disabled
                    className="text-amber-600 border-amber-200 bg-amber-50"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Saltato
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!expanded && !isCompleted && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-medium text-slate-500">
            {task.goal} • {task.platform}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 h-auto font-medium"
            onClick={() => setExpanded(true)}
          >
            Inizia Attività →
          </Button>
        </div>
      )}
    </motion.div>
  );
}
