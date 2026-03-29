import type { Lang } from "../pages/index";

const t = {
  ru: {
    desc: "Интеграция электромобилей в бизнес",
    nav: "Навигация",
    links: [
      { label: "О сервисе", href: "#solution" },
      { label: "Экономика", href: "#economics" },
      { label: "Как работает", href: "#how" },
      { label: "Отрасли", href: "#industries" },
      { label: "Автомобиль", href: "#car" },
      { label: "Контакты", href: "#contact" },
    ],
    contacts: "Контакты",
    requisites: "Реквизиты",
    copy: "© 2026 EVPark.by. Все права защищены.",
  },
  by: {
    desc: "Інтэграцыя электрамабіляў у бізнес",
    nav: "Навігацыя",
    links: [
      { label: "Пра сэрвіс", href: "#solution" },
      { label: "Эканоміка", href: "#economics" },
      { label: "Як працуе", href: "#how" },
      { label: "Галіны", href: "#industries" },
      { label: "Аўтамабіль", href: "#car" },
      { label: "Кантакты", href: "#contact" },
    ],
    contacts: "Кантакты",
    requisites: "Рэквізіты",
    copy: "© 2026 EVPark.by. Усе правы абаронены.",
  },
};

interface Props { lang: Lang; }

export default function Footer({ lang }: Props) {
  const tx = t[lang];
  return (
    <footer className="bg-[#0D0D0D] border-t border-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4">
              <img src="/evpark.svg" alt="EVPark" className="h-8 w-auto" />
            </div>
            <p className="text-[#666] text-sm leading-relaxed">{tx.desc}</p>
            <div className="flex gap-3 mt-4">
              <a href="https://t.me/evparkby" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center hover:border-[#3DDC84]/40 transition-colors">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M22 2L11 13" stroke="#A0A0A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="#A0A0A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="https://wa.me/375291530000" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center hover:border-[#3DDC84]/40 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#A0A0A0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{tx.nav}</h4>
            <ul className="space-y-2">
              {tx.links.map((l, i) => (
                <li key={i}>
                  <a href={l.href} className="text-[#666] text-sm hover:text-[#3DDC84] transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{tx.contacts}</h4>
            <div className="space-y-2">
              <a href="mailto:rent@evcar.by" className="text-[#666] text-sm hover:text-[#3DDC84] transition-colors block">rent@evcar.by</a>
              <a href="tel:+375291530000" className="text-[#666] text-sm hover:text-[#3DDC84] transition-colors block">+375 29 153 00 00</a>
              <a href="https://t.me/evparkby" target="_blank" rel="noopener noreferrer" className="text-[#666] text-sm hover:text-[#3DDC84] transition-colors block">Telegram: @evparkby</a>
              <a href="https://wa.me/375291530000" target="_blank" rel="noopener noreferrer" className="text-[#666] text-sm hover:text-[#3DDC84] transition-colors block">WhatsApp</a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{tx.requisites}</h4>
            <div className="space-y-1.5">
              <p className="text-white text-sm font-medium">ООО «АЛЬТАИРАВТО»</p>
              <p className="text-[#555] text-xs leading-relaxed mt-2">220068 РБ, г. Минск,<br/>ул. Лили Крастояновой, д. 32, пом. 23</p>
              <p className="text-[#555] text-xs mt-2">УНП: <span className="text-[#666]">193726076</span></p>
              <p className="text-[#555] text-xs">Карт-счёт:<br/><span className="text-[#666] break-all">BY80ALFA30122E42910010270000</span><br/>в BYN в ЗАО «Альфа-Банк»<br/>БИК: <span className="text-[#666]">ALFABY2X</span></p>
              <p className="text-[#555] text-xs mt-2">Директор: <span className="text-[#666]">Говорушко Анна Леонидовна</span><br/><span className="text-[#444]">(на основании Устава)</span></p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#555] text-xs">{tx.copy}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3DDC84] animate-pulse" />
            <span className="text-[#555] text-xs">evcar.by</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
