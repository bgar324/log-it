"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type SwiperInstance from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { styles } from "../workout-logger.styles";

const NON_SWIPE_ACTIONS = 'select, button:not([data-set-menu]), a, [role="button"]:not([data-set-menu])';

type SwipeableSetProps = {
  setNumber: number;
  canDelete: boolean;
  revealed: boolean;
  onReveal: (revealed: boolean) => void;
  onDelete: () => void;
  children: ReactNode;
};

/** iOS-style trailing action; Swiper owns tracking, direction locking and snapping. */
export function WorkoutLoggerSwipeableSet({
  setNumber, canDelete, revealed, onReveal, onDelete, children,
}: SwipeableSetProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed && (!revealed || !canDelete)) swiper.slideTo(0, reducedMotion ? 0 : 180);
  }, [revealed, canDelete, reducedMotion]);

  return (
    <div role="group" aria-label={`Set ${setNumber}`}>
      <Swiper
        className={styles.swipeSet}
        data-swipe-set={setNumber}
        nested
        slidesPerView="auto"
        speed={reducedMotion ? 0 : 180}
        followFinger={!reducedMotion}
        allowTouchMove={canDelete}
        noSwipingSelector={NON_SWIPE_ACTIONS}
        focusableElements="select, option, button, video"
        touchStartPreventDefault={false}
        shortSwipes={false}
        longSwipesMs={0}
        longSwipesRatio={0.1}
        resistanceRatio={0}
        onSwiper={swiper => { swiperRef.current = swiper; }}
        onBeforeDestroy={swiper => { if (swiperRef.current === swiper) swiperRef.current = null; }}
        onSliderFirstMove={() => onReveal(true)}
        onTransitionEnd={swiper => onReveal(swiper.snapIndex !== 0)}
        onSnapIndexChange={swiper => onReveal(swiper.snapIndex !== 0)}
      >
        <SwiperSlide style={{ width: "100%", height: "auto" }} className={styles.swipeSetContent}>
          {children}
        </SwiperSlide>
        {canDelete ? (
          <SwiperSlide style={{ width: "80%", height: "auto", display: "flex" }} aria-hidden={!revealed}>
            <button
              type="button"
              className={styles.swipeSetDelete}
              aria-label={`Delete set ${setNumber}`}
              tabIndex={revealed ? 0 : -1}
              onClick={() => {
                swiperRef.current?.slideTo(0, reducedMotion ? 0 : 180);
                onDelete();
              }}
            >Delete</button>
          </SwiperSlide>
        ) : null}
      </Swiper>
    </div>
  );
}
