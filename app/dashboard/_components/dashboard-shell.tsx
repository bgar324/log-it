"use client";

import {
  Apple,
  CalendarDays,
  ClipboardList,
  House,
  PanelLeft,
  Plus,
  Settings,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { type ComponentType, type ReactNode } from "react";
import type { DashboardView } from "../dashboard-types";
import { AppShell, AppTopBar, type AppNavUser } from "@/app/components/app-nav";
import { AppBrand } from "@/app/components/ui";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { styles } from "../dashboard.styles";

type SidebarIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
  strokeWidth?: number;
}>;

// Desktop lists every section; phones get Home/Log/Nutrition in the tab bar and
// the rest behind the avatar drawer.
const SIDEBAR_ITEMS: Array<{
  view: DashboardView;
  label: string;
  icon: SidebarIcon;
}> = [
  { view: "dashboard", label: "Home", icon: House },
  { view: "workouts", label: "Workouts", icon: ClipboardList },
  { view: "progress", label: "Progress", icon: TrendingUp },
  { view: "nutrition", label: "Nutrition", icon: Apple },
  { view: "split", label: "Split", icon: CalendarDays },
];

type DashboardShellProps = {
  activeView: DashboardView;
  title: string;
  user: AppNavUser;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onNavigate: (view: DashboardView) => void;
  renderHeaderAccessory?: () => ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  activeView,
  title,
  user,
  sidebarCollapsed,
  onToggleSidebar,
  onNavigate,
  renderHeaderAccessory,
  children,
}: DashboardShellProps) {
  const appScreen = (
    <main
      className={`${styles.shell} ${sidebarCollapsed ? styles.shellSidebarCollapsed : ""}`}
      aria-label="Training dashboard shell"
      data-sidebar-collapsed={sidebarCollapsed}
    >
      <aside
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}
        aria-label="Dashboard sidebar"
      >
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
              aria-label="Open sidebar"
              title="Open sidebar"
              aria-expanded={false}
            >
              <span className={styles.sidebarCollapsedLogo} aria-hidden="true">
                <AppBrand
                  compact
                  iconClassName="h-[1.35rem] w-[1.35rem]"
                  textClassName="sr-only"
                />
              </span>
              <span className={styles.sidebarCollapsedToggleIconWrap} aria-hidden="true">
                <PanelLeft
                  className={styles.sidebarToggleIcon}
                  aria-hidden="true"
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
                aria-label="Close sidebar"
                title="Close sidebar"
                aria-expanded={true}
              >
                <PanelLeft
                  className={styles.sidebarToggleIcon}
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </button>
            </>
          )}
        </div>

        <nav
          className={`${styles.sideNav} ${sidebarCollapsed ? styles.sideNavCollapsed : ""}`}
          aria-label="Main navigation"
        >
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                className={sidebarCollapsed ? styles.navButtonCollapsed : styles.navButton}
                data-active={isActive}
                onClick={() => onNavigate(item.view)}
                title={sidebarCollapsed ? item.label : undefined}
                aria-label={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
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
            aria-label={sidebarCollapsed ? "Log workout" : undefined}
          >
            <Plus className={styles.sidebarActionIcon} aria-hidden="true" strokeWidth={1.9} />
            <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>Log workout</span>
            <LinkPendingOverlay />
          </Link>

          <div className={styles.sidebarDivider} aria-hidden="true" />

          <button
            type="button"
            className={sidebarCollapsed ? styles.navButtonCollapsed : styles.navButton}
            data-active={activeView === "profile"}
            onClick={() => onNavigate("profile")}
            title={sidebarCollapsed ? user.displayName : undefined}
            aria-label={sidebarCollapsed ? user.displayName : undefined}
          >
            <UserRound className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
            <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>
              {user.displayName}
            </span>
          </button>

          <button
            type="button"
            className={sidebarCollapsed ? styles.navButtonCollapsed : styles.navButton}
            data-active={activeView === "settings"}
            onClick={() => onNavigate("settings")}
            title={sidebarCollapsed ? "Settings" : undefined}
            aria-label={sidebarCollapsed ? "Settings" : undefined}
          >
            <Settings className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
            <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>Settings</span>
          </button>
        </div>
      </aside>

      <section className={styles.main}>
        <AppTopBar title={title} user={user} accessory={renderHeaderAccessory?.()} />
        <div className={styles.mainContent}>{children}</div>
      </section>
    </main>
  );

  return (
    <AppShell user={user} activeView={activeView} onNavigate={onNavigate}>
      {appScreen}
    </AppShell>
  );
}
