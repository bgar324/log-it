import type { ReactNode } from "react";
import { PublicArticleShell } from "@/app/components/public-article";

type ResearchPaperPageShellProps = {
  ariaLabel: string;
  title: string;
  category: string;
  updatedAt: string;
  art: string;
  lede?: string;
  children: ReactNode;
};

export function ResearchPaperPageShell({
  ariaLabel,
  title,
  category,
  updatedAt,
  art,
  lede,
  children,
}: ResearchPaperPageShellProps) {
  return (
    <PublicArticleShell
      ariaLabel={ariaLabel}
      title={title}
      kicker={category}
      date={`Updated ${updatedAt}`}
      art={art}
      lede={lede}
    >
      {children}
    </PublicArticleShell>
  );
}
