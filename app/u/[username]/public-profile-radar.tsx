import type { PublicProfileRadarAxis } from "@/lib/public-profile";
import { publicProfileStyles as styles } from "./public-profile.styles";

type PublicProfileRadarProps = {
  axes: PublicProfileRadarAxis[];
};

function polarPoint(center: number, radius: number, index: number, total: number) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;

  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function pointsToString(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

export function PublicProfileRadar({ axes }: PublicProfileRadarProps) {
  const size = 360;
  const center = size / 2;
  const maxRadius = 92;
  const labelRadius = 145;
  const rings = [0.25, 0.5, 0.75, 1];
  const shapePoints = axes.map((axis, index) =>
    polarPoint(center, maxRadius * (axis.value / 12), index, axes.length),
  );

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Training radar chart"
      className={styles.radarSvg}
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={pointsToString(
            axes.map((_, index) =>
              polarPoint(center, maxRadius * ring, index, axes.length),
            ),
          )}
          className={styles.radarGrid}
          strokeWidth="1"
        />
      ))}

      {axes.map((axis, index) => {
        const end = polarPoint(center, maxRadius, index, axes.length);

        return (
          <line
            key={axis.key}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            className={styles.radarAxis}
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={pointsToString(shapePoints)}
        className={styles.radarShape}
        strokeWidth="2.4"
      />

      {shapePoints.map((point, index) => (
        <circle
          key={axes[index]?.key}
          cx={point.x}
          cy={point.y}
          r="3.8"
          className={styles.radarPoint}
        />
      ))}

      {axes.map((axis, index) => {
        const point = polarPoint(center, labelRadius, index, axes.length);
        const anchor =
          Math.abs(point.x - center) < 8 ? "middle" : point.x > center ? "start" : "end";

        return (
          <text
            key={axis.key}
            x={point.x}
            y={point.y}
            textAnchor={anchor}
            dominantBaseline="middle"
          >
            <tspan className={styles.radarLabel} x={point.x} dy="-0.35em">
              {axis.label}
            </tspan>
            <tspan className={styles.radarValue} x={point.x} dy="1.25em">
              {axis.value}/12
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
