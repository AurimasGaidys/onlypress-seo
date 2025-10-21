"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Step3Props {
  onNextStep: () => void;
  onPreviousStep: () => void;
  updateFormData: (data: { length: number; tone: string }) => void;
}

export const Step3_Configure: React.FC<Step3Props> = ({ onNextStep, onPreviousStep, updateFormData }) => {
  const [length, setLength] = useState([2]); // Default to medium
  const [tone, setTone] = useState("profesionalus");

  const handleNext = () => {
    updateFormData({ length: length[0], tone });
    onNextStep();
  };

  const lengthLabels = ["Trumpas", "Vidutinis", "Ilgas"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Konfigūruokite straipsnį</h2>

      <div>
        <Label className="text-lg font-medium">Straipsnio ilgis</Label>
        <div className="mt-2">
          <Slider
            value={length}
            onValueChange={setLength}
            max={3}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-slate-400 mt-1">
            <span>Trumpas</span>
            <span>Vidutinis</span>
            <span>Ilgas</span>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-lg font-medium">Tonas</Label>
        <RadioGroup value={tone} onValueChange={setTone} className="mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="formalus" id="formalus" />
            <Label htmlFor="formalus">Formalus</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="snekamasis" id="snekamasis" />
            <Label htmlFor="snekamasis">Šnekamasis</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="profesionalus" id="profesionalus" />
            <Label htmlFor="profesionalus">Profesionalus</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onPreviousStep} size="lg" className="flex-1">
          Grįžti atgal
        </Button>
        <Button onClick={handleNext} size="lg" className="flex-1">
          Toliau
        </Button>
      </div>
    </div>
  );
};
