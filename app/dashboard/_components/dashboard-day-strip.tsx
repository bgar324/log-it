"use client";

import { ChevronRight } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";
import type { WorkoutTableRow } from "../dashboard-client.shared";
import {
  dayNumberLabel,
  fullDayLabel,
  monthShortLabel,
  weekdayLabel,
} from "./dashboard-history.dates";
import { historyStyles } from "./dashboard-history.styles";

export type RecordedDay = {
  date: string;
  workouts: WorkoutTableRow[];
};

export type DayStripOlderAction = {
  label: string;
  busy: boolean;
  onActivate: () => void;
};

type DashboardDayStripProps = {
  days: readonly RecordedDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  older: DayStripOlderAction | null;
};

const MAX_SESSION_DOTS = 3;

/**
 * The history's spine: one card per day that actually has a workout, newest
 * first, scrolled horizontally with a thumb. Days without a session are not
 * drawn at all — an empty grid of a month is not history, and the person
 * browsing is looking for the sessions, not the gaps.
 *
 * Arrow keys walk the strip so the browser is usable without a touch screen,
 * and the selected card is always scrolled back into view, including when the
 * selection is restored from the address bar.
 */
export function DashboardDayStrip({
  days,
  selectedDate,
  onSelect,
  older,
}: DashboardDayStripProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const scroller = scrollerRef.current;
    const card = selectedDate ? cardsRef.current.get(selectedDate) : null;

    if (!scroller || !card || typeof scroller.scrollTo !== "function") {
      return;
    }

    const target =
      card.offsetLeft - scroller.clientWidth / 2 + card.clientWidth / 2;
    const left = Math.max(0, Math.min(target, scroller.scrollWidth - scroller.clientWidth));

    if (Math.abs(left - scroller.scrollLeft) < 2) {
      return;
    }

    // `scrollTo` on the strip alone: `scrollIntoView` would also drag the page.
    scroller.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [selectedDate]);

  function moveSelection(offset: number) {
    if (days.length === 0) {
      return;
    }

    const current = days.findIndex((day) => day.date === selectedDate);
    const next = Math.max(
      0,
      Math.min(days.length - 1, (current === -1 ? 0 : current) + offset),
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
      {days.map((day, index) => {
        const previous = days[index - 1];
        const startsMonth =
          !previous || previous.date.slice(0, 7) !== day.date.slice(0, 7);
        const selected = day.date === selectedDate;

        return (
          <Fragment key={day.date}>
            {startsMonth ? (
              <span aria-hidden="true" className={historyStyles.stripMonthMark}>
                {monthShortLabel(day.date)}
              </span>
            ) : null}
            <button
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
              // have to step through a season of training to leave it.
              tabIndex={selected ? 0 : -1}
              aria-label={`${fullDayLabel(day.date)}, ${day.workouts.length} ${
                day.workouts.length === 1 ? "workout" : "workouts"
              }`}
              onClick={() => onSelect(day.date)}
            >
              <span className={historyStyles.dayWeekday}>
                {weekdayLabel(day.date)}
              </span>
              <span className={historyStyles.dayNumber}>
                {dayNumberLabel(day.date)}
              </span>
              <span aria-hidden="true" className={historyStyles.daySessions}>
                {Array.from(
                  { length: Math.min(day.workouts.length, MAX_SESSION_DOTS) },
                  (_, dot) => (
                    <span key={dot} className={historyStyles.daySessionDot} />
                  ),
                )}
              </span>
            </button>
          </Fragment>
        );
      })}

      {older ? (
        <button
          type="button"
          className={historyStyles.dayOlder}
          aria-label={older.label}
          disabled={older.busy}
          onClick={older.onActivate}
        >
          <ChevronRight className={historyStyles.dayOlderIcon} strokeWidth={1.9} />
          <span>{older.busy ? "Loading" : "Older"}</span>
        </button>
      ) : null}
    </div>
  );
}
