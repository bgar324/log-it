"use client";

import { actionOutline } from "./action.styles";

export type Feedback = {
  tone: "error" | "success" | "info";
  message: string;
};

type InlineFeedbackProps = {
  feedback: Feedback | null;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function InlineFeedback({ feedback, action, className = "" }: InlineFeedbackProps) {
  if (!feedback) return null;
  return (
    <div className={`flex flex-col items-start gap-2 text-[0.9375rem] ${className}`}>
      <p role={feedback.tone === "error" ? "alert" : "status"}
        className={`m-0 ${feedback.tone === "error" ? "text-[var(--text)]" : "text-[var(--muted)]"}`}>
        {feedback.message}
      </p>
      {action ? <button type="button" className={actionOutline} onClick={action.onClick}>{action.label}</button> : null}
    </div>
  );
}
