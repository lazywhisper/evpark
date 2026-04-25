import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchListings, type ListingRow } from "@/lib/api";
import { Layout } from "@/components/Layout";

const SOURCE_LABEL: Record<string, string> = {
  av: "av.by",
  onliner: "onliner",
  abw: "abw.by",
  kufar: "kufar",
};

const SELLER_LABEL: Record<string, string> = {
  caring_owner: "🟢 владелец",
  flipper: "🟡 перекуп",
  concealer: "🔴 скрывает",
  unknown: "⚪ unknown",
};

export default function Dashboard() {
  const [rows, setRows] = useState<ListingRow[] | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchListings(minScore, 100)
      .then((r) => alive && setRows(r.listings))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [minScore]);

  if (err)
    return (
      <Layout>
        <p className="text-destructive">Ошибка: {err}</p>
      </Layout>
    );

  return (
    <Layout>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">BMW E39 facelift на рынке</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Сортировка по скору. Сканер запускается раз в день в 09:00 Минск.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Мин. скор:
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value) || 0)}
            className="w-16 bg-input border border-border rounded px-2 py-1 text-foreground"
          />
        </label>
      </div>

      {!rows ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Пока ничего не нашлось. Запусти{" "}
          <code className="bg-card px-2 py-1 rounded">/scan_now</code> или{" "}
          <code className="bg-card px-2 py-1 rounded">/bootstrap</code> в Telegram.
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ l, s }) => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="block bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{SOURCE_LABEL[l.source]}</span>
                    {s && (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                        {s.overallScore}
                      </span>
                    )}
                    {s?.sellerType && (
                      <span className="text-xs text-muted-foreground">{SELLER_LABEL[s.sellerType]}</span>
                    )}
                  </div>
                  <div className="font-medium truncate">{l.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {l.year && <span>{l.year}</span>}
                    {l.mileageKm != null && <span> · {l.mileageKm.toLocaleString("ru")} км</span>}
                    {l.region && <span> · {l.region}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {l.priceEur != null && (
                    <div className="text-lg font-semibold">~{l.priceEur} €</div>
                  )}
                  {l.priceRaw && (
                    <div className="text-xs text-muted-foreground">{l.priceRaw}</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
