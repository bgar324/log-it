"use client";

import { useEffect, useState } from "react";
import { Navigate, Route, useLocation, useParams } from "react-router-dom";
import { IonApp, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonMenuToggle, IonPage, IonRouterOutlet, IonSpinner, IonTabBar, IonTabButton, IonTabs, IonTitle, IonToolbar, setupIonicReact, useIonRouter } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { homeOutline, barbellOutline, restaurantOutline, listOutline, trendingUpOutline, calendarOutline, personOutline, settingsOutline, logOutOutline } from "ionicons/icons";
import posthog from "posthog-js";
import { useIdentifyPostHogUser } from "@/app/hooks/use-posthog-user";
import { Toaster } from "@/app/components/ui/toaster";
import { VIEW_TITLES } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardClientData, DashboardView } from "@/app/dashboard/dashboard-types";
import type { IonicLoggerData, IonicSessionUser } from "./ionic-types";
import { IonicDashboardContent } from "./ionic-dashboard-content";
import { IonicWorkoutLogger } from "./logger/ionic-workout-logger";
import { IonicWorkoutPage, IonicExercisePage } from "./ionic-detail-pages";
import { useIonicResource } from "./use-ionic-resource";
import "@ionic/react/css/core.css";
import "@ionic/react/css/palettes/dark.class.css";
import "./ionic.css";

setupIonicReact({ animated: true });

const destinations: Array<{ view: DashboardView; icon: string }> = [
  { view: "dashboard", icon: homeOutline }, { view: "workouts", icon: listOutline },
  { view: "progress", icon: trendingUpOutline }, { view: "nutrition", icon: restaurantOutline },
  { view: "split", icon: calendarOutline }, { view: "profile", icon: personOutline }, { view: "settings", icon: settingsOutline },
];

export function IonicApp({ user }: { user: IonicSessionUser }) {
  useIdentifyPostHogUser(user);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => root.classList.toggle("ion-palette-dark", root.dataset.theme === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { observer.disconnect(); root.classList.remove("ion-palette-dark"); };
  }, []);
  return <IonApp className="ionic-app" data-ionic-app="true"><IonReactRouter><IonicRoutes user={user} /></IonReactRouter><Toaster /></IonApp>;
}

function IonicRoutes({ user }: { user: IonicSessionUser }) {
  const [revision, setRevision] = useState(0);
  const location = useLocation();
  const currentView = destinations.find(({ view }) => location.pathname === `/ionic/${view}`)?.view;
  const refresh = () => setRevision(value => value + 1);
  return <>
    <IonMenu contentId="ionic-tabs" type="overlay">
      <IonHeader><IonToolbar><IonTitle>{user.firstName || user.username}</IonTitle></IonToolbar></IonHeader>
      <IonContent><IonList>
        {destinations.map(({ view, icon }) => <IonMenuToggle key={view} autoHide={false}>
          <IonItem routerLink={`/ionic/${view}`} routerDirection="root" detail={false}><IonIcon icon={icon} slot="start" /><IonLabel>{VIEW_TITLES[view]}</IonLabel></IonItem>
        </IonMenuToggle>)}
        <IonMenuToggle><IonItem routerLink="/ionic/workouts/new" detail={false}><IonIcon icon={barbellOutline} slot="start" /><IonLabel>Log workout</IonLabel></IonItem></IonMenuToggle>
        <form method="post" action="/auth/signout" onSubmit={() => posthog.reset()}><IonButton type="submit" fill="clear" expand="block"><IonIcon icon={logOutOutline} slot="start" />Sign out</IonButton></form>
      </IonList></IonContent>
    </IonMenu>
    <div id="ionic-tabs" className="ion-page"><IonTabs>
    <IonRouterOutlet id="ionic-router">
      {destinations.map(({ view }) => <Route key={view} path={`/ionic/${view}`} element={<DashboardPage view={view} revision={revision} onRefresh={refresh} />} />)}
      <Route path="/ionic/workouts/new" element={<LoggerPage revision={revision} onRefresh={refresh} />} />
      <Route path="/ionic/workouts/:workoutId/edit" element={<LoggerPage revision={revision} onRefresh={refresh} />} />
      <Route path="/ionic/workouts/:workoutId" element={<IonicWorkoutPage revision={revision} onRefresh={refresh} />} />
      <Route path="/ionic/exercises/:exerciseKey" element={<IonicExercisePage revision={revision} />} />
      <Route path="/ionic" element={<Navigate to="/ionic/dashboard" replace />} />
      <Route path="/ionic/*" element={<Navigate to="/ionic/dashboard" replace />} />
    </IonRouterOutlet>
      <IonTabBar slot="bottom" style={{ display: currentView ? "flex" : "none" }} aria-label="Main navigation">
        <IonTabButton tab="home" href="/ionic/dashboard"><IonIcon icon={homeOutline} /><IonLabel>Home</IonLabel></IonTabButton>
        <IonTabButton tab="log" href="/ionic/workouts/new"><IonIcon icon={barbellOutline} /><IonLabel>Log</IonLabel></IonTabButton>
        <IonTabButton tab="nutrition" href="/ionic/nutrition"><IonIcon icon={restaurantOutline} /><IonLabel>Nutrition</IonLabel></IonTabButton>
      </IonTabBar>
    </IonTabs></div>
  </>;
}

function DashboardPage({ view, revision, onRefresh }: { view: DashboardView; revision: number; onRefresh: () => void }) {
  const location = useLocation();
  const active = location.pathname === `/ionic/${view}`;
  const resource = useIonicResource<DashboardClientData>(`/api/ionic?resource=dashboard&view=${view}`, active, revision);
  return <IonPage data-ionic-view={view}>
    <IonHeader><IonToolbar><IonButtons slot="start"><IonMenuButton /></IonButtons><IonTitle>{VIEW_TITLES[view]}</IonTitle>
      <IonButtons slot="end"><IonButton routerLink={`/ionic/workouts/new?from=${view}`} aria-label="Log workout"><IonIcon icon={barbellOutline} slot="icon-only" /></IonButton></IonButtons>
    </IonToolbar></IonHeader>
    <IonContent fullscreen><div className="ionic-content">
      {resource.error ? <IonicLoadError message={resource.error} retry={resource.retry} /> : !resource.data ? <IonicLoading /> : <IonicDashboardContent view={view} data={resource.data} onRefresh={onRefresh} />}
    </div></IonContent>
  </IonPage>;
}

function LoggerPage({ revision, onRefresh }: { revision: number; onRefresh: () => void }) {
  const { workoutId } = useParams();
  const location = useLocation();
  const router = useIonRouter();
  const path = workoutId ? `/ionic/workouts/${workoutId}/edit` : "/ionic/workouts/new";
  const active = location.pathname === path;
  const params = new URLSearchParams(location.search);
  params.set("resource", "logger");
  if (workoutId) params.set("workoutId", workoutId);
  const resource = useIonicResource<IonicLoggerData>(`/api/ionic?${params}`, active, revision);
  // Retained Ionic pages must never retain a saved form or a live draft writer.
  if (!active) return <IonPage />;
  if (!resource.data || resource.loading || resource.error) return <IonPage><IonHeader><IonToolbar><IonButtons slot="start"><IonBackButton defaultHref="/ionic/dashboard" /></IonButtons><IonTitle>Workout</IonTitle></IonToolbar></IonHeader><IonContent><div className="ionic-content">{resource.error ? <IonicLoadError message={resource.error} retry={resource.retry} /> : <IonicLoading />}</div></IonContent></IonPage>;
  return <IonicWorkoutLogger key={`${path}:${revision}`} data={resource.data} onSaved={id => { onRefresh(); router.push(`/ionic/workouts/${encodeURIComponent(id)}`, "root", "replace"); }} />;
}

export function IonicLoading() { return <div className="ionic-loading" role="status"><IonSpinner /><p>Loading…</p></div>; }
export function IonicLoadError({ message, retry }: { message: string; retry: () => void }) { return <div role="alert"><p>{message}</p><IonButton onClick={retry}>Retry</IonButton></div>; }
