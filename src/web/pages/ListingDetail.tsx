import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { fetchListing, type Listing, type Photo, type Scoring } from "@/lib/api";
import { Layout } from "@/components/Layout";

const SELLER_LABEL: Record<string, string> = {
  caring_owner: "🟢 ухоженный владелец",
  flipper: "🟡 перекуп",
  concealer: "🔴 что-то скрывает",
  unknown: "⚪ непонятно",
};

const WHEELS_LABEL: Record<string, string> = {
  oem: "OEM",
  m_oem: "M-Style OEM",
  aftermarket: "тюнинг",
  steel: "штамповка",
  unknown: "—",
};

const COMM_LABEL: Record<string, string> = {
  warm_owner: "тёплый владелец",
  professional: "деловой",
  salesy: "продающий",
  terse: "односложный",
  evasive: "уклончивый",
};
const KNOW_LABEL: Record<string, string> = {
  expert: "эксперт",
  informed: "разбирается",
  basic: "поверхностно",
  unclear: "—",
};
const NEG_LABEL: Record<string, string> = {
  firm: "не торгуется",
  open: "торг возможен",
  aggressive: "давит",
  needs_quick_sale: "нужна срочная продажа",
  unknown: "—",
};
const TONE_LABEL: Record<string, string> = {
  proud: "гордится",
  neutral: "нейтрально",
  rushed: "впопыхах",
  defensive: "защищается",
  salesy: "восторженно",
};
const COH_LABEL: Record<string, string> = {
  consistent: "стройно",
  gaps: "пропуски",
  contradictions: "противоречия",
};

function highlightQuotes(
  text: string,
  positive: string[],
  negative: string[],
): React.ReactNode[] {
  const ranges: Array<{ start: number; end: number; kind: "pos" | "neg" }> = [];
  for (const q of positive ?? []) {
    if (q.length < 5) continue;
    const i = text.indexOf(q);
    if (i >= 0) ranges.push({ start: i, end: i + q.length, kind: "pos" });
  }
  for (const q of negative ?? []) {
    if (q.length < 5) continue;
    const i = text.indexOf(q);
    if (i >= 0) ranges.push({ start: i, end: i + q.length, kind: "neg" });
  }
  ranges.sort((a, b) => a.start - b.start);
  // remove overlaps (keep first)
  const clean: typeof ranges = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      clean.push(r);
      lastEnd = r.end;
    }
  }
  if (clean.length === 0) return [text];
  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < clean.length; i++) {
    const r = clean[i]!;
    if (r.start > cursor) out.push(text.slice(cursor, r.start));
    const cls =
      r.kind === "pos"
        ? "bg-emerald-500/20 text-emerald-200 px-0.5 rounded"
        : "bg-amber-500/20 text-amber-200 px-0.5 rounded";
    out.push(
      <mark key={i} className={cls}>
        {text.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<{
    listing: Listing;
    scoring: Scoring | null;
    photos: Photo[];
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    fetchListing(params.id)
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, [params.id]);

  if (err) return <Layout><p className="text-destructive">{err}</p></Layout>;
  if (!data) return <Layout><p className="text-muted-foreground">Загрузка...</p></Layout>;

  const { listing: l, scoring: s, photos } = data;
  const v = s?.visionFindingsJson ?? null;
  const t = s?.textFindingsJson ?? null;

  return (
    <Layout>
      <a href={l.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm break-all">
        ← {l.url}
      </a>
      <h1 className="text-2xl font-bold mt-2">{l.title}</h1>
      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
        {l.year && <span>{l.year} год</span>}
        {l.mileageKm != null && <span>{l.mileageKm.toLocaleString("ru")} км</span>}
        {l.transmission && <span>{l.transmission}</span>}
        {l.region && <span>{l.region}</span>}
        {l.priceUsd != null && <span className="text-foreground font-medium">${l.priceUsd}</span>}
        {l.firstSeenAt && (
          <span title={new Date(l.firstSeenAt).toLocaleString("ru-BY")}>
            подано {new Date(l.firstSeenAt).toLocaleDateString("ru-BY", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>

      {photos.length > 0 && (
        <section className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.slice(0, 12).map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block">
              <img
                src={p.url}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full aspect-[4/3] object-cover rounded bg-muted hover:opacity-80 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
            </a>
          ))}
        </section>
      )}

      {s && (
        <section className="mt-6 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">AI-разбор</h2>
            <div className="text-2xl font-mono text-primary">{s.overallScore}</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {s.visionScore != null && (
              <Stat label="Vision" value={`${s.visionScore}/100`} />
            )}
            {s.textScore != null && (
              <Stat label="Text" value={`${s.textScore}/100`} />
            )}
            {s.sellerType && <Stat label="Продавец" value={SELLER_LABEL[s.sellerType] ?? s.sellerType} />}
            {t?.bodyConditionFromText != null && (
              <Stat label="Кузов (по тексту)" value={`${t.bodyConditionFromText}/10`} />
            )}
          </div>

          {/* Vision findings — новые */}
          {v && (v.mPackage !== undefined || v.wheelsDescription || v.wheelsModel || v.seatsCondition != null) && (
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">M-пакет</div>
                <div className="font-mono text-base">{v.mPackage ? "Да" : "Нет"}</div>
              </div>
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Диски ({WHEELS_LABEL[v.wheelsCategory ?? "unknown"]})</div>
                <div className="text-xs leading-tight">
                  {v.wheelsDescription ?? v.wheelsModel ?? "—"}
                </div>
              </div>
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Сидения</div>
                <div className="font-mono text-base">{v.seatsCondition ?? "—"}/10</div>
              </div>
            </div>
          )}

          {/* legacy vision (старые записи) */}
          {v && v.rust != null && (
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Кузов (legacy)</div>
                <div className="font-mono text-lg">{v.rust}/10</div>
              </div>
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Салон</div>
                <div className="font-mono text-lg">{v.interior}/10</div>
              </div>
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Оригинал</div>
                <div className="font-mono text-lg">{v.originality}/10</div>
              </div>
            </div>
          )}

          {/* Text findings */}
          {t && (
            <div className="mt-4 space-y-3 text-sm">
              {t.psychSummary && (
                <div className="bg-primary/5 border-l-2 border-primary p-3 rounded">
                  <div className="text-xs text-muted-foreground mb-1">Психологический портрет:</div>
                  <div className="text-sm leading-snug">{t.psychSummary}</div>
                </div>
              )}

              {t.sellerProfile && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {t.sellerProfile.communicationStyle && (
                    <Stat label="Стиль" value={COMM_LABEL[t.sellerProfile.communicationStyle]} />
                  )}
                  {t.sellerProfile.knowledgeLevel && (
                    <Stat label="Знание" value={KNOW_LABEL[t.sellerProfile.knowledgeLevel]} />
                  )}
                  {t.sellerProfile.negotiationPosture && (
                    <Stat label="Торг" value={NEG_LABEL[t.sellerProfile.negotiationPosture]} />
                  )}
                  {t.sellerProfile.emotionalTone && (
                    <Stat label="Тон" value={TONE_LABEL[t.sellerProfile.emotionalTone]} />
                  )}
                  {t.sellerProfile.reasonForSelling && (
                    <Stat label="Причина продажи" value={t.sellerProfile.reasonForSelling} />
                  )}
                  {t.sellerProfile.storyCoherence && (
                    <Stat label="Связность" value={COH_LABEL[t.sellerProfile.storyCoherence]} />
                  )}
                </div>
              )}

              {t.keyFacts && t.keyFacts.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Ключевые факты:</div>
                  <ul className="text-xs space-y-1 list-disc pl-5">
                    {t.keyFacts.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {t.sellerProfile?.trustSignals && t.sellerProfile.trustSignals.length > 0 && (
                <Tags label="Сигналы доверия" items={t.sellerProfile.trustSignals} kind="ok" />
              )}

              {t.workDone && t.workDone.length > 0 && (
                <Tags label="Сделано" items={t.workDone} kind="ok" />
              )}
              {t.workNeeded && t.workNeeded.length > 0 && (
                <Tags label="Нужно" items={t.workNeeded} kind="warn" />
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                {t.rustMentioned && <Pill kind="warn">ржавчина упомянута</Pill>}
                {t.mileageHonesty === "suspicious" && <Pill kind="warn">пробег под вопросом</Pill>}
                {t.mileageHonesty === "honest" && <Pill kind="ok">пробег родной</Pill>}
                {t.urgency && <Pill kind="warn">срочная продажа</Pill>}
                {t.exchange && <Pill kind="warn">обмен</Pill>}
                {t.abroad && <Pill kind="warn">за границей</Pill>}
                {t.polishUp && <Pill kind="warn">шаблонные фразы</Pill>}
                {t.ownershipDuration === "long" && <Pill kind="ok">долгое владение</Pill>}
                {t.ownersCount === 1 && <Pill kind="ok">один владелец</Pill>}
              </div>
            </div>
          )}

          {s.redFlagsJson && s.redFlagsJson.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">Красные флаги:</div>
              <div className="flex flex-wrap gap-2">
                {s.redFlagsJson.map((f, i) => (
                  <span key={i} className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {l.description && (
        <section className="mt-6 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Описание</h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded bg-emerald-500/60" />
              <span>положительные</span>
              <span className="inline-block w-2 h-2 rounded bg-amber-500/60 ml-2" />
              <span>настораживающие</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {highlightQuotes(
              l.description,
              t?.positiveQuotes ?? [],
              t?.negativeQuotes ?? [],
            )}
          </p>
        </section>
      )}
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function Tags({ label, items, kind }: { label: string; items: string[]; kind: "ok" | "warn" }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}:</div>
      <div className="flex flex-wrap gap-1">
        {items.map((x, i) => (
          <Pill key={i} kind={kind}>
            {x}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({ children, kind }: { children: React.ReactNode; kind: "ok" | "warn" }) {
  const cls =
    kind === "ok"
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-amber-500/15 text-amber-300";
  return <span className={`text-[11px] px-2 py-0.5 rounded ${cls}`}>{children}</span>;
}
