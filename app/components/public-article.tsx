import type { ReactNode } from "react";
import Image from "next/image";
import { PublicFooter, PublicHeader } from "./public-site";
import landingStyles from "../landing.module.css";
import styles from "./public-article.module.css";

type PublicArticleShellProps = {
  ariaLabel: string;
  title: string;
  kicker?: string;
  date?: string;
  art?: string;
  lede?: string;
  children: ReactNode;
};

export function PublicArticleShell({
  ariaLabel,
  title,
  kicker,
  date,
  art,
  lede,
  children,
}: PublicArticleShellProps) {
  return (
    <div className={`${styles.page} ${landingStyles.publicRoot}`} aria-label={ariaLabel}>
      <PublicHeader />

      <main className={styles.main}>
        <article className={styles.article}>
          <header className={styles.head}>
            {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
            <h1 className="title">{title}</h1>
            {date ? <p className={styles.date}>{date}</p> : null}
            {art ? (
              <div className={styles.art}>
                <Image
                  src={art}
                  alt=""
                  fill
                  sizes="(max-width: 44rem) 100vw, 736px"
                  priority
                />
              </div>
            ) : null}
            {lede ? <p className={styles.lede}>{lede}</p> : null}
          </header>

          {children}
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
