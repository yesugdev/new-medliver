"use client";

/**
 * Гуравдагч сангүй (dependency-free) SVG график компонентууд.
 * xlsx-тэй адил build тогтворгүй болгохоос сэргийлж Recharts нэмэхгүйгээр
 * хөнгөн SVG-ээр зурсан — Pie/Donut, Bar, Horizontal Bar, Line/Area.
 */

export const CHART_PALETTE = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7",
  "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#3b82f6", "#eab308",
];

export interface Slice {
  label: string;
  value: number;
  color?: string;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("mn-MN").format(Math.round(n));
}

function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      Мэдээлэл байхгүй
    </div>
  );
}

/* ── Pie / Donut ─────────────────────────────────────────────────────── */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function PieChart({
  data,
  donut = false,
  size = 180,
}: {
  data: Slice[];
  donut?: boolean;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return <EmptyChart />;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const innerR = donut ? r * 0.58 : 0;

  let angle = 0;
  const arcs = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const frac = d.value / total;
      const start = angle;
      const end = angle + frac * 360;
      angle = end;
      const color = d.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
      const large = end - start > 180 ? 1 : 0;

      // Бүтэн дугуй (1 зүсэм) — arc биш circle
      if (frac >= 0.9999) {
        return { color, full: true, d: "" };
      }
      const p1 = polar(cx, cy, r, start);
      const p2 = polar(cx, cy, r, end);
      if (!donut) {
        return {
          color,
          full: false,
          d: `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`,
        };
      }
      const i1 = polar(cx, cy, innerR, end);
      const i2 = polar(cx, cy, innerR, start);
      return {
        color,
        full: false,
        d: `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`,
      };
    });

  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {arcs.map((a, i) =>
          a.full ? (
            <circle key={i} cx={cx} cy={cy} r={r} fill={a.color} />
          ) : (
            <path key={i} d={a.d} fill={a.color} stroke="#fff" strokeWidth={1} />
          ),
        )}
        {donut && <circle cx={cx} cy={cy} r={innerR} fill="var(--card, #fff)" />}
      </svg>
      <ul className="space-y-1.5 text-sm min-w-[140px]">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ background: d.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }}
              />
              <span className="flex-1 truncate">{d.label}</span>
              <span className="font-medium tabular-nums">{fmt(d.value)}</span>
              <span className="text-muted-foreground text-xs tabular-nums w-12 text-right">
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Vertical bar ────────────────────────────────────────────────────── */
export function BarChart({
  data,
  height = 220,
  format = fmt,
}: {
  data: Slice[];
  height?: number;
  format?: (n: number) => string;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) return <EmptyChart height={height} />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = Math.max(data.length * 56, 280);
  const H = height;
  const padB = 42;
  const padT = 18;
  const chartH = H - padB - padT;
  const bw = W / data.length;

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ minWidth: W > 480 ? W : undefined }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={0}
            x2={W}
            y1={padT + chartH * (1 - g)}
            y2={padT + chartH * (1 - g)}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = i * bw + bw * 0.2;
          const y = padT + chartH - h;
          const w = bw * 0.6;
          const color = d.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={w} height={Math.max(h, 0)} rx={3} fill={color} />
              <text x={x + w / 2} y={y - 5} textAnchor="middle" className="fill-current text-foreground" fontSize={11} fontWeight={600}>
                {d.value > 0 ? format(d.value) : ""}
              </text>
              <text x={x + w / 2} y={H - 14} textAnchor="middle" className="fill-current text-muted-foreground" fontSize={10}>
                {d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Horizontal bar ──────────────────────────────────────────────────── */
export function HBarChart({
  data,
  format = fmt,
}: {
  data: Slice[];
  format?: (n: number) => string;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) return <EmptyChart />;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-2">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color = d.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
        return (
          <li key={d.label} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate text-muted-foreground" title={d.label}>
              {d.label}
            </span>
            <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(pct, 2)}%`, background: color }}
              />
            </div>
            <span className="w-14 text-right font-medium tabular-nums">{format(d.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Line / Area ─────────────────────────────────────────────────────── */
export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

export function LineChart({
  categories,
  series,
  area = false,
  height = 240,
  format = fmt,
}: {
  categories: string[];
  series: LineSeries[];
  area?: boolean;
  height?: number;
  format?: (n: number) => string;
}) {
  const hasData = categories.length > 0 && series.some((s) => s.values.some((v) => v > 0));
  if (!hasData) return <EmptyChart height={height} />;

  const W = 640;
  const H = height;
  const padL = 44;
  const padR = 12;
  const padB = 34;
  const padT = 14;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;

  const max = Math.max(...series.flatMap((s) => s.values), 1);
  const n = categories.length;
  const xOf = (i: number) => padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yOf = (v: number) => padT + chartH - (v / max) * chartH;

  // X шошго — хэт олон бол зөвхөн зарим нь
  const labelStep = Math.ceil(n / 8);

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + chartH * (1 - g);
          return (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="currentColor" className="text-border" strokeWidth={1} strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-current text-muted-foreground" fontSize={9}>
                {format(max * g)}
              </text>
            </g>
          );
        })}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
          return (
            <g key={s.name}>
              {area && (
                <polygon
                  points={`${padL},${padT + chartH} ${pts} ${xOf(n - 1)},${padT + chartH}`}
                  fill={s.color}
                  opacity={0.14}
                />
              )}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {n <= 40 &&
                s.values.map((v, i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r={2.5} fill={s.color} />)}
            </g>
          );
        })}
        {categories.map((c, i) =>
          i % labelStep === 0 ? (
            <text key={i} x={xOf(i)} y={H - 12} textAnchor="middle" className="fill-current text-muted-foreground" fontSize={9}>
              {c}
            </text>
          ) : null,
        )}
      </svg>
      {series.length > 1 && (
        <div className="flex flex-wrap gap-4 justify-center mt-1">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
