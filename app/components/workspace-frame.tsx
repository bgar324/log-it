"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useTransition } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, LoaderCircle, LogOut, Settings, UserRound } from "lucide-react";
import posthog from "posthog-js";
import type { DashboardView } from "@/app/dashboard/dashboard-types";
import type { DashboardShellProps } from "@/app/dashboard/_components/dashboard-shell";
import { toViewHref } from "@/app/dashboard/dashboard-client.shared";
import { Button } from "./workspace-ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./workspace-ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./workspace-ui/tabs";
import { useWorkspaceNavigation } from "./workspace-navigation";

const primaryViews: Array<{ view: DashboardView; label: string }> = [
  { view: "dashboard", label: "Workout" },
  { view: "workouts", label: "History" },
  { view: "progress", label: "Progress" },
  { view: "split", label: "Plan" },
];

export type WorkspaceFrameProps = {
  activeView: DashboardView;
  benEnabled: boolean;
  children: ReactNode;
  title?: string;
  backHref?: string;
  accessory?: ReactNode;
  onNavigate?: (view: DashboardView) => void;
  contentKey?: string;
  navigationDisabled?: boolean;
};

export function WorkspaceFrame({ activeView, benEnabled, children, title, backHref, accessory, onNavigate, contentKey, navigationDisabled = false }: WorkspaceFrameProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const signoutRef = useRef<HTMLFormElement>(null);
  const { requestNavigation: guardedNavigation, syncNavigation } = useWorkspaceNavigation();
  useLayoutEffect(syncNavigation);
  const views = benEnabled ? primaryViews : [...primaryViews, { view: "nutrition" as const, label: "Nutrition" }];
  const isPrimaryView = views.some(item => item.view === activeView);

  function requestNavigation(proceed: () => void) {
    if (!navigationDisabled) guardedNavigation(proceed);
  }

  function navigate(view: DashboardView) {
    if (onNavigate && view === activeView) return;
    const href = view === "dashboard" ? "/workouts/new" : toViewHref(view);
    if (href === window.location.pathname + window.location.search) return;
    requestNavigation(() => {
      if (onNavigate && view !== "dashboard") onNavigate(view);
      else startTransition(() => router.push(href));
    });
  }

  const content = <main key={contentKey ?? activeView} data-workspace-view={activeView} aria-label={title} inert={pending} aria-busy={pending}
    className="mx-auto w-full max-w-5xl px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6 md:py-8 motion-safe:animate-in motion-safe:fade-in-90 motion-safe:duration-150 motion-safe:ease-out">
    {backHref ? <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground" disabled={navigationDisabled}
      onClick={() => requestNavigation(() => startTransition(() => router.push(backHref)))}>
      <ArrowLeft className="size-4" />Back
    </Button> : null}
    {children}
  </main>;

  return <Tabs value={activeView} activationMode="manual" className="min-h-svh gap-0">
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-1.5 md:gap-5 md:px-6 md:py-3">
        <Link href="/workouts/new" className="hidden text-base font-semibold tracking-tight md:block"
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            navigate("dashboard");
          }}>logit</Link>
        <TabsList variant="card" activeValue={activeView} aria-label="Workout workspace" className="min-w-0 flex-1 justify-start gap-0 p-0 md:flex-none md:gap-1">
          {views.map(item => <TabsTrigger key={item.view} value={item.view} disabled={navigationDisabled}
            onClick={() => navigate(item.view)} className="min-w-0 flex-1 px-1.5 text-xs sm:px-3 sm:text-sm md:flex-none">{item.label}</TabsTrigger>)}
        </TabsList>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {pending ? <LoaderCircle className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none" role="status" aria-label="Opening view" /> : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={navigationDisabled} aria-label="Account menu"><UserRound className="size-4" strokeWidth={1.5} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => navigate("profile")}><UserRound />Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("settings")}><Settings />Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => requestNavigation(() => {
                posthog.reset();
                signoutRef.current?.requestSubmit();
              })}><LogOut />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <form ref={signoutRef} method="post" action="/auth/signout" hidden />
        </div>
      </div>
      {accessory ? <div className="mx-auto w-full max-w-5xl px-4 pb-3 md:px-6">{accessory}</div> : null}
    </header>
    {isPrimaryView ? <TabsContent value={activeView} forceMount className="m-0">{content}</TabsContent> : content}
  </Tabs>;
}

export function WorkspaceDashboardShell({ activeView, title, benEnabled, onNavigate, renderHeaderAccessory, children }: DashboardShellProps) {
  return <WorkspaceFrame activeView={activeView} title={title} benEnabled={benEnabled} onNavigate={onNavigate} accessory={renderHeaderAccessory?.()}>{children}</WorkspaceFrame>;
}
