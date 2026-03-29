import { useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Pain from "../components/Pain";
import Comparison from "../components/Comparison";
import Solution from "../components/Solution";
import Economics from "../components/Economics";
import HowItWorks from "../components/HowItWorks";
import Industries from "../components/Industries";
import Cases from "../components/Cases";
import WhyUs from "../components/WhyUs";
import Risks from "../components/Risks";
import ESG from "../components/ESG";
import Car from "../components/Car";
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";

export type Lang = "ru" | "by";

export default function Index() {
  const [lang, setLang] = useState<Lang>("ru");

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Header lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <Pain lang={lang} />
      <Comparison lang={lang} />
      <Solution lang={lang} />
      <Economics lang={lang} />
      <HowItWorks lang={lang} />
      <Industries lang={lang} />
      <Cases lang={lang} />
      <WhyUs lang={lang} />
      <Risks lang={lang} />
      <ESG lang={lang} />
      <Car lang={lang} />
      <ContactForm lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}
