import { useEffect, useState, useRef } from "react";
import type { Lang } from "../pages/index";

const CAR_PHOTOS = ["/car2.jpg", "/car.jpg"];

function CarGallery() {
  const [active, setActive] = useState(0);
  return (
    <div className="relative w-full rounded-2xl overflow-hidden group">
      {/* Main photo */}
      <div className="relative aspect-[16/9] bg-[#0F0F0F] overflow-hidden rounded-2xl">
        {CAR_PHOTOS.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Hongqi E-QM5 Plus ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: active === i ? 1 : 0 }}
          />
        ))}
        {/* Gradient overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0D0D0D] to-transparent" />
        {/* Badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-[#3DDC84]/20 rounded-full px-3 py-1">
          <span className="text-[#3DDC84] text-xs font-medium">Hongqi E-QM5+</span>
        </div>
      </div>
      {/* Thumbnails */}
      <div className="flex gap-2 mt-3">
        {CAR_PHOTOS.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="relative flex-1 aspect-[16/9] rounded-xl overflow-hidden border-2 transition-all duration-200"
            style={{ borderColor: active === i ? "#3DDC84" : "#2A2A2A" }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            {active !== i && <div className="absolute inset-0 bg-black/40" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// Battery capacity kWh, DC fast charge power kW, max charge target %
const BATTERY_KWH = 72.9;
const CHARGE_KW = 120; // DC fast charging
const MAX_CHARGE = 80;
const MAX_KM = Math.round(610 * MAX_CHARGE / 100); // 488 km at 80%
// Time to charge 0→80% at 120 kW: 72.9 * 0.8 / 120 * 60 = ~29 min
const TOTAL_MINS = Math.round(BATTERY_KWH * MAX_CHARGE / 100 / CHARGE_KW * 60);

function ChargingWidget({ lang }: { lang: Lang }) {
  const [charge, setCharge] = useState(0);
  const [km, setKm] = useState(0);
  const [charging, setCharging] = useState(false);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 4000;

  const labels = {
    ru: { title: "Быстрая зарядка", btn: "Запустить зарядку", charging: "Зарядка...", done: "Заряжено до 80%", range: "запас хода", time: "времени", power: "Мощность зарядки" },
    by: { title: "Хуткая зарадка", btn: "Запусціць зарадку", charging: "Зарадка...", done: "Зараджана да 80%", range: "запас ходу", time: "часу", power: "Магутнасць зарадкі" },
  };
  const l = labels[lang];

  const start = () => {
    if (charging) return;
    setCharge(0); setKm(0); setDone(false); setCharging(true);
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setCharge(Math.round(eased * MAX_CHARGE));
      setKm(Math.round(eased * MAX_KM));
      if (progress < 1) { rafRef.current = requestAnimationFrame(animate); }
      else { setCharging(false); setDone(true); }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const t = setTimeout(start, 600);
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const color = charge < 20 ? "#EF4444" : charge < 50 ? "#F59E0B" : "#3DDC84";
  const segments = 10;
  // Elapsed charge time in minutes: (charge/80) * TOTAL_MINS
  const elapsedMins = charge < 5 ? "—" : String(Math.round(charge / MAX_CHARGE * TOTAL_MINS));

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 rounded-3xl blur-2xl transition-opacity duration-500"
        style={{ background: `${color}18`, opacity: charging || done ? 1 : 0.3 }} />
      <div className="relative bg-[#141414] border border-[#2A2A2A] rounded-3xl p-7 space-y-6"
        style={{ boxShadow: charging ? `0 0 40px ${color}18` : "none", transition: "box-shadow 0.5s" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-base">{l.title}</div>
            <div className="text-[#555] text-xs mt-0.5">Hongqi E-QM5 Plus</div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            charging || done ? "bg-[#3DDC84]/15 text-[#3DDC84]" : "bg-[#1A1A1A] text-[#555]"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${charging ? "animate-pulse bg-[#3DDC84]" : done ? "bg-[#3DDC84]" : "bg-[#555]"}`} />
            {charging ? l.charging : done ? l.done : "—"}
          </div>
        </div>

        {/* Battery */}
        <div className="flex items-center">
          <div className="flex-1 h-12 rounded-xl border-2 relative overflow-hidden"
            style={{ borderColor: color, transition: "border-color 0.3s" }}>
            {/* Fill on 0–100% scale — at 80% charge the bar is 80% full, not 100% */}
            <div className="absolute left-0 top-0 bottom-0 rounded-lg transition-all duration-100"
              style={{ width: `${charge}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
            <div className="absolute inset-0 flex">
              {Array.from({ length: segments - 1 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-[#0A0A0A]/40" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-xl drop-shadow-lg"
                style={{ textShadow: "0 0 8px rgba(0,0,0,0.8)" }}>{charge}%</span>
            </div>
          </div>
          <div className="w-3 h-6 rounded-r ml-0.5" style={{ background: color, transition: "background 0.3s" }} />
        </div>

        {/* Icon */}
        <div className="flex justify-center h-6">
          {charging && (
            <div className="animate-bounce">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#3DDC84" opacity="0.9"/>
              </svg>
            </div>
          )}
          {done && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#3DDC84" strokeWidth="1.5"/>
              <path d="M8 12l3 3 5-5" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: `${km}`, unit: "км", label: l.range },
            { val: elapsedMins, unit: elapsedMins === "—" ? "" : "мин", label: l.time },
            { val: `${CHARGE_KW}`, unit: "кВт", label: l.power },
          ].map((s, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl p-3 text-center">
              <div className="font-bold text-lg" style={{ color }}>
                {s.val}<span className="text-xs ml-0.5 text-[#666]">{s.unit}</span>
              </div>
              <div className="text-[#555] text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar + button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-100"
              style={{ width: `${charge}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }} />
          </div>
          <button onClick={start} disabled={charging}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-200 disabled:opacity-40"
            style={{ borderColor: color, color }}>
            {charging ? "..." : l.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

const t = {
  ru: {
    tag: "Автомобиль",
    h2: "Популярная модель: Hongqi E-QM5 Plus",
    sub: "Почему клиенты выбирают эту модель:",
    specs: [
      { label: "Запас хода", value: "610 км" },
      { label: "Мощность", value: "140 кВт" },
      { label: "Класс", value: "Бизнес" },
      { label: "Категория", value: "B" },
    ],
    features: [
      "Запас хода 610 км — хватает на полную смену такси или доставку по городу и области",
      "Заряд автомобиля в 3–4 раза дешевле — 2 100 BYN/мес против 8 500 BYN на бензин",
      "Быстрая зарядка до 80% за ~5 ч от AC 12 кВт или за 30 мин от DC 120 кВт",
      "Комфортный салон — водители довольны, текучка снижается",
    ],
    cta: "Узнать, подойдёт ли эта модель моему парку",
    usage: "Доступен без водителя",
  },
  by: {
    tag: "Аўтамабіль",
    h2: "Папулярная мадэль: Hongqi E-QM5 Plus",
    sub: "Чаму кліенты выбіраюць гэту мадэль:",
    specs: [
      { label: "Запас ходу", value: "610 км" },
      { label: "Магутнасць", value: "140 кВт" },
      { label: "Клас", value: "Бізнес" },
      { label: "Катэгорыя", value: "B" },
    ],
    features: [
      "Запас ходу 610 км — хапае на поўную змену таксі або дастаўку па горадзе і вобласці",
      "Зарад аўтамабіля ў 3–4 разы танней — 2 100 BYN/мес супраць 8 500 BYN на бензін",
      "Хуткая зарадка да 80% за ~5 г ад AC 12 кВт або за 30 хвілін ад DC 120 кВт",
      "Камфортны салон — вадзіцелі задаволены, цякучка зніжаецца",
    ],
    cta: "Даведацца, ці падыдзе гэта мадэль майму парку",
    usage: "Даступны без кіроўцы",
  },
};

interface Props {
  lang: Lang;
}

export default function Car({ lang }: Props) {
  const tx = t[lang];
  return (
    <section id="car" className="py-24 bg-[#0D0D0D]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: info */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-3">{tx.h2}</h2>
            <p className="text-[#A0A0A0] text-lg mb-8">{tx.sub}</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {tx.specs.map((spec, i) => (
                <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
                  <div className="text-[#666] text-xs mb-1">{spec.label}</div>
                  <div className="text-white font-bold text-xl">{spec.value}</div>
                </div>
              ))}
            </div>

            <ul className="space-y-3 mb-8">
              {tx.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[#A0A0A0] text-sm">
                  <svg className="shrink-0 mt-0.5" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#3DDC84" strokeWidth="1.5"/>
                    <path d="M8 12l3 3 5-5" stroke="#3DDC84" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <a href="#contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3DDC84] text-[#0A0A0A] font-semibold hover:bg-[#2BC870] transition-all duration-200">
                {tx.cta}
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </a>
              <span className="text-[#666] text-sm">{tx.usage}</span>
            </div>
          </div>

          {/* Right: photo gallery + charging animation */}
          <div className="flex flex-col gap-6">
            <CarGallery />
            <ChargingWidget lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}
