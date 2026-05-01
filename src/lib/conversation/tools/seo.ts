// src/lib/conversation/tools/seo.ts
import { PhaseHandler, PhaseHandlerResult } from '../conversationMachine';

export async function runSeoAnalysisTool(context: Parameters<PhaseHandler>[0], params: Record<string, unknown>): Promise<PhaseHandlerResult> {
  const { documentContent } = context;
  const { keywords } = params; // Ateityje intencija gali ištraukti raktažodžius iš komandos

  // Čia galėtume iškviesti /api/content-analysis/seo-analyze
  // Kol kas simuliuojame atsakymą
  const seoResult = `
    Atlikau SEO analizę. Rezultatai:
    - **Bendras įvertinimas:** 75/100
    - **Raktažodžių tankis:** Geras
    - **Pasiūlymai:** Apsvarstykite galimybę pridėti daugiau vidinių nuorodų.
  `;

  return {
    nextPhase: 'INTERACTIVE_REFINEMENT',
    response: {
      type: 'message',
      response: seoResult
    }
  };
}
