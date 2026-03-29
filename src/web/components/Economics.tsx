import { useState } from "react";
import { Calculator } from "lucide-react";
import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "Цифры",
    h2: "До −75% на топливе. Фиксированный платёж — без сюрпризов.",
    sub: "Для таксопарков и логистических компаний, которые хотят предсказуемые расходы и ноль операционных головной боли.",
    stats: [
      { val: "−75%", label: "экономия на топливе" },
      { val: "30 мин", label: "быстрая зарядка до 80%" },
      { val: "2", label: "города присутствия" },
      { val: "48 ч", label: "запуск парка" },
    ],
    calcTitle: "Сколько вы сможете сэкономить?",
    cars: "Количество автомобилей",
    fuel: "Топливо (BYN/авто в месяц)",
    maint: "ТО и ремонт (BYN/авто в месяц)",
    result: "Экономия в месяц:",
    year: "В год:",
    cta: "Получить точный расчёт за 10 минут",
    cta2: "Запросить коммерческое предложение",
    disclaimer: "Ориентировочный расчёт. Точные цифры — после анализа вашего парка.",
  },
  by: {
    tag: "Лічбы",
    h2: "Да −75% на паліве. Фіксаваны плацёж — без сюрпрызаў.",
    sub: "Для таксапаркаў і лагістычных кампаній, якія хочуць прадказальныя расходы і нуль аперацыйнага галаўнога болю.",
    stats: [
      { val: "−75%", label: "эканомія на паліве" },
      { val: "30 мін", label: "хуткая зарадка да 80%" },
      { val: "2", label: "гарады прысутнасці" },
      { val: "48 г", label: "запуск парка" },
    ],
    calcTitle: "Колькі вы зможаце зэканоміць?",
    cars: "Колькасць аўтамабіляў",
    fuel: "Паліва (BYN/аўто ў месяц)",
    maint: "ТА і рамонт (BYN/аўто ў месяц)",
    result: "Эканомія ў месяц:",
    year: "У год:",
    cta: "Атрымаць дакладны разлік за 10 хвілін",
    cta2: "Запытаць камерцыйную прапанову",
    disclaimer: "Арыенціровачны разлік. Дакладныя лічбы — пасля аналізу вашага парка.",
  },
};

interface Props { lang: Lang; }

export default function Economics({ lang }: Props) {
  const tx = t[lang];
  const [cars, setCars] = useState(10);
  const [fuel, setFuel] = useState(500);
  const [maint, setMaint] = useState(300);
  // fuel * 0.75 — экономия на топливе (зарядка в 4x дешевле бензина)
  // maint — полная экономия на ТО и ремонтах (включены в тариф)
  const saving = Math.round((fuel * 0.75 + maint) * cars);

  return (
    <section id="calculator" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-3 max-w-3xl">{tx.h2}</h2>
        <p className="text-[#A0A0A0] text-lg mb-12">{tx.sub}</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {tx.stats.map((s, i) => (
            <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 text-center hover:border-[#3DDC84]/30 transition-all duration-300">
              <div className="text-4xl font-bold text-[#3DDC84] mb-2">{s.val}</div>
              <div className="text-[#666] text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Calculator */}
        <div id="economics" className="bg-[#141414] border border-[#3DDC84]/20 rounded-3xl p-8 md:p-10">
          <h3 className="text-white font-bold text-2xl mb-8 flex items-center gap-2">
            <Calculator size={22} className="text-[#3DDC84]" />
            {tx.calcTitle}
          </h3>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {[
              { label: tx.cars, val: cars, set: setCars, min: 1, max: 100, step: 1, unit: lang === "ru" ? "авто" : "аўто" },
              { label: tx.fuel, val: fuel, set: setFuel, min: 100, max: 2000, step: 50, unit: "Br" },
              { label: tx.maint, val: maint, set: setMaint, min: 0, max: 1000, step: 25, unit: "Br" },
            ].map((item, i) => (
              <div key={i}>
                <label className="text-[#A0A0A0] text-sm mb-3 block">{item.label}</label>
                <div className="text-[#3DDC84] font-bold text-3xl mb-3">{item.val} <span className="text-sm font-normal text-[#666]">{item.unit}</span></div>
                <input type="range" min={item.min} max={item.max} step={item.step} value={item.val}
                  onChange={e => item.set(Number(e.target.value))}
                  className="w-full accent-[#3DDC84] cursor-pointer" />
                <div className="flex justify-between text-[#444] text-xs mt-1"><span>{item.min}</span><span>{item.max}</span></div>
              </div>
            ))}
          </div>
          <div className="bg-[#0A0A0A] border border-[#3DDC84]/20 rounded-2xl p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div>
                <div className="text-[#A0A0A0] text-sm mb-1">{tx.result}</div>
                <div className="text-5xl font-bold text-[#3DDC84]">{saving.toLocaleString()} <span className="text-2xl">BYN</span></div>
              </div>
              <div>
                <div className="text-[#A0A0A0] text-sm mb-1">{tx.year}</div>
                <div className="text-3xl font-bold text-white">{(saving * 12).toLocaleString()} <span className="text-lg text-[#666]">BYN</span></div>
                <div className="text-[#555] text-xs mt-2">{tx.disclaimer}</div>
              </div>
              <div className="flex flex-col gap-3">
                <a href="#contact" className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#3DDC84] text-[#0A0A0A] font-bold text-sm hover:bg-[#2BC870] transition-all duration-200">{tx.cta}</a>
                <a href="#contact" className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#3DDC84]/30 text-[#3DDC84] font-semibold text-sm hover:bg-[#3DDC84]/10 transition-all duration-200">{tx.cta2}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
