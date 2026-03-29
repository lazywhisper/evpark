import { Zap, BarChart2, Rocket, ClipboardList, TrendingUp, Handshake } from "lucide-react";
import type { Lang } from "../pages/index";

const ICONS = [Zap, BarChart2, Rocket, ClipboardList, TrendingUp, Handshake];

const t = {
  ru: {
    tag: "Почему мы",
    h2: "Почему клиенты выбирают EVPark, а не покупают свои авто",
    note: "Мы не просто сдаём машины — мы оптимизируем ваш автопарк",
    items: [
      { title: "Специализация на электромобилях", text: "Мы не распыляемся на ДВС и гибриды. Мы сфокусированы исключительно на электромобилях — и знаем этот рынок на уровне операционной эффективности." },
      { title: "Понимание экономики бизнеса", text: "Считаем не «цену аренды», а ваш полный Cost Per Kilometer. Оптимизируем под вашу маржинальность." },
      { title: "Быстрый запуск", text: "От подписания договора до первого автомобиля — 48 часов. Конкуренты — недели." },
      { title: "Прозрачные условия", text: "Фиксированный платёж. Никаких «допов» за ТО, сезонную замену резины или внезапные ремонты." },
      { title: "Масштабируемость без переговоров", text: "Начали с 2 авто, через полгода нужно 20? Дополнительный договор не требуется." },
      { title: "Заинтересованы в вашем успехе", text: "Не сдаём авто «в нагрузку». Если вы не зарабатываете — мы тоже. Подбираем решения под вашу экономику." },
    ],
    cta: "Стать партнёром",
  },
  by: {
    tag: "Чаму мы",
    h2: "Чаму кліенты выбіраюць EVPark, а не купляюць свае аўто",
    note: "Мы не проста здаём машыны — мы аптымізуем ваш аўтапарк",
    items: [
      { title: "Спецыялізацыя на электрамабілях", text: "Мы не распыляемся на ДВЗ і гібрыды. Мы сканцэнтраваны выключна на электрамабілях — і ведаем гэты рынак на ўзроўні аперацыйнай эфектыўнасці." },
      { title: "Разуменне эканомікі бізнесу", text: "Лічым не «цану арэнды», а ваш поўны Cost Per Kilometer. Аптымізуем пад вашу маржынальнасць." },
      { title: "Хуткі запуск", text: "Ад подпісу дагавора да першага аўтамабіля — 48 гадзін. Канкурэнты — тыдні." },
      { title: "Празрыстыя ўмовы", text: "Фіксаваны плацёж. Ніякіх «дапоў» за ТА, сезонную замену рэзіны ці раптоўныя рамонты." },
      { title: "Маштабаванасць без перамоваў", text: "Пачалі з 2 аўто, праз паўгода трэба 20? Дадатковы дагавор не патрэбен." },
      { title: "Зацікаўлены ў вашым поспеху", text: "Не здаём аўто «ў нагрузку». Калі вы не зарабляеце — мы таксама. Падбіраем рашэнні пад вашу эканоміку." },
    ],
    cta: "Стаць партнёрам",
  },
};

interface Props { lang: Lang; }

export default function WhyUs({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="whyus" className="py-24 bg-[#0D1810]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-3">
          <h2 className="text-4xl md:text-5xl font-bold max-w-2xl">{tx.h2}</h2>
          <a href="#contact" className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-bold hover:bg-[#2BC870] transition-all duration-200">{tx.cta}</a>
        </div>
        <p className="text-[#3DDC84] text-sm font-medium mb-12">{tx.note}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tx.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#3DDC84]/30 transition-all duration-300 group">
                <div className="mb-4 w-12 h-12 rounded-xl bg-[#3DDC84]/10 border border-[#3DDC84]/20 flex items-center justify-center text-[#3DDC84]"><Icon size={22} /></div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-[#3DDC84] transition-colors">{item.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
