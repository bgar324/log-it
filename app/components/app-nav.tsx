"use client";

import {
  Apple,
  CalendarDays,
  ClipboardList,
  House,
  LogOut,
  Plus,
  Settings,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { toViewHref } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardView } from "@/app/dashboard/dashboard-types";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { navStyles } from "./app-nav.styles";

type NavIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
  strokeWidth?: number;
}>;

// First class: the trips you make without thinking. Everything else lives on the
// layer underneath, revealed by sliding the app aside.
const HOME_TAB = { view: "dashboard", label: "Home", icon: House } as const;
const NUTRITION_TAB = { view: "nutrition", label: "Nutrition", icon: Apple } as const;

const DRAWER_ITEMS: Array<{ view: DashboardView; label: string; icon: NavIcon }> = [
  { view: "workouts", label: "Workouts", icon: ClipboardList },
  { view: "progress", label: "Progress", icon: TrendingUp },
  { view: "split", label: "Split", icon: CalendarDays },
  { view: "profile", label: "Profile", icon: UserRound },
];

// Preferences, not identity: theme and units live here, account actions stay on
// the profile view.
const DRAWER_FOOTER_ITEM = { view: "settings", label: "Settings", icon: Settings } as const;

export type AppNavUser = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

const AppNavContext = createContext<{
  drawerOpen: boolean;
  openDrawer: () => void;
} | null>(null);

function initialsFor(displayName: string, username: string) {
  const source = displayName.trim() || username.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

type NavigateHandler = ((view: DashboardView) => void) | undefined;

// Nav items are always real links so long-press and middle-click behave. Inside
// the dashboard the click is intercepted to keep the fast in-place view switch.
function viewClickHandler(onNavigate: NavigateHandler, view: DashboardView) {
  return (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (
      !onNavigate ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    onNavigate(view);
  };
}

function Avatar({
  user,
  imageClassName,
  fallbackClassName,
}: {
  user: AppNavUser;
  imageClassName: string;
  fallbackClassName: string;
}) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar bytes come from our own API route
      <img className={imageClassName} src={user.avatarUrl} alt="" />
    );
  }

  return (
    <span className={fallbackClassName} aria-hidden="true">
      {initialsFor(user.displayName, user.username)}
    </span>
  );
}

/** The avatar button that reveals the drawer. Phones only. */
export function AppDrawerTrigger({ user }: { user: AppNavUser }) {
  const nav = useContext(AppNavContext);

  return (
    <button
      type="button"
      className={navStyles.avatarButton}
      onClick={() => nav?.openDrawer()}
      aria-label="Open account menu"
      aria-expanded={nav?.drawerOpen ?? false}
      data-app-drawer-trigger="true"
    >
      <Avatar
        user={user}
        imageClassName={navStyles.avatarImage}
        fallbackClassName={navStyles.avatarFallback}
      />
    </button>
  );
}

/**
 * The app's sticky header: drawer trigger (phones), view title, optional
 * accessory slot. Each surface places it, so the dashboard can keep it inside
 * its content column beside the desktop sidebar.
 */
export function AppTopBar({
  title,
  user,
  accessory,
}: {
  title: string;
  user: AppNavUser;
  accessory?: ReactNode;
}) {
  return (
    <header className={navStyles.topBar}>
      <AppDrawerTrigger user={user} />

      <h1 className={navStyles.topBarTitle}>{title}</h1>

      {accessory ? <div className={navStyles.topBarAccessory}>{accessory}</div> : null}
    </header>
  );
}


/** Exported for route-loading skeletons, which have no session user to render. */
export function AppTabBar({
  activeView,
  onNavigate,
  shifted = false,
}: {
  activeView?: DashboardView | null;
  onNavigate?: (view: DashboardView) => void;
  shifted?: boolean;
}) {
  return (
    <nav
      className={`${navStyles.tabBar} ${shifted ? navStyles.tabBarShifted : ""}`}
      aria-label="Primary"
    >
      <Link
        href={toViewHref(HOME_TAB.view)}
        className={navStyles.tabItem}
        data-active={activeView === HOME_TAB.view}
        aria-current={activeView === HOME_TAB.view ? "page" : undefined}
        onClick={viewClickHandler(onNavigate, HOME_TAB.view)}
      >
        <House className={navStyles.tabIcon} aria-hidden={true} strokeWidth={1.9} />
        <span className={navStyles.tabLabel}>{HOME_TAB.label}</span>
        <LinkPendingOverlay />
      </Link>

      <Link
        href={`/workouts/new?from=${activeView}`}
        className={navStyles.tabAction}
        aria-label="Log a workout"
      >
        <Plus className={navStyles.tabActionIcon} aria-hidden={true} strokeWidth={2} />
        <LinkPendingOverlay />
      </Link>

      <Link
        href={toViewHref(NUTRITION_TAB.view)}
        className={navStyles.tabItem}
        data-active={activeView === NUTRITION_TAB.view}
        aria-current={activeView === NUTRITION_TAB.view ? "page" : undefined}
        onClick={viewClickHandler(onNavigate, NUTRITION_TAB.view)}
      >
        <Apple className={navStyles.tabIcon} aria-hidden={true} strokeWidth={1.9} />
        <span className={navStyles.tabLabel}>{NUTRITION_TAB.label}</span>
        <LinkPendingOverlay />
      </Link>
    </nav>
  );
}

/**
 * The authenticated app frame, built as two layers: the drawer is the base
 * layer, the app screen sits on top of it, and opening the drawer slides the
 * app aside to reveal it. Every authenticated browsing surface renders this, so
 * the drawer's destinations are reachable from anywhere and not only from Home.
 */
export function AppShell({
  user,
  activeView,
  onNavigate,
  children,
}: {
  user: AppNavUser;
  activeView?: DashboardView | null;
  onNavigate?: (view: DashboardView) => void;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previousOverflow;
      stageRef.current
        ?.querySelector<HTMLElement>('[data-app-drawer-trigger="true"]')
        ?.focus();
    };
  }, [drawerOpen]);

  return (
    <AppNavContext.Provider
      value={{ drawerOpen, openDrawer: () => setDrawerOpen(true) }}
    >
      <div className={navStyles.stage} ref={stageRef}>
        <div
          ref={drawerRef}
          className={`${navStyles.drawerLayer} ${drawerOpen ? navStyles.drawerLayerOpen : ""}`}
          aria-hidden={!drawerOpen}
          inert={!drawerOpen}
        >
          <div className={navStyles.drawerIdentity}>
            <Avatar
              user={user}
              imageClassName={navStyles.drawerAvatarImage}
              fallbackClassName={navStyles.drawerAvatarFallback}
            />
            <div>
              <p className={navStyles.drawerName}>{user.displayName}</p>
              <p className={navStyles.drawerHandle}>@{user.username}</p>
            </div>
          </div>

          <div className={navStyles.drawerDivider} />

          <nav className={navStyles.drawerNav} aria-label="Sections">
            {DRAWER_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.view}
                  href={toViewHref(item.view)}
                  className={navStyles.drawerItem}
                  data-active={activeView === item.view}
                  aria-current={activeView === item.view ? "page" : undefined}
                  onClick={(event) => {
                    viewClickHandler(onNavigate, item.view)(event);
                    setDrawerOpen(false);
                  }}
                >
                  <Icon
                    className={navStyles.drawerItemIcon}
                    aria-hidden={true}
                    strokeWidth={1.9}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={navStyles.drawerFooter}>
            <div className={navStyles.drawerDivider} />
            {/* Settings and sign out share one row: one is the only place you
                go for preferences, the other is a single rare action. */}
            <div className={navStyles.drawerFooterRow}>
              <Link
                href={toViewHref(DRAWER_FOOTER_ITEM.view)}
                className={navStyles.drawerItem}
                data-active={activeView === DRAWER_FOOTER_ITEM.view}
                aria-current={activeView === DRAWER_FOOTER_ITEM.view ? "page" : undefined}
                onClick={(event) => {
                  viewClickHandler(onNavigate, DRAWER_FOOTER_ITEM.view)(event);
                  setDrawerOpen(false);
                }}
              >
                <Settings
                  className={navStyles.drawerItemIcon}
                  aria-hidden={true}
                  strokeWidth={1.9}
                />
                <span>{DRAWER_FOOTER_ITEM.label}</span>
              </Link>
              <form method="post" action="/auth/signout">
                <button
                  type="submit"
                  className={navStyles.drawerIconAction}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut
                    className={navStyles.drawerItemIcon}
                    aria-hidden={true}
                    strokeWidth={1.9}
                  />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className={`${navStyles.appLayer} ${drawerOpen ? navStyles.appLayerOpen : ""}`}>
          {children}

          {drawerOpen ? (
            <button
              type="button"
              className={navStyles.appLayerScrim}
              onClick={() => setDrawerOpen(false)}
              aria-label="Close account menu"
            />
          ) : null}
        </div>

        <AppTabBar activeView={activeView} onNavigate={onNavigate} shifted={drawerOpen} />
      </div>
    </AppNavContext.Provider>
  );
}
