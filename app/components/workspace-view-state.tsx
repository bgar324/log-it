"use client";

import { AlertCircle } from "lucide-react";
import type { DashboardView } from "@/app/dashboard/dashboard-types";
import { Alert, AlertDescription, AlertTitle } from "./workspace-ui/alert";
import { Button } from "./workspace-ui/button";
import { Skeleton } from "./workspace-ui/skeleton";

export function WorkspaceViewError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Alert variant="destructive"><AlertCircle /><AlertTitle>Could not load this view</AlertTitle><AlertDescription><p>{message}</p><Button variant="outline" onClick={onRetry}>Try again</Button></AlertDescription></Alert>;
}

export function WorkspaceViewSkeleton({ kind }: { kind: DashboardView }) {
  return <div role="status" aria-label={`Loading ${kind}`} className="space-y-6">
    <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-64 max-w-full" /></div>
    {kind === "nutrition" ? <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20" />)}</div> : null}
    {kind === "progress" ? <Skeleton className="h-64 w-full" /> : null}
    <div className="divide-y divide-border">{Array.from({ length: kind === "split" ? 7 : 5 }, (_, index) => <div key={index} className="flex min-h-16 items-center justify-between gap-4 py-3"><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-4 w-16" /></div>)}</div>
  </div>;
}
