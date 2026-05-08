"use client";

import { Check, Menu, Moon, PanelLeft, Plus, User2, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { DashboardView } from "../dashboard-types";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { AppBrand } from "@/app/components/ui";
import { NAV_ITEMS } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";

type DashboardShellProps = {
  activeView: DashboardView;
  title: string;
  profileLabel: string;
  canLogWorkout: boolean;
  hasLoggedToday: boolean;
  mobileMenuOpen: boolean;
  sidebarCollapsed: boolean;
  onToggleMobileMenu: () => void;
  onToggleSidebar: () => void;
  onCloseMobileMenu: () => void;
  onNavigate: (view: DashboardView) => void;
  renderHeaderAccessory?: () => ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  activeView,
  title,
  profileLabel,
  canLogWorkout,
  hasLoggedToday,
  mobileMenuOpen,
  sidebarCollapsed,
  onToggleMobileMenu,
  onToggleSidebar,
  onCloseMobileMenu,
  onNavigate,
  renderHeaderAccessory,
  children,
}: DashboardShellProps) {
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        onCloseMobileMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [mobileMenuOpen, onCloseMobileMenu]);

  return (
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
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                className={`${styles.navButton} ${
                  sidebarCollapsed ? styles.navButtonCollapsed : ""
                }`}
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
          {hasLoggedToday ? (
            <div
              className={`${styles.sidebarAction} ${styles.sidebarActionLogged} ${
                sidebarCollapsed ? styles.sidebarActionCollapsed : ""
              }`}
              title={sidebarCollapsed ? "Logged!" : undefined}
              aria-label={sidebarCollapsed ? "Logged!" : undefined}
            >
              <Check className={styles.sidebarActionIcon} aria-hidden="true" strokeWidth={1.9} />
              <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>
                Logged!
              </span>
            </div>
          ) : canLogWorkout ? (
            <Link
              href="/workouts/new"
              className={`${styles.sidebarAction} ${
                sidebarCollapsed ? styles.sidebarActionCollapsed : ""
              }`}
              title={sidebarCollapsed ? "Log workout" : undefined}
              aria-label={sidebarCollapsed ? "Log workout" : undefined}
            >
              <Plus className={styles.sidebarActionIcon} aria-hidden="true" strokeWidth={1.9} />
              <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>Log workout</span>
            </Link>
          ) : (
            <div
              className={`${styles.sidebarAction} ${styles.sidebarActionDisabled} ${
                sidebarCollapsed ? styles.sidebarActionCollapsed : ""
              }`}
              title={sidebarCollapsed ? "Rest" : undefined}
              aria-label={sidebarCollapsed ? "Rest" : undefined}
            >
              <Moon className={styles.sidebarActionIcon} aria-hidden="true" strokeWidth={1.9} />
              <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>Rest</span>
            </div>
          )}
          <div className={styles.sidebarDivider} aria-hidden="true" />
          <button
            type="button"
            className={`${styles.sidebarSecondaryAction} ${
              sidebarCollapsed ? styles.sidebarActionCollapsed : ""
            }`}
            data-active={activeView === "profile"}
            onClick={() => onNavigate("profile")}
            title={sidebarCollapsed ? profileLabel : undefined}
            aria-label={sidebarCollapsed ? profileLabel : undefined}
          >
            <User2 className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
            <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>
              {profileLabel}
            </span>
          </button>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>{title}</h1>
          </div>

          <div className={styles.headerActions}>
            {renderHeaderAccessory?.()}
            <ThemeToggle />
          </div>

          <div className={styles.mobileHeaderActions}>
            {renderHeaderAccessory?.()}
            <ThemeToggle />
            <div className={styles.mobileMenu} ref={mobileMenuRef}>
              <button
                type="button"
                className={styles.mobileMenuToggle}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="dashboard-mobile-menu"
                aria-haspopup="menu"
                onClick={onToggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <X
                    className={styles.mobileMenuToggleIcon}
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                ) : (
                  <Menu
                    className={styles.mobileMenuToggleIcon}
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                )}
              </button>
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
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
