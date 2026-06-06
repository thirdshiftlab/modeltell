import { motion } from "framer-motion";

export interface RadarSeries {
  label: string;
  color: string;
  /** Normalized 0..1 values, one per axis. */
  values: number[];
}

interface Props {
  axes: string[];
  series: RadarSeries[];
  size?: number;
  showLabels?: boolean;
  className?: string;
}

function point(cx: number, cy: number, r: number, i: number, n: number) {
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
}

export function RadarChart({ axes, series, size = 360, showLabels = true, className }: Props) {
  const pad = showLabels ? 86 : 16;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - pad;
  const n = axes.length;
  const rings = [0.25, 0.5, 0.75, 1];

  const toPath = (values: number[]) =>
    values
      .map((v, i) => {
        const [x, y] = point(cx, cy, radius * Math.max(0, Math.min(1, v)), i, n);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" style={{ overflow: "visible" }}>
      {/* grid rings */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={axes
            .map((_, i) => point(cx, cy, radius * r, i, n).join(","))
            .join(" ")}
          fill="none"
          stroke="#26262b"
          strokeWidth={1}
        />
      ))}
      {/* spokes */}
      {axes.map((_, i) => {
        const [x, y] = point(cx, cy, radius, i, n);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e1e22" strokeWidth={1} />;
      })}
      {/* series */}
      {series.map((s, si) => (
        <motion.path
          key={s.label}
          d={toPath(s.values)}
          fill={s.color}
          fillOpacity={series.length > 1 ? 0.12 : 0.18}
          stroke={s.color}
          strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut", delay: si * 0.12 }}
        />
      ))}
      {/* axis labels */}
      {showLabels &&
        axes.map((label, i) => {
          const [x, y] = point(cx, cy, radius + 22, i, n);
          const anchor = x < cx - 4 ? "end" : x > cx + 4 ? "start" : "middle";
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-muted font-mono"
              style={{ fontSize: 10 }}
            >
              {label}
            </text>
          );
        })}
    </svg>
  );
}
