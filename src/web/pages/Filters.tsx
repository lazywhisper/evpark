import { Layout } from "@/components/Layout";

export default function Filters() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Фильтры</h1>
      <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground space-y-4">
        <p>
          Сейчас фильтр зашит в коде: BMW 5-series E39, годы 2000–2004 (рестайлинг с
          допуском по краям). Регион/цена/пробег фильтруются на стороне Telegram через
          порог скора (<code>/threshold N</code>) и реакции 👍/👎.
        </p>
        <p>
          Расширенные фильтры (год, цена, пробег, регион, обязательный VIN) — в следующей
          итерации, после первой партии данных и обратной связи.
        </p>
      </div>
    </Layout>
  );
}
