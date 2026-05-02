import type { ReactNode } from "react";
import { ResearchRouteTransition } from "./research-route-transition";

export default function ResearchTemplate({ children }: { children: ReactNode }) {
  return <ResearchRouteTransition>{children}</ResearchRouteTransition>;
}
