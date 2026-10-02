"use client";

import {
  Apple,
  CalendarDays,
  ClipboardList,
  House,
  ArrowLeft,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { createContext, useContext, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { toViewHref } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardView } from "@/app/dashboard/dashboard-types";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { type PostHogUser, useIdentifyPostHogUser } from "@/app/hooks/use-posthog-user";
import { navStyles } from "./app-nav.styles";

const HOME_TAB = { view: "dashboard", label: "Home", icon: House } as const;
const HISTORY_TAB = { view: "workouts", label: "History", icon: CalendarDays } as const;
const NUTRITION_TAB = { view: "nutrition", label: "Nutrition", icon: Apple } as const;
const SPLIT_TAB = { view: "split", label: "Split", icon: ClipboardList } as const;
const BEN_TABS = [HOME_TAB, HISTORY_TAB, SPLIT_TAB];
const STANDARD_TABS = [HOME_TAB, HISTORY_TAB, NUTRITION_TAB, SPLIT_TAB];

type NavigateHandler = ((view: DashboardView) => void) | undefined;

export type AppNavUser = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

const AppNavContext = createContext<{
  user: AppNavUser;
  onNavigate: NavigateHandler;
  activeView: DashboardView | null | undefined;
} | null>(null);

function initialsFor(displayName: string, username: string) {
  const source = displayName.trim() || username.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

// Real links retain modified-click behavior; dashboard clicks switch in place.
function viewClickHandler(onNavigate: NavigateHandler, view: DashboardView) {
  return (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onNavigate(view);
  };
}

function Avatar({ user }: { user: AppNavUser }) {
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- avatar bytes come from our own API route
    <img className={navStyles.headerAvatar} src={user.avatarUrl} alt="" />
  ) : (
    <span className={navStyles.headerAvatarFallback}>{initialsFor(user.displayName, user.username)}</span>
  );
}

export function AppTopBar({ title, accessory, onBack }: { title: string; accessory?: ReactNode; onBack?: () => void }) {
  const nav = useContext(AppNavContext);
  return (
    <header className={navStyles.topBar}>
      <div className={navStyles.utilityRow}>
        <Link href={toViewHref("profile")} className={navStyles.identityLink} aria-label="Profile" onClick={viewClickHandler(nav?.onNavigate, "profile")}>
          {nav?.user ? <Avatar user={nav.user} /> : <UserRound className={navStyles.utilityIcon} />}
        </Link>
        <Link href={toViewHref("settings")} className={navStyles.utilityButton} aria-label="Settings" aria-current={nav?.activeView === "settings" ? "page" : undefined} onClick={viewClickHandler(nav?.onNavigate, "settings")}>
          <Settings className={navStyles.utilityIcon} strokeWidth={1.7} />
        </Link>
      </div>
      {title !== "Home" || accessory ? (
        <div className={navStyles.titleRow}>
          {onBack ? (
            <button type="button" className={navStyles.titleBack} aria-label={`Back to ${title.toLowerCase()}`} onPointerDown={event => event.preventDefault()} onClick={onBack}>
              <ArrowLeft className={navStyles.utilityIcon} strokeWidth={1.9} />
            </button>
          ) : null}
          <h1 className={navStyles.topBarTitle}>{title}</h1>
          {accessory ? <div className={navStyles.topBarAccessory}>{accessory}</div> : null}
        </div>
      ) : null}
    </header>
  );
}

/** Also used by route-loading screens, with the same capability and destinations. */
export function AppTabBar({ activeView, onNavigate, benEnabled = false }: {
  activeView?: DashboardView | null;
  onNavigate?: (view: DashboardView) => void;
  benEnabled?: boolean;
}) {
  const tabs = benEnabled ? BEN_TABS : STANDARD_TABS;
  const activeIndex = tabs.findIndex(item => item.view === activeView);
  const indicatorIndex = Math.max(0, activeIndex);

  return (
    <nav className={navStyles.tabBar} data-app-nav="tabbar" aria-label="Primary">
      <span
        aria-hidden="true"
        data-app-nav-indicator="true"
        className={navStyles.tabIndicator}
        style={{
          width: `calc((100% - 0.5rem) / ${tabs.length} - 4px)`,
          transform: `translateX(calc(${indicatorIndex} * (100% + 4px)))`,
          opacity: activeIndex < 0 ? 0 : 1,
        }}
      />
      {tabs.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.view}
            href={toViewHref(item.view)}
            className={navStyles.tabItem}
            data-active={activeView === item.view}
            aria-current={activeView === item.view ? "page" : undefined}
            aria-label={item.label}
            onClick={viewClickHandler(onNavigate, item.view)}
          >
            <Icon className={navStyles.tabIcon} strokeWidth={1.9} />
            <LinkPendingOverlay />
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ user, analyticsUser, activeView, onNavigate, benEnabled = false, children }: {
  user: AppNavUser;
  analyticsUser?: PostHogUser;
  activeView?: DashboardView | null;
  onNavigate?: (view: DashboardView) => void;
  benEnabled?: boolean;
  children: ReactNode;
}) {
  useIdentifyPostHogUser(analyticsUser);
  return (
    <AppNavContext.Provider value={{ user, onNavigate, activeView }}>
      <div className={navStyles.stage} data-training-design="true">
        {children}
        <AppTabBar activeView={activeView} onNavigate={onNavigate} benEnabled={benEnabled} />
      </div>
    </AppNavContext.Provider>
  );
}
