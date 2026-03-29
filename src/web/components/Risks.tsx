import { RefreshCw, Wrench, Shield, Timer } from "lucide-react";
import type { Lang } from "../pages/index";

const ICONS = [RefreshCw, Wrench, Shield, Timer];

const t = {
  ru: {
    tag: "Риски",
    h2: "Мы снимаем операционные риски",
    note: "Вы получаете предсказуемую модель расходов",
    items: [
      { risk: "Поломка авто", solution: "Замена авто" },
      { risk: "Обслуживание", solution: "На нас" },
      { risk: "Страхование", solution: "Включено" },
      { risk: "Простои", solution: "Минимизированы" },
    ],
    cta: "Получить предсказуемую модель расходов",
  },
  by: {
    tag: "Рызыкі",
    h2: "Мы здымаем аперацыйныя рызыкі",
    note: "Вы атрымліваеце прадказальную мадэль расходаў",
    items: [
      { risk: "Паломка аўто", solution: "Замена аўто" },
      { risk: "Абслугоўванне", solution: "На нас" },
      { risk: "Страхаванне", solution: "Уключана" },
      { risk: "Прастоі", solution: "Мінімізаваны" },
    ],
    cta: "Атрымаць прадказальную мадэль расходаў",
  },
};

interface Props { lang: Lang; }

export default function Risks({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="risks" className="py-24 bg-[#111111]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-3">{tx.h2}</h2>
        <p className="text-[#3DDC84] text-sm font-medium mb-12">{tx.note}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {tx.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#3DDC84]/30 transition-all duration-300">
                <div className="mb-4 text-[#3DDC84]"><Icon size={28} /></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#666] text-sm line-through">{item.risk}</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="text-[#3DDC84] font-bold text-lg">{item.solution}</div>
              </div>
            );
          })}
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
