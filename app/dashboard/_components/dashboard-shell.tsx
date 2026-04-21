"use client";

import { Menu, Plus, User2, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardView } from "../dashboard-types";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { NAV_ITEMS } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";

type DashboardShellProps = {
  activeView: DashboardView;
  title: string;
  greeting: string;
  profileLabel: string;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNavigate: (view: DashboardView) => void;
  children: ReactNode;
};

export function DashboardShell({
  activeView,
  title,
  greeting,
  profileLabel,
  mobileMenuOpen,
  onToggleMobileMenu,
  onNavigate,
  children,
}: DashboardShellProps) {
  return (
    <main className={styles.shell} aria-label="Training dashboard shell">
      <aside className={styles.sidebar} aria-label="Dashboard sidebar">
        <Link href="/dashboard" className={styles.brand}>
          logit
        </Link>

        <nav className={styles.sideNav} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                className={styles.navButton}
                data-active={isActive}
                onClick={() => onNavigate(item.view)}
              >
                <Icon className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarUtilityStack}>
          <Link href="/workouts/new" className={styles.sidebarAction}>
            <Plus className={styles.sidebarActionIcon} aria-hidden="true" strokeWidth={1.9} />
            Log workout
          </Link>
          <div className={styles.sidebarDivider} aria-hidden="true" />
          <button
            type="button"
            className={styles.sidebarSecondaryAction}
            data-active={activeView === "profile"}
            onClick={() => onNavigate("profile")}
          >
            <User2 className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
            <span>{profileLabel}</span>
          </button>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.headerGreeting} suppressHydrationWarning>
              {greeting}
            </p>
            <h1 className={styles.title}>{title}</h1>
          </div>

          <div className={styles.headerActions}>
            <ThemeToggle />
          </div>

          <div className={styles.mobileHeaderActions}>
            <ThemeToggle />
            <button
              type="button"
              className={styles.mobileMenuToggle}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="dashboard-mobile-menu"
              onClick={onToggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <X className={styles.mobileMenuToggleIcon} aria-hidden="true" strokeWidth={1.9} />
              ) : (
                <Menu className={styles.mobileMenuToggleIcon} aria-hidden="true" strokeWidth={1.9} />
              )}
            </button>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div
            id="dashboard-mobile-menu"
            className={styles.mobileMenuPanel}
            aria-label="Dashboard mobile navigation"
          >
            <nav className={styles.mobileMenuNav} aria-label="Dashboard sections">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;

                return (
                  <button
                    key={item.view}
                    type="button"
                    className={styles.mobileMenuItem}
                    data-active={isActive}
                    onClick={() => onNavigate(item.view)}
                  >
                    <Icon
                      className={styles.mobileMenuItemIcon}
                      aria-hidden={true}
                      strokeWidth={1.9}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className={styles.mobileMenuItem}
                data-active={activeView === "profile"}
                onClick={() => onNavigate("profile")}
              >
                <User2
                  className={styles.mobileMenuItemIcon}
                  aria-hidden={true}
                  strokeWidth={1.9}
                />
                <span>{profileLabel}</span>
              </button>
            </nav>
          </div>
        ) : null}

        {children}
      </section>
    </main>
  );
}
