import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  TrendingUp,
  CreditCard, 
  UserCircle,
  LogOut,
  Zap
} from "lucide-react";
import { clsx } from "clsx";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { logoutMutation } = useAuth();  

  if (!user) return null;

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/credits", label: "Crediti", icon: Zap },
    { href: "/pro", label: "Upgrade", icon: CreditCard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-t-0 md:flex md:flex-col md:justify-between p-2 md:p-6 shadow-2xl md:shadow-none">
      <div className="hidden md:block mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            WS
          </div>
          <span className="font-display font-bold text-xl tracking-tight">WebStudioAMS</span>
        </div>
        <div className="mt-6 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">Giorno Corrente</p>
          <p className="text-2xl font-bold text-indigo-900">Giorno {user.currentDay}</p>
        </div>
      </div>

      <div className="flex md:flex-col justify-around md:justify-start md:gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={clsx(
                "flex flex-col md:flex-row items-center md:px-4 md:py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "text-indigo-600 bg-indigo-50 md:bg-indigo-50" 
                  : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
              )}
            >
              <Icon className={clsx("w-6 h-6 md:w-5 md:h-5 md:mr-3 transition-transform group-hover:scale-110", isActive && "scale-110")} />
              <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="hidden md:block mt-auto pt-6 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
{/*            <p className="text-sm font-medium truncate text-foreground">{user.username}</p>*/}
            <p className="text-sm font-medium truncate text-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user.plan} Plan</p>
          </div>
        </div>
        <button 
//          onClick={() => logout.mutateAsync()}
//          onClick={() => logout?.mutateAsync?.()}
          onClick={() => logoutMutation.mutateAsync()}
          className="w-full flex items-center px-4 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
