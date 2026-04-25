import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { fetchListing, type Listing, type Scoring } from "@/lib/api";
import { Layout } from "@/components/Layout";

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<{ listing: Listing; scoring: Scoring | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    fetchListing(params.id)
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, [params.id]);

  if (err) return <Layout><p className="text-destructive">{err}</p></Layout>;
  if (!data) return <Layout><p className="text-muted-foreground">Загрузка...</p></Layout>;

  const { listing: l, scoring: s } = data;

  return (
    <Layout>
      <a href={l.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">
        ← {l.url}
      </a>
      <h1 className="text-2xl font-bold mt-2">{l.title}</h1>
      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
        {l.year && <span>{l.year} год</span>}
        {l.mileageKm != null && <span>{l.mileageKm.toLocaleString("ru")} км</span>}
        {l.region && <span>{l.region}</span>}
        {l.priceEur != null && <span className="text-foreground font-medium">~{l.priceEur} €</span>}
      </div>

      {s && (
        <section className="mt-6 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">AI-разбор</h2>
            <div className="text-2xl font-mono text-primary">{s.overallScore}</div>
          </div>
          {s.visionFindingsJson && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Кузов</div>
                <div className="font-mono text-lg">{s.visionFindingsJson.rust}/10</div>
              </div>
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Салон</div>
                <div className="font-mono text-lg">{s.visionFindingsJson.interior}/10</div>
              </div>
              <div className="text-center bg-secondary rounded p-2">
                <div className="text-xs text-muted-foreground">Оригинальность</div>
                <div className="font-mono text-lg">{s.visionFindingsJson.originality}/10</div>
              </div>
            </div>
          )}
          {s.visionFindingsJson?.defects?.length ? (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">Дефекты:</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {s.visionFindingsJson.defects.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          ) : null}
          {s.redFlagsJson?.length ? (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">Красные флаги:</div>
              <div className="flex flex-wrap gap-2">
                {s.redFlagsJson.map((f, i) => (
                  <span key={i} className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {s.sellerType && (
            <div className="mt-3 text-sm">
              Продавец: <strong>{s.sellerType}</strong>
            </div>
          )}
        </section>
      )}

      {l.description && (
        <section className="mt-6 bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Описание</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{l.description}</p>
        </section>
      )}
    </Layout>
  );
}
