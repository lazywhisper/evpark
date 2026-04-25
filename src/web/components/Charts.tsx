import type { ListingRow } from "@/lib/api";

export function Charts({ rows }: { rows: ListingRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
      <ScoreHistogram rows={rows} />
      <PriceVsYear rows={rows} />
      <BySource rows={rows} />
    </div>
  );
}

function ScoreHistogram({ rows }: { rows: ListingRow[] }) {
  const bins = [0, 30, 50, 60, 70, 80, 100];
  const counts = new Array(bins.length - 1).fill(0);
  for (const r of rows) {
    const s = r.s?.overallScore ?? 0;
    for (let i = 0; i < bins.length - 1; i++) {
      if (s >= bins[i]! && s < bins[i + 1]!) {
        counts[i]++;
        break;
      }
    }
    if (s === 100) counts[counts.length - 1]++;
  }
  const max = Math.max(1, ...counts);
  const labels = ["0-30", "30-50", "50-60", "60-70", "70-80", "80+"];

  return (
    <Card title="Распределение скоров">
      <div className="flex items-end gap-1 h-32">
        {counts.map((c, i) => {
          const h = (c / max) * 100;
          const isHigh = i >= 4;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="text-[10px] text-muted-foreground mb-1">{c}</div>
              <div
                className={
                  "w-full rounded-t transition-colors " +
                  (isHigh ? "bg-primary" : "bg-secondary")
                }
                style={{ height: `${h}%` }}
              />
              <div className="text-[10px] text-muted-foreground mt-1">{labels[i]}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PriceVsYear({ rows }: { rows: ListingRow[] }) {
  const W = 280;
  const H = 140;
  const PAD = 24;
  const valid = rows.filter(
    (r) => r.l.year != null && r.l.priceEur != null && r.l.priceEur > 0,
  );
  if (valid.length === 0) {
    return (
      <Card title="Цена vs Год">
        <div className="text-xs text-muted-foreground text-center py-8">нет данных</div>
      </Card>
    );
  }
  const minY = Math.min(...valid.map((r) => r.l.year!));
  const maxY = Math.max(...valid.map((r) => r.l.year!));
  const minP = 0;
  const maxP = Math.max(...valid.map((r) => r.l.priceEur!));
  const xScale = (y: number) => PAD + ((y - minY) / Math.max(1, maxY - minY)) * (W - 2 * PAD);
  const yScale = (p: number) =>
    H - PAD - ((p - minP) / Math.max(1, maxP - minP)) * (H - 2 * PAD);
  const colorBySource: Record<string, string> = {
    av: "#fb923c",
    kufar: "#60a5fa",
    onliner: "#a78bfa",
    abw: "#f472b6",
  };

  return (
    <Card title="Цена € vs Год">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.2" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.2" />
        {/* labels */}
        <text x={PAD} y={H - 4} fontSize="9" fill="currentColor" fillOpacity="0.5">
          {minY}
        </text>
        <text x={W - PAD - 28} y={H - 4} fontSize="9" fill="currentColor" fillOpacity="0.5">
          {maxY}
        </text>
        <text x={2} y={PAD + 4} fontSize="9" fill="currentColor" fillOpacity="0.5">
          {Math.round(maxP)}€
        </text>
        <text x={2} y={H - PAD} fontSize="9" fill="currentColor" fillOpacity="0.5">
          0
        </text>
        {valid.map((r, i) => {
          const score = r.s?.overallScore ?? 0;
          const radius = 2 + (score / 100) * 3;
          return (
            <circle
              key={i}
              cx={xScale(r.l.year!)}
              cy={yScale(r.l.priceEur!)}
              r={radius}
              fill={colorBySource[r.l.source] ?? "#888"}
              fillOpacity={0.65}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-2">
        {Object.entries(colorBySource).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {s}
          </span>
        ))}
      </div>
    </Card>
  );
}

function BySource({ rows }: { rows: ListingRow[] }) {
  const counts: Record<string, number> = { av: 0, kufar: 0, onliner: 0, abw: 0 };
  for (const r of rows) counts[r.l.source]!++;
  const max = Math.max(1, ...Object.values(counts));
  const labels: Record<string, string> = {
    av: "av.by",
    kufar: "kufar",
    onliner: "onliner",
    abw: "abw.by",
  };

  return (
    <Card title="По источникам">
      <div className="space-y-2">
        {Object.entries(counts).map(([s, c]) => (
          <div key={s} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">{labels[s]}</span>
            <div className="flex-1 bg-secondary rounded h-4 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{ width: `${(c / max) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] font-mono">
                {c}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}
