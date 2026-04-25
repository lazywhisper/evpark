import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { fetchListings, type ListingRow } from "@/lib/api";
import { applyFilters, uniqueRegions, type Filters } from "@/lib/filters";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { Charts } from "@/components/Charts";

const SOURCE_LABEL: Record<string, string> = {
  av: "av.by",
  onliner: "onliner",
  abw: "abw.by",
  kufar: "kufar",
};

const SELLER_LABEL: Record<string, string> = {
  caring_owner: "🟢",
  flipper: "🟡",
  concealer: "🔴",
  unknown: "⚪",
};

const STORAGE_KEY = "e39h.filters.v1";

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Filters;
  } catch {
    return {};
  }
}

function saveFilters(f: Filters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  } catch {}
}

export default function Dashboard() {
  const [rows, setRows] = useState<ListingRow[] | null>(null);
  const [filters, setFiltersState] = useState<Filters>(loadFilters());
  const [err, setErr] = useState<string | null>(null);

  const setFilters = (f: Filters) => {
    setFiltersState(f);
    saveFilters(f);
  };

  useEffect(() => {
    let alive = true;
    fetchListings(0, 500)
      .then((r) => alive && setRows(r.listings))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => (rows ? applyFilters(rows, filters) : []), [rows, filters]);
  const regions = useMemo(() => (rows ? uniqueRegions(rows) : []), [rows]);

  if (err)
    return (
      <Layout>
        <p className="text-destructive">Ошибка: {err}</p>
      </Layout>
    );

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">BMW E39 facelift на рынке</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Сортировка по скору. Сканер запускается раз в день в 09:00 Минск.
        </p>
      </div>

      {!rows ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <>
          <Charts rows={filtered.length > 0 ? filtered : rows} />
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            total={rows.length}
            filtered={filtered.length}
            regions={regions}
          />
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
              Под фильтры ничего не подходит. Сбрось часть условий.
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((row) => (
                <Card key={row.l.id} row={row} />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

function Card({ row }: { row: ListingRow }) {
  const { l, s, thumbUrl } = row;
  const v = s?.visionFindingsJson ?? null;
  const t = s?.textFindingsJson ?? null;
  const flags = s?.redFlagsJson ?? [];
  return (
    <Link
      href={`/listings/${l.id}`}
      className="block bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-4">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-32 h-24 sm:w-40 sm:h-28 rounded object-cover bg-muted shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="w-32 h-24 sm:w-40 sm:h-28 rounded bg-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{SOURCE_LABEL[l.source]}</span>
            {s && (
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                {s.overallScore}
              </span>
            )}
            {s?.sellerType && (
              <span className="text-xs">{SELLER_LABEL[s.sellerType]}</span>
            )}
            {v?.mPackage && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">
                M-пакет
              </span>
            )}
            {v?.wheelsModel && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                {v.wheelsModel}
              </span>
            )}
            {t?.rustMentioned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                ржавчина
              </span>
            )}
          </div>
          <div className="font-medium truncate">{l.title}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {l.year && <span>{l.year}</span>}
            {l.mileageKm != null && <span> · {l.mileageKm.toLocaleString("ru")} км</span>}
            {l.region && <span> · {l.region}</span>}
          </div>
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {flags.slice(0, 3).map((f, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          {l.priceEur != null && <div className="text-lg font-semibold">~{l.priceEur} €</div>}
          {l.priceRaw && <div className="text-xs text-muted-foreground">{l.priceRaw}</div>}
        </div>
      </div>
    </Link>
  );
}
