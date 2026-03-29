import { Zap } from "lucide-react";
import type { Lang } from "../pages/index";

const t = {
  ru: {
    h1a: "Забудьте про автопарк.",
    h1b: "Займитесь бизнесом.",
    sub: "Сдаём электромобили под ключ: обслуживание, страховка и подменный авто при поломке. Вы получаете предсказуемые расходы и ноль головной боли.",
    cta: "Рассчитать стоимость для моего парка",
    cta2: "Запросить КП",
    tag1: "Запуск от 48 часов",
    tag2: "Без капитальных вложений",
    tag3: "Ноль головной боли",
    urgency: "Доступно ограниченное количество автомобилей — приоритет у компаний, которые оставят заявку сегодня",
  },
  by: {
    h1a: "Забудзьце пра аўтапарк.",
    h1b: "Займіцеся бізнесам.",
    sub: "Здаём электрамабілі пад ключ: абслугоўванне, страхоўка і падменны аўто пры паломцы. Вы атрымліваеце прадказальныя расходы і нуль галаўнога болю.",
    cta: "Разлічыць кошт для майго парка",
    cta2: "Запытаць КП",
    tag1: "Запуск ад 48 гадзін",
    tag2: "Без капітальных укладанняў",
    tag3: "Нуль галаўнога болю",
    urgency: "Даступна абмежаваная колькасць аўтамабіляў — прыярытэт у кампаній, якія пакінуць заяўку сёння",
  },
};

interface Props { lang: Lang; }

export default function Hero({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background photo */}
      <div className="absolute inset-0">
        <img src="/car2.jpg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0A0A0A]/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-5">
            {tx.h1a}<br/>
            <span className="text-[#3DDC84]">{tx.h1b}</span>
          </h1>

          <p className="text-xl text-[#A0A0A0] leading-relaxed mb-10">{tx.sub}</p>

          <div className="flex flex-wrap gap-3 mb-10">
            {[tx.tag1, tx.tag2, tx.tag3].map((tag, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#141414]/80 backdrop-blur-sm border border-[#2A2A2A] rounded-full px-4 py-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#3DDC84" strokeWidth="1.5"/>
                  <path d="M8 12l3 3 5-5" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-white text-sm font-medium">{tag}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mb-10">
            <a href="#contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-bold text-base hover:bg-[#2BC870] transition-all duration-200 hover:scale-105 shadow-lg shadow-[#3DDC84]/20">
              {tx.cta}
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </a>
            <a href="#contact"
              className="inline-flex items-center px-8 py-4 rounded-full border border-[#2A2A2A] text-[#A0A0A0] font-semibold text-base hover:border-[#3DDC84]/40 hover:text-white transition-all duration-200">
              {tx.cta2}
            </a>
          </div>

          <div className="bg-[#3DDC84]/10 border border-[#3DDC84]/20 rounded-xl px-4 py-3 flex items-center gap-2 backdrop-blur-sm">
            <Zap size={13} className="text-[#3DDC84] shrink-0" />
            <span className="text-[#3DDC84] text-sm font-medium">{tx.urgency}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
