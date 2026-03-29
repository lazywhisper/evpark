import { Wallet, TrendingDown, Wrench, PauseCircle } from "lucide-react";
import type { Lang } from "../pages/index";

const ICONS = [Wallet, TrendingDown, Wrench, PauseCircle];

const t = {
  ru: {
    h2: "Автопарк, который должен работать на вас, работает против вас",
    lead: "Каждый день ваши машины стоят в ремонте, теряют в цене и сжигают деньги на заправке. А вы вместо развития бизнеса тушите операционные пожары.",
    listTitle: "4 источника скрытых потерь, которые мы устраняем:",
    items: [
      { text: "Заморозка капитала в автомобилях" },
      { text: "Амортизация и потеря стоимости" },
      { text: "Расходы на обслуживание и ремонты" },
      { text: "Простой автомобилей" },
    ],
    cta: "Рассчитать потери вашего автопарка",
  },
  by: {
    h2: "Аўтапарк, які павінен працаваць на вас, працуе супраць вас",
    lead: "Кожны дзень вашы машыны стаяць у рамонце, губляюць у цане і спальваюць грошы на заправцы. А вы замест развіцця бізнесу тушыце аперацыйныя пажары.",
    listTitle: "4 крыніцы схаваных страт, якія мы ліквідуем:",
    items: [
      { text: "Замарозка капіталу ў аўтамабілях" },
      { text: "Амартызацыя і страта кошту" },
      { text: "Расходы на абслугоўванне і рамонты" },
      { text: "Прастой аўтамабіляў" },
    ],
    cta: "Разлічыць страты вашага аўтапарка",
  },
};

interface Props { lang: Lang; }

export default function Pain({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="pain" className="py-24 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3DDC84]/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-5">{tx.h2}</h2>
            <p className="text-[#A0A0A0] text-lg mb-6 leading-relaxed">{tx.lead}</p>
            <p className="text-white font-semibold text-sm mb-4">{tx.listTitle}</p>
            <ul className="space-y-3 mb-8">
              {tx.items.map((item, i) => {
                const Icon = ICONS[i];
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <Icon size={14} />
                    </div>
                    <span className="text-[#A0A0A0] text-sm">{item.text}</span>
                  </li>
                );
              })}
            </ul>
            <a href="#contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-bold hover:bg-[#2BC870] transition-all duration-200">
              {tx.cta}
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </a>
          </div>
          <div className="bg-[#141414] border border-red-900/30 rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/8 to-transparent pointer-events-none" />
            <div className="relative space-y-5">
              {[
                { before: "8 500 BYN/мес", after: "2 100 BYN/мес", label: lang === "ru" ? "топливо/зарядка" : "паліва/зарадка", saving: "−75%" },
                { before: "1 200 BYN/мес", after: "0 BYN", label: lang === "ru" ? "ТО и ремонты" : "ТА і рамонты", saving: "−100%" },
                { before: "10 ч/неделю", after: "0 ч", label: lang === "ru" ? "ваше время" : "ваш час", saving: lang === "ru" ? "свобода" : "свабода" },
              ].map((row, i) => (
                <div key={i} className="bg-[#0A0A0A] rounded-xl p-4">
                  <div className="text-[#555] text-xs mb-2">{row.label}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-lg font-bold line-through opacity-60">{row.before}</span>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-[#3DDC84] text-lg font-bold">{row.after}</span>
                    <span className="ml-auto bg-[#3DDC84]/10 text-[#3DDC84] text-xs font-bold px-2 py-0.5 rounded-full">{row.saving}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
