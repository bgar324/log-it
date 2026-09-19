"use client";

import { useEffect, useRef } from "react";
import type { WorkoutTableRow } from "../dashboard-client.shared";
import { dayNumberLabel, fullDayLabel, weekdayLabel } from "./dashboard-history.dates";
import { historyStyles } from "./dashboard-history.styles";

export type RecordedDay = {
  date: string;
  workouts: WorkoutTableRow[];
};

type DashboardDayStripProps = {
  /** The selected month's recorded days, ascending: oldest left, newest right. */
  days: readonly RecordedDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
};

/**
 * The month's spine: one button per day that actually has a workout, oldest
 * left and newest right, scrolled horizontally with a thumb. Days without a
 * session are not drawn at all — an empty grid of a month is not history, and
 * the person browsing is looking for the sessions, not the gaps.
 *
 * Arrow keys walk the strip so the browser is usable without a touch screen,
 * and the selected day is always scrolled back into view, including when the
 * selection is restored from the address bar.
 */
export function DashboardDayStrip({
  days,
  selectedDate,
  onSelect,
}: DashboardDayStripProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller || typeof scroller.scrollTo !== "function") {
      return;
    }

    const card = selectedDate ? cardsRef.current.get(selectedDate) : null;
    // No selection yet: the newest day lives at the right edge, so that is
    // where the strip should open.
    const target = card
      ? card.getBoundingClientRect().left - scroller.getBoundingClientRect().left +
        scroller.scrollLeft - scroller.clientWidth / 2 + card.clientWidth / 2
      : scroller.scrollWidth;
    const left = Math.max(
      0,
      Math.min(target, scroller.scrollWidth - scroller.clientWidth),
    );

    if (Math.abs(left - scroller.scrollLeft) < 2) {
      return;
    }

    // `scrollTo` on the strip alone: `scrollIntoView` would also drag the page.
    scroller.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [days, selectedDate]);

  function moveSelection(offset: number) {
    if (days.length === 0) {
      return;
    }

    const current = days.findIndex((day) => day.date === selectedDate);
    const next = Math.max(
      0,
      Math.min(days.length - 1, (current === -1 ? days.length - 1 : current) + offset),
    );
    const target = days[next];

    if (!target || target.date === selectedDate) {
      return;
    }

    onSelect(target.date);
    cardsRef.current.get(target.date)?.focus({ preventScroll: true });
  }

  return (
    <div
      ref={scrollerRef}
      className={historyStyles.strip}
      role="group"
      aria-label="Recorded days"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          moveSelection(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveSelection(-1);
        } else if (event.key === "Home") {
          event.preventDefault();
          moveSelection(-days.length);
        } else if (event.key === "End") {
          event.preventDefault();
          moveSelection(days.length);
        }
      }}
    >
      <div className={historyStyles.stripContent}>
        {days.map((day, index) => {
          const selected = day.date === selectedDate;

          return (
            <button
              key={day.date}
              ref={(node) => {
                if (node) {
                  cardsRef.current.set(day.date, node);
                } else {
                  cardsRef.current.delete(day.date);
                }
              }}
              type="button"
              className={historyStyles.dayCard}
              data-selected={selected}
              aria-pressed={selected}
              // Roving tab stop: arrow keys walk the strip, so Tab does not
              // have to step through a month of training to leave it. With no
              // selection the newest day carries the stop.
              tabIndex={
                selected || (!selectedDate && index === days.length - 1) ? 0 : -1
              }
              aria-label={fullDayLabel(day.date)}
              onClick={() => onSelect(day.date)}
            >
              <span className={historyStyles.dayWeekday}>
                {weekdayLabel(day.date)}
              </span>
              <span className={historyStyles.dayNumber}>
                {dayNumberLabel(day.date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
