"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Step4Props {
  onPreviousStep: () => void;
}

export const Step4_Generate: React.FC<Step4Props> = ({ onPreviousStep }) => {
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const mockArticle = `
    Dirbtinio intelekto panaudojimas marketinge yra iš esmės keičiantis mūsų prieigą prie reklamos ir klientų įtraukimo. Šiuolaikiniame pasaulyje, kai duomenų kiekis auga eksponentiškai, AI įrankiai padeda rinkodaros specialistams greitai analizuoti tendencijas, asmeninti turinį ir prognozuoti vartotojų elgesį.

    Pirmiausia, AI gali optimizuoti turinio kūrimą. Įrankiai kaip GPT modeliai leidžia greitai generuoti aukštos kokybės tekstą, pritaikytą specifinėms auditorijoms. Šis procesas ne tik taupo laiką, bet ir užtikrina, kad turinys būtų tikslus ir patrauklus.

    Antra, duomenų analizė tampa daug efektyvesnė. Mašininio mokymosi algoritmai gali identifikuoti raudoni modelių duomenyse, padėti nustatyti tikslines grupes ir prognozuoti pardavimo rezultatus. Tai leidžia rinkodaros kampanijoms būti ne tik reaktyvioms, bet ir proaktyvioms.

    Nepaisant privalumų, svarbu atsiminti etiško AI naudojimo principus. Duomenų privatumas turi būti saugomas, ir algoritmai turėtų būti parengti taip, kad jie nebūtų šališki.

    Galiausiai, AI integravimas į marketingo strategiją lemia efektyvesnį darbą ir geresnius rezultatus. Įmonės, kurios priima šią technologiją, dažnai pirmauja kartu su inovacijomis.
  `;

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-600 border-t-slate-100 rounded-full"
        />
        <h2 className="text-xl font-semibold">Generuojamas straipsnis...</h2>
        <p className="text-slate-400">Prašome palaukti keletą sekundžių</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold"
      >
        Straipsnis sugeneruotas!
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800 p-6 rounded-lg leading-relaxed whitespace-pre-wrap"
      >
        {mockArticle}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-start mt-4"
      >
        <Button variant="outline" onClick={onPreviousStep}>
          Grįžti atgal
        </Button>
      </motion.div>
    </div>
  );
};
