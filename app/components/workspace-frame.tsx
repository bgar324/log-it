"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useTransition } from "react";
import type { ReactNode } from "react";
import { Apple, ArrowLeft, CalendarDays, ChartNoAxesCombined, Dumbbell, History, LoaderCircle, LogOut, Settings, UserRound, type LucideIcon } from "lucide-react";
import posthog from "posthog-js";
import type { DashboardView } from "@/app/dashboard/dashboard-types";
import type { DashboardShellProps } from "@/app/dashboard/_components/dashboard-shell";
import { toViewHref } from "@/app/dashboard/dashboard-client.shared";
import { Button } from "./workspace-ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./workspace-ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./workspace-ui/tabs";
import { useWorkspaceNavigation } from "./workspace-navigation";

const primaryViews: Array<{ view: DashboardView; label: string; icon: LucideIcon }> = [
  { view: "dashboard", label: "Workout", icon: Dumbbell },
  { view: "workouts", label: "History", icon: History },
  { view: "progress", label: "Progress", icon: ChartNoAxesCombined },
  { view: "split", label: "Plan", icon: CalendarDays },
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
  const views = benEnabled ? primaryViews : [...primaryViews, { view: "nutrition" as const, label: "Nutrition", icon: Apple }];
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
    className="mx-auto w-full max-w-5xl px-4 py-5 pb-[calc(var(--workspace-nav-height)+1.5rem)] md:px-6 md:py-8 motion-safe:animate-in motion-safe:fade-in-90 motion-safe:duration-150 motion-safe:ease-out">
    {backHref ? <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground" disabled={navigationDisabled}
      onClick={() => requestNavigation(() => startTransition(() => router.push(backHref)))}>
      <ArrowLeft className="size-4" />Back
    </Button> : null}
    {children}
  </main>;

  return <Tabs value={activeView} activationMode="manual" className="min-h-svh flex-col gap-0 [--workspace-nav-height:calc(4rem+env(safe-area-inset-bottom))] md:[--workspace-nav-height:0px]">
    <header className={`sticky top-0 z-30 bg-background ${accessory ? "border-b border-border" : "md:border-b md:border-border"}`}>
      <div data-workspace-navigation className="fixed inset-x-0 bottom-0 flex h-[var(--workspace-nav-height)] items-center gap-0 border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] md:static md:mx-auto md:h-auto md:w-full md:max-w-5xl md:gap-5 md:border-t-0 md:px-6 md:py-3">
        <Link href="/workouts/new" className="hidden text-base font-semibold tracking-tight md:block"
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            navigate("dashboard");
          }}>logit</Link>
        <TabsList variant={isPrimaryView ? "card" : "line"} activeValue={activeView} aria-label="Workout workspace"
          className={`min-w-0 justify-start gap-0 p-0 group-data-horizontal/tabs:h-16 md:flex-none md:gap-1 md:group-data-horizontal/tabs:h-8 ${benEnabled ? "flex-[4]" : "flex-[5]"}`}>
          {views.map(item => <TabsTrigger key={item.view} value={item.view} disabled={navigationDisabled}
            onClick={() => navigate(item.view)} className="h-14 min-w-0 flex-1 flex-col gap-1 px-0 text-[11px] md:h-8 md:flex-none md:flex-row md:px-3 md:text-sm">
            <item.icon aria-hidden="true" className="size-5 md:hidden" strokeWidth={1.75} />
            {item.label}
          </TabsTrigger>)}
        </TabsList>
        <div className="relative flex min-w-0 flex-1 items-center justify-center md:ml-auto md:flex-none md:gap-1">
          {pending ? <LoaderCircle className="absolute right-1 top-1 size-3 animate-spin text-muted-foreground motion-reduce:animate-none md:static md:size-4" role="status" aria-label="Opening view" /> : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={navigationDisabled} aria-label="Account menu"
              aria-current={!isPrimaryView ? "page" : undefined}
              className={`h-14 w-full flex-col gap-1 md:size-8 md:flex-row ${isPrimaryView ? "text-muted-foreground" : "bg-muted text-foreground"}`}>
              <UserRound aria-hidden="true" className="size-5 md:size-4" strokeWidth={1.75} />
              <span className="text-[11px] font-medium md:hidden">Account</span>
            </Button></DropdownMenuTrigger>
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
      {accessory ? <div className="mx-auto w-full max-w-5xl px-4 py-3 md:px-6 md:pt-0">{accessory}</div> : null}
    </header>
    {isPrimaryView ? <TabsContent value={activeView} forceMount className="m-0">{content}</TabsContent> : content}
  </Tabs>;
}

export function WorkspaceDashboardShell({ activeView, title, benEnabled, onNavigate, renderHeaderAccessory, children }: DashboardShellProps) {
  return <WorkspaceFrame activeView={activeView} title={title} benEnabled={benEnabled} onNavigate={onNavigate} accessory={renderHeaderAccessory?.()}>{children}</WorkspaceFrame>;
}
