import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const FEATURES = [
  "Generatore di Strategia AI Avanzato",
  "Template di Contenuto Illimitati",
  "Supporto Prioritario",
  "Dashboard KPI Personalizzate",
  "Collaborazione di Team (Prossimamente)",
];

export default function Pro() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-slate-900 p-12 text-white flex flex-col justify-center">
            <h2 className="text-4xl font-display font-bold mb-4">
              Sblocca la Potenza Pro
            </h2>
            <p className="text-slate-300 text-lg mb-8">
              Porta la tua crescita al livello successivo con strumenti avanzati
              e accesso AI illimitato.
            </p>
            <div className="space-y-4">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-12 flex flex-col items-center justify-center text-center">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide mb-6">
              Offerta a Tempo Limitato
            </span>
            <div className="mb-2">
              <span className="text-6xl font-display font-bold text-slate-900">
                $29
              </span>
              <span className="text-xl text-slate-500 font-medium">/mese</span>
            </div>
            <p className="text-slate-500 mb-8">
              Annulla in qualsiasi momento. Senza domande.
            </p>
            <a href="https://buy.stripe.com/aFa3cvfiL9nzgQt0jD7AI02">
              <Button
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg h-14 rounded-xl shadow-lg shadow-indigo-200"
              >
                Aggiorna Ora
              </Button>
            </a>
            <p className="text-xs text-slate-400 mt-4">
              Pagamento sicuro tramite Stripe. Garanzia di rimborso di 14
              giorni.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
