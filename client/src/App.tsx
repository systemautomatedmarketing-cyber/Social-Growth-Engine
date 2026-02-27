import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Credits from "@/pages/Credits";
import Pro from "@/pages/Pro";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Redirect to onboarding if not completed
  if (!user.onboarding && window.location.pathname !== "/onboarding") {
    setLocation("/onboarding");
    return null;
  }

//  if (user.plan === "EXPIRED") {
//    setLocation("/pro");
//    return null;
//  }

 // 🔎 Controllo trial
  const plan = user.plan || "FREE";

  let isExpired = false;

  if (plan === "EXPIRED") {
    isExpired = true;
  }

  if (user.trialEndsAt) {
    const trialEndMillis =
      typeof user.trialEndsAt.toMillis === "function"
        ? user.trialEndsAt.toMillis()
        : new Date(user.trialEndsAt).getTime();

    if (Date.now() > trialEndMillis) {
      isExpired = true;
    }
  }

  if (isExpired) {
    alert("TRIAL Scaduta!\nIl tuo periodo di prova è terminato.\n\nAggiorna a PRO per continuare!");
    setLocation("/pro");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/pro" component={Pro} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/credits">
        <ProtectedRoute component={Credits} />
      </Route>
//      <Route path="/pro">
//        <ProtectedRoute component={Pro} />
//      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
