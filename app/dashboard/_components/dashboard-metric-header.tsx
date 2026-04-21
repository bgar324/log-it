import { styles } from "../dashboard.styles";

type DashboardMetricHeaderProps = {
  columns: string[];
  rowClassName?: string;
};

export function DashboardMetricHeader({
  columns,
  rowClassName,
}: DashboardMetricHeaderProps) {
  return (
    <div className={`${styles.metricHeader} ${rowClassName ?? ""}`}>
      {columns.map((column, index) => (
        <span
          key={`${column}-${index}`}
          className={`${styles.metricHeaderCell} ${index === 0 ? styles.metricHeaderPrimary : ""}`}
        >
          {column}
        </span>
      ))}
    </div>
  );
}
