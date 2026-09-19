"use client";

import {
  Apple,
  CalendarDays,
  ClipboardList,
  House,
  LogOut,
  PanelLeft,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "@/app/components/workspace-navigation";
import posthog from "posthog-js";
import { useLayoutEffect, useRef, type ComponentType, type ReactNode } from "react";
import type { DashboardView } from "../dashboard-types";
import { AppShell, AppTopBar, type AppNavUser } from "@/app/components/app-nav";
import { AppBrand } from "@/app/components/ui";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { styles } from "../dashboard.styles";

type SidebarIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

// Desktop keeps a sidebar; phones use the direct bottom navigation.
const SIDEBAR_ITEMS: Array<{
  view: DashboardView;
  label: string;
  icon: SidebarIcon;
}> = [
  { view: "dashboard", label: "Home", icon: House },
  { view: "workouts", label: "History", icon: CalendarDays },
  { view: "nutrition", label: "Nutrition", icon: Apple },
  { view: "split", label: "Splits", icon: ClipboardList },
];
const BEN_SIDEBAR_ITEMS = SIDEBAR_ITEMS.filter((item) => item.view !== "nutrition");

export type DashboardShellProps = {
  activeView: DashboardView;
  title: string;
  user: AppNavUser;
  benEnabled: boolean;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onNavigate: (view: DashboardView) => void;
  renderHeaderAccessory?: () => ReactNode;
  onHeaderBack?: () => void;
  children: ReactNode;
};

export function DashboardShell({
  activeView,
  title,
  user,
  benEnabled,
  sidebarCollapsed,
  onToggleSidebar,
  onNavigate,
  renderHeaderAccessory,
  onHeaderBack,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const { requestNavigation } = useWorkspaceNavigation();
  const contentRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.scrollLeft = 0;
    }
  }, [activeView]);

  function navigate(view: DashboardView) {
    if (view === activeView && contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.scrollLeft = 0;
    }
    onNavigate(view);
  }
  const appScreen = (
    <main
      className={`${styles.shell} ${sidebarCollapsed ? styles.shellSidebarCollapsed : ""}`}
      data-sidebar-collapsed={sidebarCollapsed}
    >
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        <div
          className={`${styles.sidebarTop} ${
            sidebarCollapsed ? styles.sidebarTopCollapsed : ""
          }`}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              className={styles.sidebarCollapsedLogoToggle}
              onClick={onToggleSidebar}
              title="Open sidebar"
            >
              <span className={styles.sidebarCollapsedLogo}>
                <AppBrand
                  compact
                  iconClassName="h-[1.35rem] w-[1.35rem]"
                  textClassName="hidden"
                />
              </span>
              <span className={styles.sidebarCollapsedToggleIconWrap}>
                <PanelLeft
                  className={styles.sidebarToggleIcon}
                  strokeWidth={1.9}
                />
              </span>
            </button>
          ) : (
            <>
              <Link href="/dashboard" className={styles.brand}>
                <AppBrand
                  compact
                  textClassName="text-[2.2rem] leading-[0.92] font-[520]"
                />
              </Link>
              <button
                type="button"
                className={styles.sidebarToggle}
                onClick={onToggleSidebar}
                title="Close sidebar"
              >
                <PanelLeft
                  className={styles.sidebarToggleIcon}
                  strokeWidth={1.9}
                />
              </button>
            </>
          )}
        </div>

        <nav className={`${styles.sideNav} ${sidebarCollapsed ? styles.sideNavCollapsed : ""}`}>
          {(benEnabled ? BEN_SIDEBAR_ITEMS : SIDEBAR_ITEMS).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                className={sidebarCollapsed ? styles.navButtonCollapsed : styles.navButton}
                data-active={isActive}
                onClick={() => navigate(item.view)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={styles.navIcon} strokeWidth={1.9} />
                <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div
          className={`${styles.sidebarUtilityStack} ${
            sidebarCollapsed ? styles.sidebarUtilityStackCollapsed : ""
          }`}
        >
          <Link
            href={`/workouts/new?from=${activeView}`}
            className={`relative ${
              sidebarCollapsed ? styles.sidebarActionCollapsed : styles.sidebarAction
            }`}
            title={sidebarCollapsed ? "Log workout" : undefined}
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              requestNavigation(() => router.push(`/workouts/new?from=${activeView}`));
            }}
          >
            <Plus className={styles.sidebarActionIcon} strokeWidth={1.9} />
            <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>Log workout</span>
            <LinkPendingOverlay />
          </Link>

          <div className={styles.sidebarDivider} />


          <form method="post" action="/auth/signout" onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            requestNavigation(() => {
              posthog.reset();
              form.submit();
            });
          }}>
            <button
              type="submit"
              className={sidebarCollapsed ? styles.navButtonCollapsed : styles.navButton}
              title={sidebarCollapsed ? "Sign out" : undefined}
            >
              <LogOut className={styles.navIcon} strokeWidth={1.9} />
              <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <section ref={contentRef} className={styles.main}>
        <AppTopBar title={title} accessory={renderHeaderAccessory?.()} onBack={onHeaderBack} />
        <div className={styles.mainContent}>{children}</div>
      </section>
    </main>
  );

  return (
    <AppShell
      user={user}
      activeView={activeView}
      onNavigate={navigate}
      benEnabled={benEnabled}
    >
      {appScreen}
    </AppShell>
  );
}
