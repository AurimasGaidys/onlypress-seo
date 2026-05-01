import { PhaseHandler } from '../conversationMachine';
import { sanitizeJsonOutput, safeJsonParse } from '../utils';

export const handleGreetingPhase: PhaseHandler = async ({
  lastUserMessage,
  model,
  state,
  fileParts,
}) => {
  const updatedBlueprint = {
    ...state.metadata.blueprint,
    topic: lastUserMessage,
  };

  // Scenario 1: No file provided, only topic
  if (!fileParts || fileParts.length === 0) {
    const promptForTopicOnly = `The user provided a topic in Lithuanian: "${lastUserMessage}". Your task is to respond IN LITHUANIAN. Ask what type of article they want to create. Return ONLY a valid JSON object with "response" (your question in Lithuanian) and "actions" (an array of suggested article types in Lithuanian).

    Example Response (in Lithuanian):
    {
      "response": "Puiki tema! Kokio formato straipsnį norėtumėte kurti?",
      "actions": [
        { "label": "Naujienų pranešimas" },
        { "label": "Analitinė apžvalga" },
        { "label": "Paaiškinamasis vadovas" }
      ]
    }`;

    return {
      streaming: true,
      streamType: 'message',
      prompt: promptForTopicOnly,
      nextPhase: 'ARTICLE_TYPE_SELECTION',
      metadataUpdates: { blueprint: updatedBlueprint },
    };
  }

  // Scenario 2: File is provided
  const promptForFile = `The user uploaded a document for a topic in Lithuanian: "${lastUserMessage}". Your task is to analyze the document and respond IN LITHUANIAN.

  1.  Acknowledge the file reception in Lithuanian.
  2.  Based on the content, decide if you have enough info for a plan.
  3.  If info is sufficient, offer a shortcut action in Lithuanian: "Pasiūlyti straipsnio planą iškart".
  4.  ALWAYS ask the user in Lithuanian what type of article they want and provide options in Lithuanian.

  Return ONLY a valid JSON object with "response" and "actions", all in Lithuanian.

  Example for a good document (in Lithuanian):
  {
    "response": "Peržiūrėjau įkeltą dokumentą. Jame yra išsami informacija. Kokio formato straipsnį norėtumėte kurti? Manau, kad turime pakankamai informacijos, kad pereitume tiesiai prie plano pasiūlymo.",
    "actions": [
      { "label": "Naujienų pranešimas" },
      { "label": "Analitinė apžvalga" },
      { "label": "Pasiūlyti straipsnio planą iškart" }
    ]
  }`;

  return {
    streaming: true,
    streamType: 'message',
    prompt: promptForFile,
    nextPhase: 'ARTICLE_TYPE_SELECTION', // The next phase is the same, but the AI's response and actions are smarter
    metadataUpdates: { blueprint: updatedBlueprint },
  };
};
