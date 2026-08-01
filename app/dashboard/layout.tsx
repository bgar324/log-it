import type { ReactNode } from "react";
import { Toaster } from "@/app/components/ui/toaster";

// sonner only ships to the routes that actually call toast() — the dashboard
// and the workout logger — rather than to every route via the root layout.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
