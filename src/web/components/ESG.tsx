import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "ESG",
    h2: "ESG без затрат: нулевые выбросы и готовая отчётность",
    items: [
      { val: "0 г", label: "CO₂ на км", text: "Ваш автопарк становится частью зелёной экономики без инвестиций в инфраструктуру." },
      { val: "ESG", label: "отчётность", text: "Соответствие международным стандартам (GRI, SASB). Данные для отчётов предоставляем сами." },
      { val: "+HR", label: "бренд", text: "Современный электропарк — мощный инструмент привлечения талантов. Покажите, что вы заботитесь о будущем." },
    ],
    cta: "Узнать об ESG-преимуществах",
  },
  by: {
    tag: "ESG",
    h2: "ESG без выдаткаў: нулявыя выкіды і гатовая справаздачнасць",
    items: [
      { val: "0 г", label: "CO₂ на км", text: "Ваш аўтапарк становіцца часткай зялёнай эканомікі без інвестыцый у інфраструктуру." },
      { val: "ESG", label: "справаздачнасць", text: "Адпаведнасць міжнародным стандартам (GRI, SASB). Дадзеныя для справаздач прадастаўляем самі." },
      { val: "+HR", label: "брэнд", text: "Сучасны электрапарк — магутны інструмент прыцягнення талентаў. Пакажыце, што вы клапоціцеся пра будучыню." },
    ],
    cta: "Даведацца пра ESG-перавагі",
  },
};

interface Props { lang: Lang; }

export default function ESG({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="esg" className="py-24 bg-[#0D1810] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#3DDC84]/3 to-transparent pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <h2 className="text-4xl md:text-5xl font-bold max-w-2xl">{tx.h2}</h2>
          <a href="#contact" className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#3DDC84]/40 text-[#3DDC84] font-semibold hover:bg-[#3DDC84]/10 transition-all duration-200">{tx.cta}</a>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tx.items.map((item, i) => (
            <div key={i} className="bg-[#141414] border border-[#3DDC84]/15 rounded-2xl p-8 hover:border-[#3DDC84]/30 transition-all duration-300">
              <div className="text-[#3DDC84] font-bold text-4xl mb-1">{item.val}</div>
              <div className="text-white font-semibold text-sm mb-4">{item.label}</div>
              <p className="text-[#666] text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
