import { Car, Shield, Wrench, RefreshCw, UserCheck } from "lucide-react";
import type { Lang } from "../pages/index";

const ICONS = [Car, Shield, Wrench, RefreshCw, UserCheck];

const t = {
  ru: {
    tag: "Решение",
    h2: "Corporate Mobility Service: электромобиль под ключ для вашего бизнеса",
    lead: "Платите только за использование. Всё остальное — на нас.",
    items: [
      { title: "Подбор авто под задачи", text: "Подбираем модели под ваши маршруты и нагрузку. Не навязываем то, что не нужно." },
      { title: "Страхование КАСКО", text: "Полное покрытие без франшизы. ДТП не ударит по вашему бюджету." },
      { title: "Техническое обслуживание", text: "Плановое ТО и внеплановые ремонты за наш счёт. Без вашего участия." },
      { title: "Замена автомобиля", text: "Поломка? Подменный авто доставим за 4 часа. Простой минимальный." },
      { title: "Сопровождение водителей", text: "24/7 поддержка ваших водителей. Они обращаются к нам, не к вам." },
    ],
    result: "Вы платите фиксированную сумму — без скрытых расходов",
    cta: "Узнать стоимость для моего парка",
  },
  by: {
    tag: "Рашэнне",
    h2: "Corporate Mobility Service: электрамабіль пад ключ для вашага бізнесу",
    lead: "Плаціце толькі за выкарыстанне. Усё астатняе — на нас.",
    items: [
      { title: "Падбор аўто пад задачы", text: "Падбіраем мадэлі пад вашы маршруты і нагрузку. Не навязваем тое, што не патрэбна." },
      { title: "Страхаванне КАСКА", text: "Поўнае пакрыццё без франшызы. ДТЗ не ўдарыць па вашым бюджэце." },
      { title: "Тэхнічнае абслугоўванне", text: "Планавае ТА і пазапланавыя рамонты за наш кошт. Без вашага ўдзелу." },
      { title: "Замена аўтамабіля", text: "Паломка? Падменны аўто даставім за 4 гадзіны. Прастой мінімальны." },
      { title: "Суправаджэнне вадзіцеляў", text: "24/7 падтрымка вашых вадзіцеляў. Яны звяртаюцца да нас, не да вас." },
    ],
    result: "Вы плаціце фіксаваную суму — без схаваных расходаў",
    cta: "Даведацца кошт для майго парка",
  },
};

interface Props { lang: Lang; }

export default function Solution({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="solution" className="py-24 bg-[#0D1810]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-3 max-w-3xl">{tx.h2}</h2>
        <p className="text-[#3DDC84] text-lg font-medium mb-12">{tx.lead}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {tx.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={i} className={`bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#3DDC84]/30 transition-all duration-300 group ${i === 4 ? "md:col-span-2 lg:col-span-1" : ""}`}>
                <div className="mb-4 w-12 h-12 rounded-xl bg-[#3DDC84]/10 border border-[#3DDC84]/20 flex items-center justify-center text-[#3DDC84]"><Icon size={22} /></div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-[#3DDC84] transition-colors">{item.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-[#141414] border border-[#3DDC84]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3DDC84]/10 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#3DDC84" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="text-white font-bold text-lg">{tx.result}</span>
          </div>
          <a href="#contact"
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-bold hover:bg-[#2BC870] transition-all duration-200">
            {tx.cta}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
