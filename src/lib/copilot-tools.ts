// src/lib/copilot-tools.ts
import { SchemaType } from "@google/genai";

export const copilotTools = [
  {
    functionDeclarations: [
      {
        name: "generate_article_structure",
        description: "Naudoti, kai vartotojas prašo sukurti straipsnio planą, struktūrą arba pradėti rašyti straipsnį nuo nulio. Šis įrankis sugeneruoja pradinį straipsnio planą Markdown formatu.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            topic: {
              type: SchemaType.STRING,
              description: "Straipsnio tema, pvz., 'Ateities technologijos'."
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "generate_full_draft",
        description: "Naudoti TIK tada, kai vartotojas patvirtina jau sukurtą straipsnio planą/struktūrą. Šis įrankis generuoja pilną straipsnio juodraštį HTML formatu.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            approved_structure: {
              type: SchemaType.STRING,
              description: "Patvirtintas straipsnio planas, pagal kurį reikia generuoti juodraštį."
            },
          },
          required: ["approved_structure"],
        },
      },
      {
        name: "edit_document_content",
        description: "Naudoti, kai vartotojas duoda komandą redaguoti, keisti, taisyti, trumpinti, plėsti ar kitaip modifikuoti jau esamą tekstą redaktoriuje.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                edit_instruction: {
                  type: SchemaType.STRING,
                  description: "Konkreti vartotojo komanda, pvz., 'Sutrumpink įžangą' arba 'Pakeisk antraštę į H1'."
                },
            },
            required: ["edit_instruction"],
        },
      },
    ],
  },
];
