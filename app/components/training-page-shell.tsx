import {
  BarChart3,
  Dumbbell,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import styles from "../training-pages.module.css";

type TrainingTab = "dashboard" | "workouts" | "progress";

type TrainingPageShellProps = {
  title: string;
  subtitle: string;
  activeTab: TrainingTab;
  actions?: ReactNode;
  children: ReactNode;
};

const TABS: Array<{ key: TrainingTab; href: string; label: string; icon: ReactNode }> = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className={styles.navIcon} aria-hidden="true" strokeWidth={1.9} />,
  },
  {
    key: "workouts",
    href: "/workouts",
    label: "Workouts",
    icon: <Dumbbell className={styles.navIcon} aria-hidden="true" strokeWidth={1.9} />,
  },
  {
    key: "progress",
    href: "/progress",
    label: "Progress",
    icon: <BarChart3 className={styles.navIcon} aria-hidden="true" strokeWidth={1.9} />,
  },
];

export function TrainingPageShell({
  title,
  subtitle,
  activeTab,
  actions,
  children,
}: TrainingPageShellProps) {
  return (
    <main className={styles.shell}>
      <section className={styles.page}>
        <div className={styles.topRow}>
          <Link href="/dashboard" className={styles.brand}>
            logit
          </Link>

          <div className={styles.topActions}>
            <ThemeToggle />
            <form method="post" action="/auth/signout">
              <button type="submit" className={styles.signout}>
                Sign out
              </button>
            </form>
          </div>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <nav className={styles.nav} aria-label="Training navigation">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={styles.navLink}
              data-active={tab.key === activeTab}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </nav>

        {actions ? <div className={styles.actionsRow}>{actions}</div> : null}

        {children}
      </section>
    </main>
  );
}
