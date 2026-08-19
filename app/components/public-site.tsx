import Link from "next/link";
import { AppBrand } from "./ui";
import { ThemeToggle } from "./theme-toggle";
import { LinkPendingOverlay } from "./link-pending";
import styles from "../landing.module.css";
export function PublicHeader() {
  return (
    <header className={styles.siteHeader}>
      <Link href="/" className={styles.brandLink} aria-label="logit home">
        <AppBrand
          compact
          className={styles.brand}
          textClassName={styles.brandText}
        />
      </Link>

      <nav className={styles.headerNav} aria-label="Project">
        <Link href="/research">Research</Link>
        <Link href="/changelog">Changelog</Link>
        <Link href="/legal">Terms</Link>
      </nav>

      <div className={styles.headerActions}>
        <Link href="/auth?mode=signin" className={styles.headerSignIn}>
          Sign in
        </Link>
        <Link
          href="/auth?mode=register"
          className={`${styles.headerCta} relative`}
        >
          Register
          <LinkPendingOverlay />
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <AppBrand
        compact
        className={styles.footerBrand}
        textClassName={styles.footerBrandText}
      />
      <div className={styles.footerTheme}>
        <ThemeToggle />
      </div>
    </footer>
  );
}

