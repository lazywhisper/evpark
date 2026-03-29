import { ChevronRight, Banknote, Wallet, TrendingDown, Briefcase } from "lucide-react";
import type { Lang } from "../pages/index";

const SAVINGS_ICONS = [Wallet, TrendingDown, Briefcase];

const t = {
  ru: {
    tag: "Сравнение",
    h2: "Почему владение автопарком убивает прибыль, а не создаёт её",
    buyLabel: "Покупка автопарка",
    rentLabel: "Fleet-as-a-Service (EVPark)",
    rentBadge: "Выбор бизнеса",
    rows: [
      {
        buy: "−500 000+ BYN заморожено в активах (0% доходности)",
        rent: "0 BYN капитальных вложений",
      },
      {
        buy: "−8 500 BYN/мес на топливо (растёт каждый год)",
        rent: "~2 100 BYN/мес на зарядку (в 3–4 раза дешевле)",
      },
      {
        buy: "−700–1 500 BYN/мес скрытые ремонты и износ",
        rent: "0 BYN на ремонты — всё включено",
      },
      {
        buy: "Простой = прямые потери выручки",
        rent: "Подменный авто за 4 часа → нет простоев",
      },
      {
        buy: "Обесценивание авто: −15–25% в год",
        rent: "Фиксированный платёж — полный контроль бюджета",
      },
      {
        buy: "—",
        rent: "−6 400 BYN/мес экономия на топливе",
        highlight: true,
      },
    ],
    buyTotal: "Неконтролируемые расходы + замороженный капитал",
    rentTotal: "−40–60% затрат + высвобождение капитала",
    savingsTitle: "Экономический эффект на 1 авто в год:",
    savings: [
      { val: "до 6 000 – 10 000 BYN", label: "экономия в год" },
      { val: "−80%", label: "внеплановых затрат" },
      { val: "500 000+ BYN", label: "высвобождение капитала на 10 авто" },
    ],
    cta: "Получить персональный расчёт экономии",
    insight: "Владение автопарком — финансово неэффективная модель. Мы это меняем.",
  },
  by: {
    tag: "Параўнанне",
    h2: "Чаму валоданне аўтапаркам забівае прыбытак, а не стварае яго",
    buyLabel: "Купля аўтапарка",
    rentLabel: "Fleet-as-a-Service (EVPark)",
    rentBadge: "Выбар бізнесу",
    rows: [
      {
        buy: "−500 000+ BYN замарожана ў актывах (0% даходнасці)",
        rent: "0 BYN капітальных укладанняў",
      },
      {
        buy: "−8 500 BYN/мес на паліва (расце кожны год)",
        rent: "~2 100 BYN/мес на зарадку (у 3–4 разы танней)",
      },
      {
        buy: "−700–1 500 BYN/мес схаваныя рамонты і знос",
        rent: "0 BYN на рамонты — усё ўключана",
      },
      {
        buy: "Прастой = прамыя страты выручкі",
        rent: "Падменны аўто за 4 гадзіны → няма прастояў",
      },
      {
        buy: "Абясцэньванне аўто: −15–25% у год",
        rent: "Фіксаваны плацёж — поўны кантроль бюджэту",
      },
      {
        buy: "—",
        rent: "−6 400 BYN/мес эканомія на паліве",
        highlight: true,
      },
    ],
    buyTotal: "Некантраляваныя расходы + замарожаны капітал",
    rentTotal: "−40–60% выдаткаў + вызваленне капіталу",
    savingsTitle: "Эканамічны эфект на 1 аўто ў год:",
    savings: [
      { val: "да 6 000 – 10 000 BYN", label: "эканомія ў год" },
      { val: "−80%", label: "пазапланавых выдаткаў" },
      { val: "500 000+ BYN", label: "вызваленне капіталу на 10 аўто" },
    ],
    cta: "Атрымаць персанальны разлік эканоміі",
    insight: "Валоданне аўтапаркам — фінансава неэфектыўная мадэль. Мы гэта мяняем.",
  },
};

interface Props { lang: Lang; }

export default function Comparison({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="comparison" className="py-24 bg-[#111111]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-12 max-w-3xl">{tx.h2}</h2>

        {/* Main table */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Buy column */}
          <div className="bg-[#141414] border border-red-900/30 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-red-900/30 bg-red-900/10">
              <span className="text-white font-bold text-base">{tx.buyLabel}</span>
            </div>
            <div className="p-6 space-y-3">
              {tx.rows.map((row, i) => (
                <div key={i} className={`flex items-start gap-2 ${row.highlight ? "opacity-30" : ""}`}>
                  <svg className="shrink-0 mt-1" width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[#888] text-sm">{row.buy}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-red-900/30 bg-red-900/5">
              <p className="text-red-400 text-sm font-semibold flex items-center gap-1.5">
                <ChevronRight size={14} className="shrink-0" />
                {tx.buyTotal}
              </p>
            </div>
          </div>

          {/* Rent column — glowing winner */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 0 40px rgba(61,220,132,0.15), 0 0 80px rgba(61,220,132,0.05)" }}>
            <div className="absolute inset-0 bg-[#3DDC84]/5 pointer-events-none" />
            <div className="relative bg-[#141414] border border-[#3DDC84]/40 rounded-2xl overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-[#3DDC84]/20 bg-[#3DDC84]/10 flex items-center justify-between">
                <span className="text-white font-bold text-base">{tx.rentLabel}</span>
                <span className="bg-[#3DDC84] text-[#0A0A0A] text-xs font-bold px-3 py-1 rounded-full">{tx.rentBadge}</span>
              </div>
              <div className="p-6 space-y-3">
                {tx.rows.map((row, i) => (
                  <div key={i} className={`flex items-start gap-2 ${row.highlight ? "bg-[#3DDC84]/10 -mx-2 px-2 py-1.5 rounded-lg border border-[#3DDC84]/20" : ""}`}>
                    <svg className="shrink-0 mt-1" width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="#3DDC84" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={`text-sm ${row.highlight ? "text-[#3DDC84] font-bold" : "text-white"}`}>{row.rent}</span>
                    {row.highlight && <span className="ml-auto text-[#3DDC84] text-xs font-bold bg-[#3DDC84]/10 px-2 py-0.5 rounded-full shrink-0">Экономия</span>}
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-[#3DDC84]/20 bg-[#3DDC84]/5">
                <p className="text-[#3DDC84] text-sm font-semibold flex items-center gap-1.5">
                  <ChevronRight size={14} className="shrink-0" />
                  {tx.rentTotal}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Savings block */}
        <div className="bg-[#141414] border border-[#3DDC84]/20 rounded-2xl p-8 mb-8">
          <p className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <Banknote size={20} className="text-[#3DDC84]" />
            {tx.savingsTitle}
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {tx.savings.map((s, i) => {
              const SIcon = SAVINGS_ICONS[i];
              return (
                <div key={i} className="bg-[#0A0A0A] rounded-xl p-5 text-center">
                  <div className="flex justify-center mb-2">
                    <SIcon size={28} className="text-[#3DDC84]" />
                  </div>
                  <div className="text-[#3DDC84] font-bold text-2xl mb-1">{s.val}</div>
                  <div className="text-[#666] text-xs">{s.label}</div>
                </div>
              );
            })}
          </div>
          <div className="bg-[#3DDC84]/5 border border-[#3DDC84]/15 rounded-xl px-5 py-3">
            <p className="text-[#3DDC84] text-sm font-semibold text-center">{tx.insight}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <a href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-bold hover:bg-[#2BC870] transition-all duration-200 hover:scale-105 shadow-lg shadow-[#3DDC84]/20">
            {tx.cta}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
