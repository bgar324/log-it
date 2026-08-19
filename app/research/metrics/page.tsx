import {
  DASHBOARD_METRIC_DEFINITIONS_CATEGORY,
  DASHBOARD_METRIC_DEFINITIONS_SUMMARY,
  DASHBOARD_METRIC_DEFINITIONS_TITLE,
  DASHBOARD_METRIC_DEFINITIONS_UPDATED_AT,
  DashboardMetricDefinitionsPaper,
} from "../dashboard-metric-definitions-paper";
import { ResearchPaperPageShell } from "../paper-page-shell";

export default function DashboardMetricDefinitionsPage() {
  return (
    <ResearchPaperPageShell
      ariaLabel="logit dashboard metric definitions paper"
      title={DASHBOARD_METRIC_DEFINITIONS_TITLE}
      category={DASHBOARD_METRIC_DEFINITIONS_CATEGORY}
      updatedAt={DASHBOARD_METRIC_DEFINITIONS_UPDATED_AT}
      art="/art/card-dashboard.webp"
      lede={DASHBOARD_METRIC_DEFINITIONS_SUMMARY}
    >
      <DashboardMetricDefinitionsPaper id="dashboard-metric-definitions" />
    </ResearchPaperPageShell>
  );
}
