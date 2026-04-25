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
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
  const { l, s } = row;
  const v = s?.visionFindingsJson ?? null;
  const t = s?.textFindingsJson ?? null;
  const flags = s?.redFlagsJson ?? [];
  const photos = (row.photoUrls && row.photoUrls.length > 0)
    ? row.photoUrls
    : (row.thumbUrl ? [row.thumbUrl] : []);
  const dateLabel = formatDate(l.firstSeenAt);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col">
      <PhotoCarousel photos={photos} alt={l.title} />
      <Link href={`/listings/${l.id}`} className="block p-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium truncate flex-1">{l.title}</div>
          {l.priceUsd != null && (
            <div className="text-base font-semibold shrink-0">${l.priceUsd}</div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{SOURCE_LABEL[l.source]}</span>
          {s && (
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
              {s.overallScore}
            </span>
          )}
          {s?.sellerType && <span className="text-xs">{SELLER_LABEL[s.sellerType]}</span>}
          {v?.mPackage && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">
              M-пакет
            </span>
          )}
          {t?.rustMentioned && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
              ржавчина
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1.5 truncate">
          {l.year && <span>{l.year}</span>}
          {l.mileageKm != null && <span> · {l.mileageKm.toLocaleString("ru")} км</span>}
          {l.region && <span> · {l.region}</span>}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
          <span>подано: {dateLabel}</span>
          {(v?.wheelsDescription || v?.wheelsModel) && (
            <span className="truncate ml-2 text-right max-w-[60%]">
              💿 {v.wheelsDescription ?? v.wheelsModel}
            </span>
          )}
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
      </Link>
    </div>
  );
}

function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  if (photos.length === 0) {
    return <div className="w-full aspect-[4/3] bg-muted" />;
  }
  return (
    <div
      className="relative w-full aspect-[4/3] overflow-x-auto snap-x snap-mandatory flex bg-muted scrollbar-thin"
      // блокируем всплытие клика на ссылку родителя при свайпе/скролле
      onClick={(e) => e.stopPropagation()}
    >
      {photos.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover snap-center shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
      ))}
      {photos.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          {photos.map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/60 shadow"
            />
          ))}
        </div>
      )}
      <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
        {photos.length}
      </div>
    </div>
  );
}

function formatDate(ts: number | string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  if (days < 1) {
    const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)));
    return hours === 1 ? "час назад" : `${hours} ч. назад`;
  }
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;
  return d.toLocaleDateString("ru-BY", { day: "numeric", month: "short" });
}
