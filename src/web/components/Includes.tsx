import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "Что включено",
    h2: "Всё необходимое уже в стоимости",
    sub: "Никаких скрытых платежей. Полное сопровождение на весь период аренды.",
    items: [
      {
        title: "КАСКО страхование",
        text: "Полная защита автомобиля включена в стоимость аренды без доплат.",
        icon: ShieldIcon,
      },
      {
        title: "Техническое обслуживание",
        text: "Плановые ТО, диагностика и все регламентные работы — наша забота.",
        icon: WrenchIcon,
      },
      {
        title: "Подменный автомобиль",
        text: "Если авто в сервисе — мы сразу предоставим замену, чтобы работа не останавливалась.",
        icon: CarSwitchIcon,
      },
      {
        title: "Зарядная инфраструктура",
        text: "Помогаем организовать зарядную станцию на территории предприятия или подбираем оптимальный сценарий.",
        icon: ChargeIcon,
      },
      {
        title: "Поддержка 24/7",
        text: "Оперативная помощь по любым вопросам — круглосуточно на протяжении всего договора.",
        icon: SupportIcon,
      },
      {
        title: "Гибкие условия",
        text: "Договор адаптируется под нужды вашего предприятия: сроки, пробег, количество авто.",
        icon: FlexIcon,
      },
    ],
  },
  by: {
    tag: "Што ўключана",
    h2: "Усё неабходнае ўжо ў кошце",
    sub: "Ніякіх схаваных плацяжоў. Поўны суправаджэнне на ўвесь перыяд арэнды.",
    items: [
      {
        title: "КАСКА страхаванне",
        text: "Поўная абарона аўтамабіля ўключана ў кошт арэнды без даплат.",
        icon: ShieldIcon,
      },
      {
        title: "Тэхнічнае абслугоўванне",
        text: "Планавыя ТА, дыягностыка і ўсе рэгламентныя работы — наша клопат.",
        icon: WrenchIcon,
      },
      {
        title: "Падменны аўтамабіль",
        text: "Калі авто ў сэрвісе — мы адразу дамо замену, каб праца не спынялася.",
        icon: CarSwitchIcon,
      },
      {
        title: "Зарадная інфраструктура",
        text: "Дапамагаем арганізаваць зарадную станцыю на тэрыторыі прадпрыемства або падбіраем аптымальны сцэнарый.",
        icon: ChargeIcon,
      },
      {
        title: "Падтрымка 24/7",
        text: "Аператыўная дапамога па любых пытаннях — кругласутачна на працягу ўсяго дагавора.",
        icon: SupportIcon,
      },
      {
        title: "Гібкія ўмовы",
        text: "Дагавор адаптуецца пад патрэбы вашага прадпрыемства: тэрміны, прабег, колькасць аўто.",
        icon: FlexIcon,
      },
    ],
  },
};

function ShieldIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 2L4 6v6c0 5 3.58 9.67 8 11 4.42-1.33 8-6 8-11V6l-8-4z"/>
      <path d="M9 12l2 2 4-4" strokeLinecap="round"/>
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CarSwitchIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChargeIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3" strokeLinecap="round"/>
    </svg>
  );
}

function FlexIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface Props {
  lang: Lang;
}

export default function Includes({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="includes" className="py-24 bg-[#0D0D0D]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-end mb-14">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">{tx.h2}</h2>
          <p className="text-[#A0A0A0] text-lg">{tx.sub}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tx.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 flex gap-4 hover:border-[#3DDC84]/30 transition-all duration-300 group"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-[#3DDC84]/10 flex items-center justify-center group-hover:bg-[#3DDC84]/15 transition-colors">
                  <Icon />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-[#666] text-sm leading-relaxed">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
