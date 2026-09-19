"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type SwiperInstance from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { WorkoutLoggerExerciseEntry } from "../workout-logger.types";
import type { RestTimer } from "../_hooks/use-rest-timer";
import { styles } from "../workout-logger.styles";
import { WorkoutLoggerExerciseCard } from "./workout-logger-exercise-card";
import { WorkoutLoggerGuidance } from "./workout-logger-guidance";

const modules = [A11y];
const SLIDE_MS = 280;

export function WorkoutLoggerExerciseCarousel({
  entries,
  focusedId,
  restTimer,
  onRetryInsight,
}: {
  entries: WorkoutLoggerExerciseEntry[];
  focusedId: string | null;
  /** Owned by the logger, so a rest survives moving between exercises. */
  restTimer?: RestTimer;
  onRetryInsight: (exerciseId: string, exerciseName: string) => void;
}) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const preference = useMemo(() => typeof window === "undefined"
    ? null : window.matchMedia("(prefers-reduced-motion: reduce)"), []);
  const subscribe = useCallback((notify: () => void) => {
    preference?.addEventListener("change", notify);
    return () => preference?.removeEventListener("change", notify);
  }, [preference]);
  const reducedMotion = useSyncExternalStore(subscribe, () => preference?.matches ?? false, () => false);
  const index = Math.max(0, entries.findIndex(entry => entry.exercise.id === focusedId));
  // Only structural changes remount Swiper; typing never resets its position.
  const identity = entries.map(entry => entry.exercise.id).join("\0");

  useLayoutEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed) return;
    if (swiper.activeIndex !== index) {
      if (swiper.animating) {
        const current = swiper.getTranslate();
        swiper.transitionEnd(false);
        swiper.setTranslate(current);
        // Commit the interrupted position before Swiper starts the next slide.
        swiper.wrapperEl.getBoundingClientRect();
      }
      swiper.slideTo(index, reducedMotion ? 0 : SLIDE_MS, false);
    }
  }, [index, identity, reducedMotion]);

  useLayoutEffect(() => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) swiper.updateAutoHeight();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <Swiper
      key={identity}
      className={styles.exerciseCarousel}
      data-exercise-carousel="true"
      style={{ touchAction: "auto" }}
      modules={modules}
      slidesPerView={1}
      spaceBetween={20}
      speed={reducedMotion ? 0 : SLIDE_MS}
      allowTouchMove={false}
      simulateTouch={false}
      autoHeight
      runCallbacksOnInit={false}
      a11y={{ containerMessage: "Workout exercises", slideLabelMessage: "Exercise {{index}} of {{slidesLength}}", scrollOnFocus: false }}
      onSwiper={swiper => {
        swiperRef.current = swiper;
        swiper.slideTo(index, 0, false);
      }}
      onBeforeDestroy={swiper => { if (swiperRef.current === swiper) swiperRef.current = null; }}
    >
      {entries.map(entry => (
        <SwiperSlide
          key={entry.exercise.id}
          data-exercise-active={entry.exercise.id === focusedId ? "true" : "false"}
          aria-hidden={entry.exercise.id !== focusedId}
        >
          <fieldset className={styles.exerciseSlideContent} disabled={entry.exercise.id !== focusedId}>
            <WorkoutLoggerExerciseCard {...entry} active={entry.exercise.id === focusedId} restTimer={restTimer} />
            <WorkoutLoggerGuidance
              exercise={entry.exercise}
              insightState={entry.insightState}
              weightUnit={entry.weightUnit}
              onRetry={() => onRetryInsight(entry.exercise.id, entry.exercise.name)}
            />
          </fieldset>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
