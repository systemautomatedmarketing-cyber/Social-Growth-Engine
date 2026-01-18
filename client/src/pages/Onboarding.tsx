import { useState } from "react";
import { useLocation } from "wouter";
import { useOnboarding } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

const STEPS = [
  {
    id: "platform",
    title: "Dove si trova il tuo pubblico?",
    multi: true,
    options: ["Instagram", "LinkedIn", "Twitter/X", "TikTok", "Facebook"]
  },
  {
    id: "productType",
    title: "Cosa vendi?",
    multi: true,
    options: ["Prodotto Digitale", "Coaching/Servizio", "Prodotto Fisico", "Affiliazione", "SaaS"]
  },
  {
    id: "goal",
    title: "Qual è il tuo obiettivo principale?",
    multi: false,
    options: ["Generare Lead", "Costruire il Brand", "Aumentare le Vendite", "Aumentare i Follower"]
  },
  {
    id: "level",
    title: "Qual è il tuo livello di esperienza?",
    multi: false,
    options: ["Principiante", "Intermedio", "Avanzato"]
  }
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const mutation = useOnboarding();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any>({
    platform: [],
    productType: [],
    goal: [],
    timeMode: 30,
    level: "",
    target: "Growth",
    tone: "Professional"
  });

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleSelect = (option: string) => {
    const key = currentStep.id;
    
    if (currentStep.multi) {
      const current = data[key] || [];
      const exists = current.includes(option);
      setData({
        ...data,
        [key]: exists 
          ? current.filter((i: string) => i !== option)
          : [...current, option]
      });
    } else {
      setData({ ...data, [key]: option });
      // Auto advance for single select if not last step
      if (!isLastStep) setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      await mutation.mutateAsync({
        ...data,
        // Ensure arrays for multi-selects
        platform: Array.isArray(data.platform) ? data.platform : [data.platform],
        productType: Array.isArray(data.productType) ? data.productType : [data.productType],
        goal: Array.isArray(data.goal) ? data.goal : [data.goal],
      });
      setLocation("/dashboard");
    } else {
      setStep(step + 1);
    }
  };

  const isSelected = (option: string) => {
    const val = data[currentStep.id];
    if (Array.isArray(val)) return val.includes(option);
    return val === option;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8 flex justify-between items-center px-2">
          <h1 className="text-2xl font-display font-bold text-slate-900">Configura il Tuo Programma</h1>
          <span className="text-sm font-medium text-slate-500">Passaggio {step + 1} di {STEPS.length}</span>
        </div>

        <div className="h-1 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: "0%" }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <motion.div
          key={step}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-6 text-center">
            {currentStep.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {currentStep.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={clsx(
                  "p-6 rounded-2xl text-left border-2 transition-all duration-200 relative",
                  isSelected(option)
                    ? "border-indigo-600 bg-indigo-50 shadow-md"
                    : "border-white bg-white hover:border-indigo-200 hover:shadow-sm"
                )}
              >
                <span className={clsx(
                  "text-lg font-semibold",
                  isSelected(option) ? "text-indigo-900" : "text-slate-700"
                )}>
                  {option}
                </span>
                {isSelected(option) && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button 
              size="lg" 
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 rounded-xl"
              disabled={(!data[currentStep.id] || data[currentStep.id].length === 0)}
            >
              {isLastStep ? (mutation.isPending ? "Creazione Piano..." : "Inizia il Viaggio") : "Passaggio Successivo"}
              {!isLastStep && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
