"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Step1Props {
  onNextStep: () => void;
  updateFormData: (data: { topic: string }) => void;
}

export const Step1_Idea: React.FC<Step1Props> = ({ onNextStep, updateFormData }) => {
  const [topic, setTopic] = useState("");

  const handleNext = () => {
    if (topic.trim()) {
      updateFormData({ topic });
      onNextStep();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pradėkime nuo pagrindinės minties</h2>
      <p className="text-slate-400">Įveskite temą, straipsnio idėją ar raktinį žodį, apie kurį norite rašyti.</p>
      <Input
        type="text"
        placeholder="Pvz., „Dirbtinio intelekto panaudojimas marketinge“"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="p-6 text-lg bg-slate-800"
      />
      <Button onClick={handleNext} disabled={!topic.trim()} size="lg" className="w-full">
        Toliau
      </Button>
    </div>
  );
};
