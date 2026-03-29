import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "Кейсы",
    h2: "Результаты наших клиентов",
    cases: [
      {
        tag: "Таксопарк",
        title: "Кейс: таксопарк",
        task: "Задача: снизить операционные расходы",
        solution: "Решение: переход на аренду электромобилей",
        results: [
          "Снижение затрат на топливо",
          "Отсутствие затрат на обслуживание",
          "Повышение загрузки авто",
        ],
        stat: "−27%",
        statLabel: "затрат за 3 месяца",
        logo: null,
      },
      {
        tag: "Корпоративный автопарк",
        title: "MALANKA",
        task: "Задача: оптимизация корпоративного автопарка",
        solution: "Решение: Corporate Mobility Service",
        results: [
          "20 автомобилей",
          "Снижение затрат на 27%",
          "Запуск за 7 дней",
        ],
        stat: "7 дней",
        statLabel: "от заявки до запуска",
        logo: "/malanka-logo.png",
      },
    ],
    cta: "Получить такой же результат",
  },
  by: {
    tag: "Кейсы",
    h2: "Вынікі нашых кліентаў",
    cases: [
      {
        tag: "Таксапарк",
        title: "Кейс: таксапарк",
        task: "Задача: зніжэнне аперацыйных расходаў",
        solution: "Рашэнне: пераход на арэнду электрамабіляў",
        results: [
          "Зніжэнне выдаткаў на паліва",
          "Адсутнасць выдаткаў на абслугоўванне",
          "Павышэнне загрузкі аўто",
        ],
        stat: "−27%",
        statLabel: "выдаткаў за 3 месяцы",
        logo: null,
      },
      {
        tag: "Карпаратыўны аўтапарк",
        title: "MALANKA",
        task: "Задача: аптымізацыя карпаратыўнага аўтапарка",
        solution: "Рашэнне: Corporate Mobility Service",
        results: [
          "20 аўтамабіляў",
          "Зніжэнне выдаткаў на 27%",
          "Запуск за 7 дзён",
        ],
        stat: "7 дзён",
        statLabel: "ад заяўкі да запуску",
        logo: "/malanka-logo.png",
      },
    ],
    cta: "Атрымаць такі ж вынік",
  },
};

interface Props { lang: Lang; }

export default function Cases({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="cases" className="py-24 bg-[#111111]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <h2 className="text-4xl md:text-5xl font-bold">{tx.h2}</h2>
          <a href="#contact" className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-bold hover:bg-[#2BC870] transition-all duration-200">
            {tx.cta}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </a>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {tx.cases.map((c, i) => (
            <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 hover:border-[#3DDC84]/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="inline-block bg-[#3DDC84]/10 text-[#3DDC84] text-xs font-medium px-3 py-1 rounded-full">{c.tag}</div>
                <div className="text-right">
                  <div className="text-[#3DDC84] font-bold text-2xl">{c.stat}</div>
                  <div className="text-[#555] text-xs">{c.statLabel}</div>
                </div>
              </div>
              {c.logo ? (
                <div className="mb-4">
                  <img src={c.logo} alt={c.title} className="h-10 w-auto object-contain bg-white rounded-lg px-3 py-1" />
                </div>
              ) : (
                <h3 className="text-white font-bold text-xl mb-4">{c.title}</h3>
              )}
              <div className="space-y-1.5 mb-5">
                <p className="text-[#666] text-xs">{c.task}</p>
                <p className="text-[#A0A0A0] text-xs">{c.solution}</p>
              </div>
              <div className="space-y-2 border-t border-[#2A2A2A] pt-4">
                <p className="text-[#666] text-xs uppercase tracking-wider mb-2">{lang === "ru" ? "Результат:" : "Вынік:"}</p>
                {c.results.map((r, j) => (
                  <div key={j} className="flex items-center gap-2 text-white text-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#3DDC84" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
