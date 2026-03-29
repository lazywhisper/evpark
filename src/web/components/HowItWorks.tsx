import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "Как это работает",
    h2: "От заявки до первого автомобиля — 48 часов",
    note: "Без бюрократии, без согласований в 5 инстанций, без скрытых платежей.",
    steps: [
      { num: "01", title: "Оставляете заявку", text: "Отвечаем в течение часа, не тянем." },
      { num: "02", title: "Получаете расчёт экономии", text: "Готов за 10 минут, бесплатно." },
      { num: "03", title: "Утверждаете подбор авто", text: "Под ваши маршруты и бюджет." },
      { num: "04", title: "Получаете готовый парк", text: "Авто + зарядка. Начинаете зарабатывать." },
    ],
    cta: "Оставить заявку",
  },
  by: {
    tag: "Як гэта працуе",
    h2: "Ад заяўкі да першага аўтамабіля — 48 гадзін",
    note: "Без бюракратыі, без узгадненняў у 5 інстанцыях, без схаваных плацяжоў.",
    steps: [
      { num: "01", title: "Пакідаеце заяўку", text: "Адказваем на працягу гадзіны, не цягнем." },
      { num: "02", title: "Атрымліваеце разлік эканоміі", text: "Гатова за 10 хвілін, бясплатна." },
      { num: "03", title: "Зацвярджаеце падбор аўто", text: "Пад вашы маршруты і бюджэт." },
      { num: "04", title: "Атрымліваеце гатовы парк", text: "Аўто + зарадка. Пачынаеце зарабляць." },
    ],
    cta: "Пакінуць заяўку",
  },
};

interface Props { lang: Lang; }

export default function HowItWorks({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="how" className="py-24 bg-[#111111] relative overflow-hidden"><div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-[#3DDC84]/4 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">{tx.h2}</h2>
          <a href="#contact" className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-bold hover:bg-[#2BC870] transition-all duration-200">
            {tx.cta}
          </a>
        </div>
        <p className="text-[#666] mb-12">{tx.note}</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tx.steps.map((step, i) => (
            <div key={i} className="relative bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#3DDC84]/30 transition-all duration-300 group">
              {i < tx.steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2 w-4 h-px bg-[#3DDC84]/30 z-10" />
              )}
              <div className="text-[#3DDC84]/20 text-6xl font-bold mb-4 group-hover:text-[#3DDC84]/40 transition-colors leading-none">{step.num}</div>
              <h3 className="text-white font-semibold text-base mb-2 group-hover:text-[#3DDC84] transition-colors">{step.title}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
