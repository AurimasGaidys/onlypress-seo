// src/components/ai-assistant-sidebar.tsx
'use client';

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { BrainCircuit, Lightbulb, PenSquare, SearchCheck } from "lucide-react";

export default function AIAssistantSidebar() {
  return (
    <aside className="space-y-6">
      {/* Suggestions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Let the AI review your text and provide suggestions.
          </p>
          <Button className="w-full" disabled>Review suggestions</Button>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What do you want to do?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" disabled>
            <PenSquare className="mr-2 h-4 w-4" />
            Improve it
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <SearchCheck className="mr-2 h-4 w-4" />
            Identify any gaps
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Lightbulb className="mr-2 h-4 w-4" />
            More ideas
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
