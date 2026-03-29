import { useState } from "react";
import { Zap } from "lucide-react";
import type { Lang } from "../pages/index";

const t = {
  ru: {
    tag: "Финальный шаг",
    h2: "Узнайте, сколько вы теряете на текущем автопарке",
    sub: "За 10 минут рассчитаем:",
    bullets: [
      "Сколько вы тратите сейчас (скрытые потери включая простои и амортизацию)",
      "Сколько сэкономите с EVPark (точная цифра в BYN/мес)",
      "Оптимальный состав парка под ваши маршруты",
    ],
    urgency: "Приоритет у компаний, которые оставят заявку сегодня",
    name: "Ваше имя",
    company: "Название компании",
    phone: "Телефон",
    fleet: "Количество авто в парке",
    email: "Email",
    message: "Комментарий",
    submit: "Получить бесплатный расчёт",
    submitting: "Отправляем...",
    success: "Заявка отправлена! Свяжемся в течение часа.",
    error: "Ошибка. Напишите напрямую:",
    or: "Или свяжитесь напрямую",
  },
  by: {
    tag: "Фінальны крок",
    h2: "Даведайцеся, колькі вы губляеце на бягучым аўтапарку",
    sub: "За 10 хвілін разлічым:",
    bullets: [
      "Колькі вы тратіце зараз (схаваныя страты ўключаючы прастоі і амартызацыю)",
      "Колькі зэканоміце з EVPark (дакладная лічба ў BYN/мес)",
      "Аптымальны склад парка пад вашы маршруты",
    ],
    urgency: "Прыярытэт у кампаній, якія пакінуць заяўку сёння",
    name: "Ваша імя",
    company: "Назва кампаніі",
    phone: "Тэлефон",
    fleet: "Колькасць аўто ў парку",
    email: "Email",
    message: "Каментарый",
    submit: "Атрымаць бясплатны разлік",
    submitting: "Адпраўляем...",
    success: "Заяўка адпраўлена! Звяжамся на працягу гадзіны.",
    error: "Памылка. Напішыце наўпрост:",
    or: "Або звяжыцеся наўпрост",
  },
};

interface Props { lang: Lang; }

export default function ContactForm({ lang }: Props) {
  const tx = t[lang];
  const [form, setForm] = useState({ name: "", company: "", phone: "", fleet: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setStatus("success"); setForm({ name: "", company: "", phone: "", fleet: "", email: "", message: "" }); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  const inp = "w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#3DDC84]/60 transition-all duration-200";

  return (
    <section id="contact" className="py-24 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#3DDC84]/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#3DDC84]" />
          <span className="text-[#3DDC84] text-sm font-medium tracking-wider uppercase">{tx.tag}</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-5">{tx.h2}</h2>
            <p className="text-[#A0A0A0] text-lg mb-5">{tx.sub}</p>
            <ul className="space-y-3 mb-8">
              {tx.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-white text-sm">
                  <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#3DDC84" strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {b}
                </li>
              ))}
            </ul>
            <div className="bg-[#3DDC84]/10 border border-[#3DDC84]/20 rounded-xl px-4 py-3 mb-8 flex items-center gap-2">
              <Zap size={13} className="text-[#3DDC84] shrink-0" />
              <span className="text-[#3DDC84] text-sm font-medium">{tx.urgency}</span>
            </div>
            <p className="text-[#555] text-xs uppercase tracking-wider mb-4">{tx.or}</p>
            <div className="space-y-3 mb-6">
              {[
                { href: "mailto:rent@evcar.by", label: "rent@evcar.by", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7" strokeLinecap="round"/></svg> },
                { href: "tel:+375291530000", label: "+375 29 153 00 00", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { href: "https://t.me/evparkby", label: "@evparkby", icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              ].map((item, i) => (
                <a key={i} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white hover:text-[#3DDC84] transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center group-hover:border-[#3DDC84]/40 transition-colors">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              ))}
            </div>
            <div className="flex gap-3">
              <a href="https://t.me/evparkby" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/30 text-[#2AABEE] font-semibold text-sm hover:bg-[#2AABEE]/20 transition-all duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#2AABEE"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.614c-.148.663-.554.825-1.12.512l-3.1-2.284-1.495 1.438c-.165.165-.304.304-.624.304l.222-3.155 5.74-5.185c.25-.22-.054-.343-.386-.123L7.36 14.59l-3.04-.95c-.66-.207-.673-.66.138-.977l11.89-4.585c.55-.2 1.03.134.85.955z"/></svg>
                Telegram
              </a>
              <a href="https://wa.me/375291530000" target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-semibold text-sm hover:bg-[#25D366]/20 transition-all duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8">
            {status === "success" ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#3DDC84]/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#3DDC84" strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-white font-bold text-xl mb-2">{tx.success}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-[#555] text-xs mb-1.5 block">{tx.name} *</label>
                    <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder={tx.name} className={inp}/></div>
                  <div><label className="text-[#555] text-xs mb-1.5 block">{tx.company} *</label>
                    <input required value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} placeholder={tx.company} className={inp}/></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-[#555] text-xs mb-1.5 block">{tx.phone} *</label>
                    <input required type="tel" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+375 XX XXX XX XX" className={inp}/></div>
                  <div><label className="text-[#555] text-xs mb-1.5 block">{tx.fleet}</label>
                    <input type="number" min="1" value={form.fleet} onChange={e => setForm(f=>({...f,fleet:e.target.value}))} placeholder="10" className={inp}/></div>
                </div>
                <div><label className="text-[#555] text-xs mb-1.5 block">{tx.email}</label>
                  <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="company@example.by" className={inp}/></div>
                <div><label className="text-[#555] text-xs mb-1.5 block">{tx.message}</label>
                  <textarea rows={2} value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} placeholder="..." className={inp+" resize-none"}/></div>
                {status === "error" && <p className="text-red-400 text-sm">{tx.error} <a href="mailto:rent@evcar.by" className="underline">rent@evcar.by</a></p>}
                <button type="submit" disabled={status==="loading"}
                  className="w-full py-4 rounded-xl bg-[#3DDC84] text-[#0A0A0A] font-bold text-base hover:bg-[#2BC870] disabled:opacity-60 transition-all duration-200">
                  {status==="loading" ? tx.submitting : tx.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
