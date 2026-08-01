import type { ReactNode } from "react";
import { Toaster } from "@/app/components/ui/toaster";

// See app/dashboard/layout.tsx — sonner is scoped to the routes that toast.
export default function WorkoutsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
