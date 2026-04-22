import { DashboardMetricDefinitionsPaper } from "../dashboard-metric-definitions-paper";
import { ResearchPaperPageShell } from "../paper-page-shell";

export default function DashboardMetricDefinitionsPage() {
  return (
    <ResearchPaperPageShell ariaLabel="logit dashboard metric definitions paper">
      <DashboardMetricDefinitionsPaper id="dashboard-metric-definitions" />
    </ResearchPaperPageShell>
  );
}
