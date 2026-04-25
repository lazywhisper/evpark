import type { Filters } from "@/lib/filters";

const SOURCES: Array<{ key: "av" | "kufar" | "onliner" | "abw"; label: string }> = [
  { key: "av", label: "av.by" },
  { key: "kufar", label: "kufar" },
  { key: "onliner", label: "onliner" },
  { key: "abw", label: "abw.by" },
];

const SELLERS: Array<{ key: "caring_owner" | "flipper" | "concealer" | "unknown"; label: string }> = [
  { key: "caring_owner", label: "🟢 владелец" },
  { key: "unknown", label: "⚪ unknown" },
  { key: "flipper", label: "🟡 перекуп" },
  { key: "concealer", label: "🔴 скрывает" },
];

export function FilterBar({
  filters,
  setFilters,
  total,
  filtered,
  regions,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  total: number;
  filtered: number;
  regions: string[];
}) {
  const update = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Фильтры</h2>
        <div className="text-xs text-muted-foreground">
          показано <span className="text-foreground font-medium">{filtered}</span> из {total}
          <button
            onClick={() => setFilters({})}
            className="ml-3 text-primary hover:underline"
          >
            сбросить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <NumField
          label="Мин. скор"
          value={filters.minScore}
          onChange={(v) => update({ minScore: v })}
          max={100}
        />
        <NumField
          label="Цена от €"
          value={filters.priceMin}
          onChange={(v) => update({ priceMin: v })}
        />
        <NumField
          label="Цена до €"
          value={filters.priceMax}
          onChange={(v) => update({ priceMax: v })}
        />
        <NumField
          label="Год от"
          value={filters.yearMin}
          onChange={(v) => update({ yearMin: v })}
          min={1995}
          max={2004}
        />
        <NumField
          label="Год до"
          value={filters.yearMax}
          onChange={(v) => update({ yearMax: v })}
          min={1995}
          max={2004}
        />
        <NumField
          label="Пробег до км"
          value={filters.mileageMax}
          onChange={(v) => update({ mileageMax: v })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <ChipGroup
          label="Источник"
          options={SOURCES}
          selected={filters.sources ?? []}
          onChange={(sources) => update({ sources })}
        />
        <ChipGroup
          label="Продавец"
          options={SELLERS}
          selected={filters.sellerTypes ?? []}
          onChange={(sellerTypes) => update({ sellerTypes })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.mPackageOnly}
            onChange={(e) => update({ mPackageOnly: e.target.checked })}
            className="accent-primary"
          />
          <span>Только M-пакет</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.hideRust}
            onChange={(e) => update({ hideRust: e.target.checked })}
            className="accent-primary"
          />
          <span>Без упоминания ржавчины</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.hideAbroad}
            onChange={(e) => update({ hideAbroad: e.target.checked })}
            className="accent-primary"
          />
          <span>Скрыть за границей</span>
        </label>
      </div>

      {regions.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Регионы ({(filters.regions ?? []).length || "все"})
          </summary>
          <div className="flex flex-wrap gap-2 mt-2">
            {regions.map((r) => {
              const active = (filters.regions ?? []).includes(r);
              return (
                <button
                  key={r}
                  onClick={() => {
                    const cur = filters.regions ?? [];
                    update({
                      regions: active ? cur.filter((x) => x !== r) : [...cur, r],
                    });
                  }}
                  className={
                    "text-xs px-2 py-1 rounded border " +
                    (active
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-secondary border-border text-foreground hover:border-primary")
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col text-xs">
      <span className="text-muted-foreground mb-1">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(e) => {
          const v = e.target.value.trim();
          onChange(v === "" ? undefined : Number(v));
        }}
        className="bg-input border border-border rounded px-2 py-1 text-sm"
      />
    </label>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Array<{ key: T; label: string }>;
  selected: T[];
  onChange: (v: T[]) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">{label}:</span>
      {options.map((o) => {
        const active = selected.includes(o.key);
        return (
          <button
            key={o.key}
            onClick={() =>
              onChange(active ? selected.filter((x) => x !== o.key) : [...selected, o.key])
            }
            className={
              "text-xs px-2 py-1 rounded border " +
              (active
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary border-border text-foreground hover:border-primary")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
