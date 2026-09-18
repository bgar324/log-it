"use client";

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  type InfiniteScrollCustomEvent,
} from "@ionic/react";
import { closeOutline, funnelOutline } from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { countLabel } from "@/app/dashboard/dashboard-client.shared";
import type {
  DashboardClientData,
  DashboardWorkoutFilters,
} from "@/app/dashboard/dashboard-types";
import { formatWeightWithUnit } from "@/lib/weight-unit";
import type { IonicDashboardViewProps } from "./ionic-view-props";

type WorkoutMonths = DashboardClientData["workoutMonths"];
type WorkoutHistory = DashboardClientData["workoutHistory"];

type LoadPageOptions = {
  offset: number;
  filters: DashboardWorkoutFilters;
  append: boolean;
};

// A full history is thousands of rows to hydrate before the list is
// interactive. Mount the most recent months and reveal the rest as the user
// scrolls; the server page beyond them is only fetched once the loaded months
// run out.
const INITIAL_MONTHS = 3;
const MONTHS_PER_REVEAL = 6;
const FILTER_DEBOUNCE_MS = 250;

export const emptyIonicWorkoutFilters: DashboardWorkoutFilters = {
  dateFrom: "",
  dateTo: "",
  workoutType: "",
  titleQuery: "",
};

function hasActiveFilters(filters: DashboardWorkoutFilters) {
  return Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.workoutType ||
      filters.titleQuery.trim(),
  );
}

function filtersMatch(
  left: DashboardWorkoutFilters,
  right: DashboardWorkoutFilters,
) {
  return (
    left.dateFrom === right.dateFrom &&
    left.dateTo === right.dateTo &&
    left.workoutType === right.workoutType &&
    left.titleQuery === right.titleQuery
  );
}

// Typing narrows the loaded rows immediately; the debounced server request
// then replaces them with the authoritative page for the same filters.
function filterMonths(
  workoutMonths: WorkoutMonths,
  filters: DashboardWorkoutFilters,
) {
  const query = filters.titleQuery.trim().toLowerCase();

  return workoutMonths
    .map((month) => ({
      ...month,
      entries: month.entries.filter((workout) => {
        if (filters.dateFrom && workout.performedAtDate < filters.dateFrom) {
          return false;
        }

        if (filters.dateTo && workout.performedAtDate > filters.dateTo) {
          return false;
        }

        if (filters.workoutType && workout.workoutType !== filters.workoutType) {
          return false;
        }

        return !query || workout.title.toLowerCase().includes(query);
      }),
    }))
    .filter((month) => month.entries.length > 0);
}

function countWorkouts(workoutMonths: WorkoutMonths) {
  return workoutMonths.reduce((sum, month) => sum + month.entries.length, 0);
}

function collectWorkoutTypes(workoutMonths: WorkoutMonths) {
  const types = new Set<string>();

  for (const month of workoutMonths) {
    for (const workout of month.entries) {
      const type = workout.workoutType?.trim();

      if (type) {
        types.add(type);
      }
    }
  }

  return Array.from(types).sort((left, right) => left.localeCompare(right));
}

function mergeMonthPages(current: WorkoutMonths, incoming: WorkoutMonths) {
  const entriesByMonth = new Map(
    current.map((month) => [month.month, [...month.entries]]),
  );

  for (const month of incoming) {
    const entries = entriesByMonth.get(month.month) ?? [];
    const existingIds = new Set(entries.map((entry) => entry.id));
    entries.push(...month.entries.filter((entry) => !existingIds.has(entry.id)));
    entriesByMonth.set(month.month, entries);
  }

  return Array.from(entriesByMonth, ([month, entries]) => ({ month, entries }));
}

export function IonicWorkoutsView({ data }: IonicDashboardViewProps) {
  const weightUnit = data.user.preferredWeightUnit;
  const [months, setMonths] = useState<WorkoutMonths>(data.workoutMonths);
  const [history, setHistory] = useState<WorkoutHistory>(data.workoutHistory);
  const [filters, setFilters] = useState(emptyIonicWorkoutFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyIonicWorkoutFilters);
  const [visibleMonths, setVisibleMonths] = useState(INITIAL_MONTHS);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const requestRef = useRef(0);

  // A shell refresh is authoritative: it hands back the unfiltered first page,
  // so applied filters reset and the effect below re-requests them if the user
  // still has some typed in.
  useEffect(() => {
    requestRef.current += 1;
    setMonths(data.workoutMonths);
    setHistory(data.workoutHistory);
    setAppliedFilters(emptyIonicWorkoutFilters);
    setVisibleMonths(INITIAL_MONTHS);
    setIsLoadingPage(false);
    setError(null);
  }, [data.workoutHistory, data.workoutMonths]);

  const loadPage = useCallback(async (options: LoadPageOptions) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setIsLoadingPage(true);
    setError(null);

    // The shell's own endpoint: it is gated by the Ionic flag and forwards the
    // workout-history offset and filters to the same loader the page used.
    const searchParams = new URLSearchParams({
      resource: "dashboard",
      view: "workouts",
      offset: String(options.offset),
    });
    for (const [key, value] of Object.entries(options.filters)) {
      if (value) {
        searchParams.set(key, value);
      }
    }

    try {
      const response = await fetch(`/api/ionic?${searchParams}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | { data?: Partial<DashboardClientData> }
        | { error?: string };
      const pageMonths = "data" in payload ? payload.data?.workoutMonths : undefined;
      const pageHistory = "data" in payload ? payload.data?.workoutHistory : undefined;

      if (!response.ok || !pageMonths || !pageHistory) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Unable to load workout history.",
        );
      }

      if (requestId !== requestRef.current) {
        return;
      }

      setMonths((current) =>
        options.append ? mergeMonthPages(current, pageMonths) : pageMonths,
      );
      setHistory(pageHistory);
      setAppliedFilters(options.filters);

      if (!options.append) {
        setVisibleMonths(INITIAL_MONTHS);
      }
    } catch (fetchError) {
      if (requestId === requestRef.current) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load workout history.",
        );
      }
    } finally {
      if (requestId === requestRef.current) {
        setIsLoadingPage(false);
      }
    }
  }, []);

  useEffect(() => {
    if (filtersMatch(filters, appliedFilters)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadPage({ offset: 0, filters, append: false });
    }, FILTER_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appliedFilters, filters, loadPage]);

  const workoutTypes =
    history.workoutTypes.length > 0
      ? history.workoutTypes
      : collectWorkoutTypes(months);
  const filteredMonths = filterMonths(months, filters);
  const renderedMonths = filteredMonths.slice(0, visibleMonths);
  const hiddenWorkoutCount = countWorkouts(filteredMonths.slice(visibleMonths));
  const filtersActive = hasActiveFilters(filters);
  const filtersAreApplied = filtersMatch(filters, appliedFilters);
  // The server count is only trustworthy while the rendered rows are the ones
  // it filtered; mid-debounce the locally narrowed count is the honest one.
  const matchedCount = filtersAreApplied
    ? history.totalCount
    : countWorkouts(filteredMonths);
  const canLoadMore = hiddenWorkoutCount > 0 || history.hasMore;

  function updateFilter<Key extends keyof DashboardWorkoutFilters>(
    key: Key,
    value: DashboardWorkoutFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function loadMore() {
    if (isLoadingPage || !filtersAreApplied) return;
    if (hiddenWorkoutCount > 0) {
      setVisibleMonths((count) => count + MONTHS_PER_REVEAL);
    } else if (history.hasMore && !isLoadingPage) {
      await loadPage({
        offset: history.nextOffset,
        filters: appliedFilters,
        append: true,
      });
    }

  }

  async function handleInfinite(event: InfiniteScrollCustomEvent) {
    await loadMore();
    await event.target.complete();
  }

  return (
    <>
      {/* The shell's content wrapper already pads; these read as sentences. */}
      <IonText>
        <p>
          {filtersActive
            ? `${countLabel(matchedCount, "workout")} ${
                matchedCount === 1 ? "matches" : "match"
              } these filters.`
            : `You have logged ${countLabel(history.lifetime.workouts, "workout")}.`}
        </p>
      </IonText>
      <IonText color="medium">
        <p>
          {countLabel(history.lifetime.sets, "set")} across{" "}
          {countLabel(history.lifetime.exercises, "exercise")} all time.
        </p>
      </IonText>

      <IonToolbar>
        <IonSearchbar
          value={filters.titleQuery}
          debounce={0}
          placeholder="Search title"
          onIonInput={(event) => updateFilter("titleQuery", event.detail.value ?? "")}
        />
        <IonButtons slot="end">
          <IonButton
            onClick={() => setFiltersOpen(true)}
            fill={filters.dateFrom || filters.dateTo || filters.workoutType ? "solid" : "clear"}
          >
            <IonIcon slot="icon-only" icon={funnelOutline} aria-label="Filters" />
          </IonButton>
        </IonButtons>
      </IonToolbar>

      <IonModal
        isOpen={filtersOpen}
        breakpoints={[0, 0.6, 0.95]}
        initialBreakpoint={0.6}
        onDidDismiss={() => setFiltersOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Filters</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setFiltersOpen(false)}>
                <IonIcon
                  slot="icon-only"
                  icon={closeOutline}
                  aria-label="Close filters"
                />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem>
              <IonInput
                label="From"
                labelPlacement="stacked"
                type="date"
                max={filters.dateTo || undefined}
                value={filters.dateFrom}
                onIonInput={(event) => updateFilter("dateFrom", event.detail.value ?? "")}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="To"
                labelPlacement="stacked"
                type="date"
                min={filters.dateFrom || undefined}
                value={filters.dateTo}
                onIonInput={(event) => updateFilter("dateTo", event.detail.value ?? "")}
              />
            </IonItem>
            <IonItem>
              <IonSelect
                label="Type"
                labelPlacement="stacked"
                interface="action-sheet"
                cancelText="Cancel"
                value={filters.workoutType}
                onIonChange={(event) => updateFilter("workoutType", event.detail.value ?? "")}
              >
                <IonSelectOption value="">All types</IonSelectOption>
                {workoutTypes.map((type) => (
                  <IonSelectOption key={type} value={type}>
                    {type}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonList>
          <div className="ion-padding">
            <IonNote>
              {countLabel(matchedCount, "workout")}
              {filtersActive ? " matched" : ""}
            </IonNote>
            <IonButton
              expand="block"
              fill="clear"
              disabled={!filtersActive}
              onClick={() => setFilters(emptyIonicWorkoutFilters)}
            >
              Clear filters
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {error ? (
        <div role="alert">
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
          <IonButton
            fill="outline"
            size="small"
            onClick={() => void loadPage({ offset: 0, filters, append: false })}
          >
            Retry
          </IonButton>
        </div>
      ) : null}

      {filteredMonths.length > 0 ? (
        <>
          <IonList>
            {renderedMonths.map((month) => (
              <IonItemGroup key={month.month}>
                <IonItemDivider sticky>
                  <IonLabel>{month.month}</IonLabel>
                </IonItemDivider>
                {month.entries.map((workout) => (
                  <IonItem
                    key={workout.id}
                    detail
                    routerLink={`/ionic/workouts/${encodeURIComponent(workout.id)}`}
                    routerDirection="forward"
                  >
                    <IonLabel>
                      <h2>{workout.title}</h2>
                      <p>
                        {workout.performedAtLabel}
                        {workout.workoutType ? ` · ${workout.workoutType}` : ""}
                      </p>
                    </IonLabel>
                    <div slot="end" className="ion-text-end">
                      <IonNote>
                        {formatWeightWithUnit(workout.volume, weightUnit, {
                          maximumFractionDigits: 0,
                        })}
                      </IonNote>
                      <br />
                      <IonNote>
                        {workout.exerciseCount} ex · {workout.setCount} sets
                      </IonNote>
                    </div>
                  </IonItem>
                ))}
              </IonItemGroup>
            ))}
          </IonList>
          {canLoadMore ? <IonButton expand="block" fill="clear" disabled={isLoadingPage || !filtersAreApplied} onClick={() => void loadMore()}>{isLoadingPage ? "Loading…" : "Older workouts"}</IonButton> : null}
          <IonInfiniteScroll disabled={!canLoadMore || isLoadingPage || !filtersAreApplied} onIonInfinite={handleInfinite}>
            <IonInfiniteScrollContent loadingText="Loading older workouts..." />
          </IonInfiniteScroll>
        </>
      ) : (
        <IonText color="medium">
          <p>
            {filtersActive
              ? "No workouts match those filters."
              : "No workouts logged yet."}
          </p>
        </IonText>
      )}
    </>
  );
}
