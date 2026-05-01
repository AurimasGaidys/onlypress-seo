// src/components/HowToStartModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, PenTool, MessageSquareText, Zap } from "lucide-react";

interface HowToStartModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function HowToStartModal({ isOpen, setIsOpen }: HowToStartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Welcome to Publikuota.lt Demo!</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            You are using the most advanced article editing technology. Here's a quick guide to get you started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">God Mode</h4>
              <p className="text-sm text-muted-foreground">
                Your creative powerhouse. Use the left-side controls to define your article's topic, SEO, structure, and generate a full draft with one click.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <PenTool className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Surgical AI Editor</h4>
              <p className="text-sm text-muted-foreground">
                Once you have a draft, select any piece of text to rephrase, shorten, expand, or fix grammar. The AI makes precise changes without rewriting everything.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <MessageSquareText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Journalist Co-pilot</h4>
              <p className="text-sm text-muted-foreground">
                Work with the AI in an interview format. It will ask you questions to gather information and then write an article based on your answers.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setIsOpen(false)}>Got It, Let's Start!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
