"use client";

import {
  Apple,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  House,
  LogOut,
  Ellipsis,
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
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "./workspace-navigation";

type NavIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

// First class: the trips you make without thinking. Everything else lives on the
// layer underneath, revealed by sliding the app aside.
const HOME_TAB = { view: "dashboard", label: "Home", icon: House } as const;
const NUTRITION_TAB = { view: "nutrition", label: "Nutrition", icon: Apple } as const;
const SPLIT_TAB = { view: "split", label: "Split", icon: CalendarDays } as const;
const ANALYSIS_TAB = { view: "progress", label: "Analysis", icon: ChartNoAxesColumnIncreasing } as const;
// Profile leads: the identity block sits directly above it, so the row that
// opens that identity belongs next to it rather than buried between Split and
// the footer.
const DRAWER_ITEMS: Array<{ view: DashboardView; label: string; icon: NavIcon }> = [
  { view: "profile", label: "Profile", icon: UserRound },
  { view: "workouts", label: "History", icon: ClipboardList },
  { view: "split", label: "Splits", icon: CalendarDays },
];
const BEN_DRAWER_ITEMS = DRAWER_ITEMS.filter((item) => item.view !== "split");


export type AppNavUser = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

const AppNavContext = createContext<{
  openDrawer: () => void;
  drawerOpen: boolean;
  drawerId: string;
  user: AppNavUser;
  onNavigate: NavigateHandler;
  activeView: DashboardView | null | undefined;
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
      <Ellipsis
        aria-hidden="true"
        className={navStyles.drawerTriggerIcon}
        strokeWidth={1.9}
      />
    </button>
  );
}

/** Personal utilities stay above the page rather than taking dock destinations. */
export function AppTopBar({
  title,
  accessory,
}: {
  title: string;
  accessory?: ReactNode;
}) {
  const nav = useContext(AppNavContext);
  return (
    <header className={navStyles.topBar}>
      <div className={navStyles.utilityRow}>
        <Link
          href={toViewHref("profile")}
          className={navStyles.identityLink}
          aria-label="Profile"
          onClick={viewClickHandler(nav?.onNavigate, "profile")}
        >
          {nav?.user ? (
            <Avatar user={nav.user} imageClassName={navStyles.headerAvatar} fallbackClassName={navStyles.headerAvatarFallback} />
          ) : <UserRound className={navStyles.utilityIcon} />}
        </Link>
        <div className={navStyles.utilityActions}>
          <AppDrawerTrigger />
          <Link
            href={toViewHref("settings")}
            className={navStyles.utilityButton}
            aria-label="Settings"
            aria-current={nav?.activeView === "settings" ? "page" : undefined}
            onClick={viewClickHandler(nav?.onNavigate, "settings")}
          >
            <Settings className={navStyles.utilityIcon} strokeWidth={1.7} />
          </Link>
        </div>
      </div>
      {title !== "Home" || accessory ? (
        <div className={navStyles.titleRow}>
          <h1 className={navStyles.topBarTitle}>{title}</h1>
          {accessory ? <div className={navStyles.topBarAccessory}>{accessory}</div> : null}
        </div>
      ) : null}
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
  const router = useRouter();
  const { requestNavigation } = useWorkspaceNavigation();

  return (
    <nav
      className={navStyles.tabBar}
      data-drawer={drawerOpen ? "open" : "closed"}
      data-app-nav="tabbar"
      inert={drawerPresent}
      aria-label="Primary"
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
        onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          requestNavigation(() => router.push(`/workouts/new?from=${activeView ?? "dashboard"}`));
        }}
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
      <Link
        href={toViewHref(ANALYSIS_TAB.view)}
        className={navStyles.tabItem}
        data-active={activeView === ANALYSIS_TAB.view}
        aria-current={activeView === ANALYSIS_TAB.view ? "page" : undefined}
        onClick={viewClickHandler(onNavigate, ANALYSIS_TAB.view)}
      >
        <ChartNoAxesColumnIncreasing className={navStyles.tabIcon} strokeWidth={1.9} />
        <span className={navStyles.tabLabel}>{ANALYSIS_TAB.label}</span>
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
      user,
      onNavigate,
      activeView,
      openDrawer: () => setDrawerOpen(true),
    }}>
      <div className={navStyles.stage} data-training-design="true">
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

          <div className={navStyles.drawerFooterRow}>
            <form method="post" action="/auth/signout" onSubmit={() => posthog.reset()}>
              <button
                type="submit"
                className={navStyles.drawerItem}
                title="Sign out"
              >
                <LogOut className={navStyles.drawerItemIcon} strokeWidth={1.9} />
                <span>Sign out</span>
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
