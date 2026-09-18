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
  useId,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { toViewHref } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardView } from "@/app/dashboard/dashboard-types";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import {
  type PostHogUser,
  useIdentifyPostHogUser,
} from "@/app/hooks/use-posthog-user";
import posthog from "posthog-js";
import { navStyles } from "./app-nav.styles";
import { usePresence } from "@/app/hooks/use-presence";

type NavIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

// First class: the trips you make without thinking. Everything else lives on the
// layer underneath, revealed by sliding the app aside.
const HOME_TAB = { view: "dashboard", label: "Home", icon: House } as const;
const NUTRITION_TAB = { view: "nutrition", label: "Nutrition", icon: Apple } as const;
const SPLIT_TAB = { view: "split", label: "Split", icon: CalendarDays } as const;
// Profile leads: the identity block sits directly above it, so the row that
// opens that identity belongs next to it rather than buried between Split and
// the footer.
const DRAWER_ITEMS: Array<{ view: DashboardView; label: string; icon: NavIcon }> = [
  { view: "profile", label: "Profile", icon: UserRound },
  { view: "workouts", label: "Workouts", icon: ClipboardList },
  { view: "progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
  { view: "split", label: "Split", icon: CalendarDays },
];
const BEN_DRAWER_ITEMS = DRAWER_ITEMS.filter((item) => item.view !== "split");

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
  drawerOpen: boolean;
  drawerId: string;
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
      aria-expanded={nav?.drawerOpen ?? false}
      aria-controls={nav?.drawerId}
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
  drawerPresent = drawerOpen,
  benEnabled = false,
}: {
  activeView?: DashboardView | null;
  onNavigate?: (view: DashboardView) => void;
  drawerOpen?: boolean;
  drawerPresent?: boolean;
  benEnabled?: boolean;
}) {
  const endTab = benEnabled ? SPLIT_TAB : NUTRITION_TAB;
  const EndTabIcon = endTab.icon;

  return (
    <nav
      className={navStyles.tabBar}
      data-drawer={drawerOpen ? "open" : "closed"}
      data-app-nav="tabbar"
      inert={drawerPresent}
    >
      <Link
        href={toViewHref(HOME_TAB.view)}
        className={navStyles.tabItem}
        data-active={activeView === HOME_TAB.view}
        aria-current={activeView === HOME_TAB.view ? "page" : undefined}
        onClick={viewClickHandler(onNavigate, HOME_TAB.view)}
      >
        <House className={navStyles.tabIcon} strokeWidth={1.9} />
        <span className={navStyles.tabLabel}>{HOME_TAB.label}</span>
        <LinkPendingOverlay />
      </Link>

      <Link
        href={`/workouts/new?from=${activeView}`}
        className={navStyles.tabAction}
        aria-label="Log workout"
      >
        <Plus className={navStyles.tabActionIcon} strokeWidth={2} />
        <LinkPendingOverlay />
      </Link>

      <Link
        href={toViewHref(endTab.view)}
        className={navStyles.tabItem}
        data-active={activeView === endTab.view}
        aria-current={activeView === endTab.view ? "page" : undefined}
        onClick={viewClickHandler(onNavigate, endTab.view)}
      >
        <EndTabIcon className={navStyles.tabIcon} strokeWidth={1.9} />
        <span className={navStyles.tabLabel}>{endTab.label}</span>
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
  analyticsUser,
  activeView,
  onNavigate,
  benEnabled = false,
  children,
}: {
  user: AppNavUser;
  analyticsUser?: PostHogUser;
  activeView?: DashboardView | null;
  onNavigate?: (view: DashboardView) => void;
  benEnabled?: boolean;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const appLayerRef = useRef<HTMLDivElement>(null);
  const drawerPresent = usePresence(drawerOpen, appLayerRef);
  useIdentifyPostHogUser(analyticsUser);

  useEffect(() => {
    if (!drawerOpen) return;

    const drawer = drawerRef.current;
    const controls = () => Array.from(
      drawer?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
    );

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
      } else if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (!drawer?.contains(active) || (event.shiftKey ? active === first : active === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus({ preventScroll: true });
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerPresent) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [drawerPresent]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 900px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setDrawerOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <AppNavContext.Provider value={{
      drawerOpen,
      drawerId,
      openDrawer: () => setDrawerOpen(true),
    }}>
      <div className={navStyles.stage}>
        <div
          ref={drawerRef}
          id={drawerId}
          role="dialog"
          aria-label="Navigation"
          aria-modal={drawerOpen || undefined}
          aria-hidden={!drawerOpen}
          inert={!drawerOpen}
          className={navStyles.drawerLayer}
          data-drawer={drawerOpen ? "open" : "closed"}
          data-present={drawerPresent}
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
            {(benEnabled ? BEN_DRAWER_ITEMS : DRAWER_ITEMS).map((item) => {
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
              aria-current={activeView === DRAWER_FOOTER_ITEM.view ? "page" : undefined}
              onClick={(event) => {
                viewClickHandler(onNavigate, DRAWER_FOOTER_ITEM.view)(event);
                setDrawerOpen(false);
              }}
            >
              <Settings className={navStyles.drawerItemIcon} strokeWidth={1.9} />
              <span>{DRAWER_FOOTER_ITEM.label}</span>
            </Link>
            <form method="post" action="/auth/signout" onSubmit={() => posthog.reset()}>
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

        <div ref={appLayerRef} className={navStyles.appLayer} data-drawer={drawerOpen ? "open" : "closed"}>
          <div inert={drawerPresent}>{children}</div>

          {drawerPresent ? (
            <button
              type="button"
              aria-label="Close navigation"
              tabIndex={-1}
              className={navStyles.appLayerScrim}
              onClick={() => setDrawerOpen(false)}
            />
          ) : null}
        </div>

        <AppTabBar
          activeView={activeView}
          onNavigate={onNavigate}
          drawerOpen={drawerOpen}
          drawerPresent={drawerPresent}
          benEnabled={benEnabled}
        />

        {/* Last and highest: the veil has to cover the bar as well as the screen,
            so it cannot be a child of either. */}
        <div className={navStyles.appVeil} data-drawer={drawerOpen ? "open" : "closed"} />
      </div>
    </AppNavContext.Provider>
  );
}
