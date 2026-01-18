import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-24 w-24 text-indigo-300" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 font-display">404 Page Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          We couldn't find the page you were looking for. It might have been moved or deleted.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
