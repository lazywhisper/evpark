import { Car, Package, Building2, Truck } from "lucide-react";
import type { Lang } from "../pages/index";

const ICONS = [Car, Package, Building2, Truck];

const t = {
  ru: {
    tag: "Кому подходит",
    h2: "Кому подходит аренда электромобилей",
    items: [
      { title: "Таксопарки", text: "Снижайте себестоимость поездки на 40% за счёт дешёвой зарядки вместо бензина. Запас хода 610 км хватает на смену." },
      { title: "Службы доставки", text: "Предсказуемые затраты на транспорт = точная маржинальность каждой доставки. Масштабируйтесь без рисков." },
      { title: "Корпоративные автопарки", text: "ESG-отчётность без инвестиций, имидж современного работодателя и реальная экономия в одном решении." },
      { title: "Логистические компании", text: "Масштабируйте парк от 1 до 100 авто без капитальных вложений. Платите только за использование." },
    ],
    cta: "Получить решение для моей отрасли",
  },
  by: {
    tag: "Каму падыходзіць",
    h2: "Каму падыходзіць арэнда электрамабіляў",
    items: [
      { title: "Таксапаркі", text: "Зніжайце сабекошт паездкі на 40% за кошт танных зарадак замест бензіну. Запас ходу 610 км хапае на змену." },
      { title: "Службы дастаўкі", text: "Прадказальныя выдаткі на транспарт = дакладная маржынальнасць кожнай дастаўкі. Маштабуйцеся без рызык." },
      { title: "Карпаратыўныя аўтапаркі", text: "ESG-справаздачнасць без інвестыцый, імідж сучаснага працадаўцы і рэальная эканомія ў адным рашэнні." },
      { title: "Лагістычныя кампаніі", text: "Маштабуйце парк ад 1 да 100 аўто без капітальных укладанняў. Плаціце толькі за выкарыстанне." },
    ],
    cta: "Атрымаць рашэнне для маёй галіны",
  },
};

interface Props { lang: Lang; }

export default function Industries({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="industries" className="py-24 bg-[#0D1810]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">{tx.h2}</h2>
          <a href="#contact" className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#3DDC84]/40 text-[#3DDC84] font-semibold hover:bg-[#3DDC84]/10 transition-all duration-200 text-sm">
            {tx.cta}
          </a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tx.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#3DDC84]/30 transition-all duration-300 group">
                <div className="mb-4 text-[#3DDC84]"><Icon size={32} /></div>
                <h3 className="text-white font-semibold mb-3 group-hover:text-[#3DDC84] transition-colors">{item.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
