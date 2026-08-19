import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicFooter, PublicHeader } from "@/app/components/public-site";
import { RESEARCH_PAPERS } from "./papers";
import styles from "./index.module.css";
import landingStyles from "../landing.module.css";

export const metadata: Metadata = {
  title: "Research — Logit",
  description:
    "Working papers on Logit's training metrics, scheduling model, and recommendation system.",
};

function getUpdatedAtTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const PAPER_ART: Record<string, string> = {
  "/research/shp": "/art/card-composition.webp",
  "/research/guardrails": "/art/card-split.webp",
  "/research/metrics": "/art/card-dashboard.webp",
  "/research/split-calendar": "/art/card-progress.webp",
  "/research/training-radar": "/art/card-afklint.webp",
};

export default function ResearchPage() {
  const sortedResearchPapers = [...RESEARCH_PAPERS].sort(
    (left, right) =>
      getUpdatedAtTime(right.updatedAt) - getUpdatedAtTime(left.updatedAt),
  );

  return (
    <div className={`${styles.page} ${landingStyles.publicRoot}`}>
      <PublicHeader />

      <main className={styles.main}>
        <h1 className={styles.title}>Working papers</h1>

        <ol className={styles.grid}>
          {sortedResearchPapers.map((paper) => (
            <li key={paper.href} className={styles.item}>
              <Link href={paper.href} className={styles.card}>
                <div className={styles.art}>
                  <Image
                    src={PAPER_ART[paper.href] ?? "/art/card-dashboard.webp"}
                    alt=""
                    fill
                    sizes="(max-width: 44rem) 100vw, (max-width: 81.25rem) 50vw, 33vw"
                  />
                </div>
                <div className={styles.body}>
                  <h2 className={styles.name}>{paper.title}</h2>
                  <p className={styles.summary}>{paper.summary}</p>
                  <div className={styles.tags}>
                    <span className={styles.tag}>{paper.category}</span>
                    <span className={styles.tag}>Updated {paper.updatedAt}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </main>

      <PublicFooter />
    </div>
  );
}
