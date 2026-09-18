"use client";

import dynamic from "next/dynamic";
import type { IonicSessionUser } from "./ionic-types";

const IonicApp = dynamic(() => import("./ionic-app").then(module => module.IonicApp), {
  ssr: false,
  loading: () => <main role="status" style={{ padding: "max(env(safe-area-inset-top), 24px) 24px" }}>Opening Logit…</main>,
});

export function IonicEntry({ user }: { user: IonicSessionUser }) {
  return <IonicApp user={user} />;
}
