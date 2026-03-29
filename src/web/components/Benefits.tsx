import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "Преимущества",
    h2: "Другая экономика. Другой уровень управления.",
    items: [
      {
        num: "01",
        title: "Экономия на топливе",
        text: "Зарядка электромобиля обходится значительно дешевле топлива. Снижение затрат на эксплуатацию автопарка до 75%.",
      },
      {
        num: "02",
        title: "Меньше зависимости от топлива",
        text: "Независимость от роста цен на бензин и дизель. Предсказуемые ежемесячные расходы.",
      },
      {
        num: "03",
        title: "Зарядная инфраструктура",
        text: "Возможность внедрения зарядных станций на вашей территории. Полная поддержка на всех этапах.",
      },
      {
        num: "04",
        title: "Современная модель управления",
        text: "Цифровой контроль автопарка, телематика, отчётность — всё в одном месте.",
      },
      {
        num: "05",
        title: "Экологичность",
        text: "Нулевые выбросы CO₂. Соответствие ESG-повестке и экологическим стандартам.",
      },
      {
        num: "06",
        title: "Корпоративный имидж",
        text: "Электрический автопарк повышает привлекательность компании как работодателя и укрепляет бренд.",
      },
    ],
  },
  by: {
    tag: "Перавагі",
    h2: "Іншая эканоміка. Іншы ўзровень кіравання.",
    items: [
      {
        num: "01",
        title: "Эканомія на паліве",
        text: "Зарадка электрамабіля абыходзіцца значна танней паліва. Зніжэнне выдаткаў на эксплуатацыю аўтапарка да 75%.",
      },
      {
        num: "02",
        title: "Менш залежнасці ад паліва",
        text: "Незалежнасць ад росту цэн на бензін і дызель. Прадказальныя штомесячныя расходы.",
      },
      {
        num: "03",
        title: "Зарадная інфраструктура",
        text: "Магчымасць укаранення зарадных станцый на вашай тэрыторыі. Поўная падтрымка на ўсіх этапах.",
      },
      {
        num: "04",
        title: "Сучасная мадэль кіравання",
        text: "Лічбавы кантроль аўтапарка, тэлематыка, справаздачнасць — усё ў адным месцы.",
      },
      {
        num: "05",
        title: "Экалагічнасць",
        text: "Нулявыя выкіды CO₂. Адпаведнасць ESG-парадку і экалагічным стандартам.",
      },
      {
        num: "06",
        title: "Карпаратыўны імідж",
        text: "Электрычны аўтапарк павышае прывабнасць кампаніі як працадаўцы і ўмацоўвае брэнд.",
      },
    ],
  },
};

interface Props {
  lang: Lang;
}

export default function Benefits({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="benefits" className="py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Accent line */}
      <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-[#3DDC84]/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-16 max-w-xl">
          {tx.h2}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2A2A2A]">
          {tx.items.map((item, i) => (
            <div
              key={i}
              className="bg-[#0A0A0A] p-8 hover:bg-[#141414] transition-colors duration-300 group"
            >
              <div className="text-[#3DDC84]/30 text-5xl font-bold mb-4 group-hover:text-[#3DDC84]/50 transition-colors">
                {item.num}
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{item.title}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
