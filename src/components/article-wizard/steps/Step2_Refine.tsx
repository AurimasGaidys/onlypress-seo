"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Step2Props {
  onNextStep: () => void;
  onPreviousStep: () => void;
  updateFormData: (data: { title: string }) => void;
}

const mockTitles = [
  "Kaip dirbtinis intelektas keičia rinkodaros kraštovaizdį",
  "AI revoliucija: nuo duomenų iki išminties",
  "Strateginės rinkodaros evoliucija su AI pagalba",
  "Nuo idėjų iki rezultatų: AI vaidmuo marketinge",
  "Ateities rinkodara: kaip AI padeda pasiekti tikslus",
  "Integruojant AI į jūsų rinkodaros strategiją",
];

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const Step2_Refine: React.FC<Step2Props> = ({ onNextStep, onPreviousStep, updateFormData }) => {
  const handleSelectTitle = (title: string) => {
    updateFormData({ title });
    onNextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pasirinkite patraukliausią pavadinimą</h2>
        <Button variant="outline" onClick={onPreviousStep}>
          Grįžti atgal
        </Button>
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4"
      >
        {mockTitles.map((title, index) => (
          <motion.div key={title} variants={itemVariants}>
            <Card
              onClick={() => handleSelectTitle(title)}
              className="cursor-pointer hover:bg-slate-800 transition-colors p-4"
            >
              <CardContent className="p-0">
                <p className="text-lg">{title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
