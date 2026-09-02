"use client";

import {
  Apple,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  House,
  LogOut,
  PanelLeft,
  Plus,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
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
  strokeWidth?: number;
}>;

// First class: the trips you make without thinking. Everything else lives on the
// layer underneath, revealed by sliding the app aside.
const HOME_TAB = { view: "dashboard", label: "Home", icon: House } as const;
const NUTRITION_TAB = { view: "nutrition", label: "Nutrition", icon: Apple } as const;
// Profile leads: the identity block sits directly above it, so the row that
// opens that identity belongs next to it rather than buried between Split and
// the footer.
const DRAWER_ITEMS: Array<{ view: DashboardView; label: string; icon: NavIcon }> = [
  { view: "profile", label: "Profile", icon: UserRound },
  { view: "workouts", label: "Workouts", icon: ClipboardList },
  { view: "progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
  { view: "split", label: "Split", icon: CalendarDays },
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
    <span className={fallbackClassName}>
      {initialsFor(user.displayName, user.username)}
    </span>
  );
}

/** The sidebar button that reveals the drawer. Phones only. */
export function AppDrawerTrigger() {
  const nav = useContext(AppNavContext);

  return (
    <button
      type="button"
      aria-label="Open navigation"
      className={navStyles.drawerTrigger}
      onClick={() => nav?.openDrawer()}
      data-app-drawer-trigger="true"
    >
      <PanelLeft
        aria-hidden="true"
        className={navStyles.drawerTriggerIcon}
        strokeWidth={1.9}
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
  accessory,
}: {
  title: string;
  accessory?: ReactNode;
}) {
  return (
    <header className={navStyles.topBar}>
      <AppDrawerTrigger />

      <h1 className={navStyles.topBarTitle}>{title}</h1>

      {accessory ? <div className={navStyles.topBarAccessory}>{accessory}</div> : null}
    </header>
  );
}


/** Exported for route-loading skeletons, which have no session user to render. */
export function AppTabBar({
  activeView,
  onNavigate,
  drawerOpen = false,
}: {
  activeView?: DashboardView | null;
  onNavigate?: (view: DashboardView) => void;
  drawerOpen?: boolean;
}) {
  return (
    <nav
      className={navStyles.tabBar}
      data-drawer={drawerOpen ? "open" : "closed"}
      data-app-nav="tabbar"
    >
      <Link
        href={toViewHref(HOME_TAB.view)}
        className={navStyles.tabItem}
        data-active={activeView === HOME_TAB.view}
        onClick={viewClickHandler(onNavigate, HOME_TAB.view)}
      >
        <House className={navStyles.tabIcon} strokeWidth={1.9} />
        <span className={navStyles.tabLabel}>{HOME_TAB.label}</span>
        <LinkPendingOverlay />
      </Link>

      <Link
        href={`/workouts/new?from=${activeView}`}
        className={navStyles.tabAction}
      >
        <Plus className={navStyles.tabActionIcon} strokeWidth={2} />
        <LinkPendingOverlay />
      </Link>

      <Link
        href={toViewHref(NUTRITION_TAB.view)}
        className={navStyles.tabItem}
        data-active={activeView === NUTRITION_TAB.view}
        onClick={viewClickHandler(onNavigate, NUTRITION_TAB.view)}
      >
        <Apple className={navStyles.tabIcon} strokeWidth={1.9} />
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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <AppNavContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
      <div className={navStyles.stage}>
        <div
          className={navStyles.drawerLayer}
          data-drawer={drawerOpen ? "open" : "closed"}
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

          <nav className={navStyles.drawerNav} data-app-nav="sections">
            {DRAWER_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.view}
                  href={toViewHref(item.view)}
                  className={navStyles.drawerItem}
                  data-active={activeView === item.view}
                  onClick={(event) => {
                    viewClickHandler(onNavigate, item.view)(event);
                    setDrawerOpen(false);
                  }}
                >
                  <Icon className={navStyles.drawerItemIcon} strokeWidth={1.9} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Settings and sign out share one row: one is the only place you go
              for preferences, the other is a single rare action. The row is also
              the drawer's half of the bottom strip, so it carries its own
              hairline and sits flush with the tab bar beside it. */}
          <div className={navStyles.drawerFooterRow}>
            <Link
              href={toViewHref(DRAWER_FOOTER_ITEM.view)}
              className={navStyles.drawerItem}
              data-active={activeView === DRAWER_FOOTER_ITEM.view}
              onClick={(event) => {
                viewClickHandler(onNavigate, DRAWER_FOOTER_ITEM.view)(event);
                setDrawerOpen(false);
              }}
            >
              <Settings className={navStyles.drawerItemIcon} strokeWidth={1.9} />
              <span>{DRAWER_FOOTER_ITEM.label}</span>
            </Link>
            <form method="post" action="/auth/signout">
              <button
                type="submit"
                className={navStyles.drawerIconAction}
                title="Sign out"
              >
                <LogOut className={navStyles.drawerItemIcon} strokeWidth={1.9} />
              </button>
            </form>
          </div>
        </div>

        <div className={navStyles.appLayer} data-drawer={drawerOpen ? "open" : "closed"}>
          {children}

          {drawerOpen ? (
            <button
              type="button"
              className={navStyles.appLayerScrim}
              onClick={() => setDrawerOpen(false)}
            />
          ) : null}
        </div>

        <AppTabBar activeView={activeView} onNavigate={onNavigate} drawerOpen={drawerOpen} />

        {/* Last and highest: the veil has to cover the bar as well as the screen,
            so it cannot be a child of either. */}
        <div className={navStyles.appVeil} data-drawer={drawerOpen ? "open" : "closed"} />
      </div>
    </AppNavContext.Provider>
  );
}
