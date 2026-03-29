import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "О сервисе",
    h2: "Электромобиль как услуга, а не источник новых забот",
    lead: "Наш сервис позволяет запустить автопарк без крупных капитальных затрат, сохранить оборотные средства и перевести транспорт в понятный ежемесячный расход.",
    items: [
      {
        icon: "bolt",
        title: "Готовое решение под ключ",
        text: "Автомобиль + зарядная инфраструктура + сценарий эксплуатации. Всё настроено под ваши бизнес-процессы.",
      },
      {
        icon: "wallet",
        title: "Прозрачная экономика",
        text: "Вы платите не за владение машиной, а за готовый рабочий инструмент без амортизации, ремонта и продажи.",
      },
      {
        icon: "refresh",
        title: "Мы берём всё на себя",
        text: "Обслуживание, поддержка, оперативная замена или подменный автомобиль. Вы не остаётесь один на один с техникой.",
      },
      {
        icon: "building",
        title: "Имидж работодателя",
        text: "Электропарк — это не только про транспорт, но и про бренд работодателя и корпоративный имидж.",
      },
    ],
  },
  by: {
    tag: "Пра сэрвіс",
    h2: "Электрамабіль як паслуга, а не крыніца новых клопатаў",
    lead: "Наш сэрвіс дазваляе запусціць аўтапарк без буйных капітальных выдаткаў, захаваць абаротныя сродкі і перавесці транспарт у зразумелы штомесячны расход.",
    items: [
      {
        icon: "bolt",
        title: "Гатовае рашэнне пад ключ",
        text: "Аўтамабіль + зарадная інфраструктура + сцэнарый эксплуатацыі. Усё наладжана пад вашы бізнес-працэсы.",
      },
      {
        icon: "wallet",
        title: "Празрыстая эканоміка",
        text: "Вы плаціце не за валоданне машынай, а за гатовы рабочы інструмент без амартызацыі, рамонту і продажу.",
      },
      {
        icon: "refresh",
        title: "Мы бяром усё на сябе",
        text: "Абслугоўванне, падтрымка, аператыўная замена або падменны аўтамабіль. Вы не застаяцеся адзін на адзін з тэхнікай.",
      },
      {
        icon: "building",
        title: "Імідж працадаўцы",
        text: "Электрапарк — гэта не толькі пра транспарт, але і пра брэнд працадаўцы і карпаратыўны імідж.",
      },
    ],
  },
};

function Icon({ name }: { name: string }) {
  if (name === "bolt") return (
    <svg width="20" height="20" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (name === "wallet") return (
    <svg width="20" height="20" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M16 12h2" strokeLinecap="round"/>
      <path d="M2 10h20" strokeLinecap="round"/>
    </svg>
  );
  if (name === "refresh") return (
    <svg width="20" height="20" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="20" height="20" fill="none" stroke="#3DDC84" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 21h18M3 7v14M21 7v14M6 21V11M9 21v-6M12 21v-4M15 21v-7M18 21V11M3 7l9-4 9 4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface Props {
  lang: Lang;
}

export default function About({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="about" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            {tx.h2}
          </h2>
          <p className="text-[#A0A0A0] text-lg leading-relaxed pt-2">
            {tx.lead}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tx.items.map((item, i) => (
            <div
              key={i}
              className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#3DDC84]/30 transition-all duration-300 hover:bg-[#161616] group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#3DDC84]/10 flex items-center justify-center mb-4 group-hover:bg-[#3DDC84]/15 transition-colors">
                <Icon name={item.icon} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2 group-hover:text-[#3DDC84] transition-colors">
                {item.title}
              </h3>
              <p className="text-[#666] text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
