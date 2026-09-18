import type { DashboardClientData } from "@/app/dashboard/dashboard-types";

/**
 * Every dashboard view renders from the payload the Ionic shell already
 * fetched, and asks the shell to refetch after a change the server owns.
 * Named rather than inferred so a view's signature does not depend on the
 * shell's internals.
 */
export type IonicDashboardViewProps = {
  data: DashboardClientData;
  onRefresh: () => void;
};
