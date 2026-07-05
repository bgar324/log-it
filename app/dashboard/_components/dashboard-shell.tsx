"use client";

import { Check, Moon, PanelLeft, Plus, Sun, User2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { DashboardView } from "../dashboard-types";
import { useThemeToggle } from "@/app/components/theme-toggle";
import { usePresence } from "@/app/hooks/use-presence";
import { AppBrand } from "@/app/components/ui";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { NAV_ITEMS } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";

const MENU_EXIT_MS = 280;
const MENU_ITEM_COUNT = NAV_ITEMS.length + 2;

function menuItemDelay(index: number, open: boolean) {
  return {
    animationDelay: open
      ? `${index * 35}ms`
      : `${(MENU_ITEM_COUNT - 1 - index) * 22}ms`,
  };
}

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
  const menuMounted = usePresence(mobileMenuOpen, MENU_EXIT_MS);
  const menuState = mobileMenuOpen ? "open" : "closed";
  const { theme, toggleTheme } = useThemeToggle();
  const nextIsDark = theme === "light";
  const ThemeIcon = nextIsDark ? Moon : Sun;
  const themeLabel = nextIsDark ? "Dark mode" : "Light mode";

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
              className={`relative ${styles.sidebarAction} ${
                sidebarCollapsed ? styles.sidebarActionCollapsed : ""
              }`}
              title={sidebarCollapsed ? "Log workout" : undefined}
              aria-label={sidebarCollapsed ? "Log workout" : undefined}
            >
              <Plus className={styles.sidebarActionIcon} aria-hidden="true" strokeWidth={1.9} />
              <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>Log workout</span>
              <LinkPendingOverlay />
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
          <button
            type="button"
            className={`${styles.sidebarSecondaryAction} ${
              sidebarCollapsed ? styles.sidebarActionCollapsed : ""
            }`}
            onClick={toggleTheme}
            title={sidebarCollapsed ? themeLabel : undefined}
            aria-label={themeLabel}
          >
            <ThemeIcon className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
            <span className={sidebarCollapsed ? styles.navLabelCollapsed : ""}>
              {themeLabel}
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
          </div>

          <div className={styles.mobileHeaderActions}>
            {renderHeaderAccessory?.()}
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
                <span className={styles.mobileMenuToggleBars} aria-hidden="true">
                  <span
                    className={`${styles.mobileMenuToggleBar} ${styles.mobileMenuToggleBarTop}`}
                    data-open={mobileMenuOpen}
                  />
                  <span
                    className={`${styles.mobileMenuToggleBar} ${styles.mobileMenuToggleBarMiddle}`}
                    data-open={mobileMenuOpen}
                  />
                  <span
                    className={`${styles.mobileMenuToggleBar} ${styles.mobileMenuToggleBarBottom}`}
                    data-open={mobileMenuOpen}
                  />
                </span>
              </button>
              {menuMounted ? (
                <div
                  id="dashboard-mobile-menu"
                  className={styles.mobileMenuPanel}
                  data-state={menuState}
                  aria-label="Dashboard mobile navigation"
                >
                  <nav className={styles.mobileMenuNav} aria-label="Dashboard sections">
                    {NAV_ITEMS.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.view;

                      return (
                        <button
                          key={item.view}
                          type="button"
                          className={styles.mobileMenuItem}
                          data-state={menuState}
                          style={menuItemDelay(index, mobileMenuOpen)}
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
                      data-state={menuState}
                      style={menuItemDelay(NAV_ITEMS.length, mobileMenuOpen)}
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
                    <button
                      type="button"
                      className={styles.mobileMenuItem}
                      data-state={menuState}
                      style={menuItemDelay(NAV_ITEMS.length + 1, mobileMenuOpen)}
                      onClick={toggleTheme}
                      aria-label={themeLabel}
                    >
                      <ThemeIcon
                        className={styles.mobileMenuItemIcon}
                        aria-hidden={true}
                        strokeWidth={1.9}
                      />
                      <span>{themeLabel}</span>
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
