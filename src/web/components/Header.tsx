import { useState } from "react";
import type { Lang } from "../pages/index";

const t = {
  ru: {
    nav: ["О сервисе", "Экономика", "Как работает", "Автомобиль", "Контакты"],
    cta: "Получить расчёт",
  },
  by: {
    nav: ["Пра сэрвіс", "Эканоміка", "Як працуе", "Аўтамабіль", "Кантакты"],
    cta: "Атрымаць разлік",
  },
};

const anchors = ["solution", "economics", "how", "car", "contact"];

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export default function Header({ lang, setLang }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <img src="/evpark.svg" alt="EVPark" className="h-8 w-auto" />
        </a>

        <nav className="hidden lg:flex items-center gap-6">
          {t[lang].nav.map((item, i) => (
            <a key={i} href={`#${anchors[i]}`}
              className="text-sm text-[#A0A0A0] hover:text-white transition-colors duration-200 whitespace-nowrap">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#1A1A1A] rounded-full p-0.5 border border-[#2A2A2A]">
            <button onClick={() => setLang("ru")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${lang === "ru" ? "bg-[#3DDC84] text-[#0A0A0A]" : "text-[#A0A0A0] hover:text-white"}`}>
              RU
            </button>
            <button onClick={() => setLang("by")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${lang === "by" ? "bg-[#3DDC84] text-[#0A0A0A]" : "text-[#A0A0A0] hover:text-white"}`}>
              BY
            </button>
          </div>

          <a href="tel:+375291530000"
            className="hidden xl:flex items-center gap-2 text-white hover:text-[#3DDC84] transition-colors duration-200 group">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center group-hover:border-[#3DDC84]/40 transition-colors">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-medium">+375 29 153 00 00</span>
          </a>

          <a href="#contact"
            className="hidden lg:inline-flex items-center px-5 py-2 rounded-full bg-[#3DDC84] text-[#0A0A0A] text-sm font-bold hover:bg-[#2BC870] transition-colors duration-200 whitespace-nowrap">
            {t[lang].cta}
          </a>

          <button className="lg:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (<><line x1="4" y1="4" x2="18" y2="18"/><line x1="18" y1="4" x2="4" y2="18"/></>) : (<><line x1="3" y1="7" x2="19" y2="7"/><line x1="3" y1="12" x2="19" y2="12"/><line x1="3" y1="17" x2="19" y2="17"/></>)}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-[#0F0F0F] border-t border-[#2A2A2A] px-6 py-4 flex flex-col gap-4">
          {t[lang].nav.map((item, i) => (
            <a key={i} href={`#${anchors[i]}`} onClick={() => setMenuOpen(false)}
              className="text-sm text-[#A0A0A0] hover:text-white py-1">{item}</a>
          ))}
          <a href="#contact" onClick={() => setMenuOpen(false)}
            className="inline-flex justify-center items-center px-5 py-2.5 rounded-full bg-[#3DDC84] text-[#0A0A0A] text-sm font-bold">
            {t[lang].cta}
          </a>
        </div>
      )}
    </header>
  );
}
