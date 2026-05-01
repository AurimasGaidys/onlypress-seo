# AI Redagavimo įrankiai

Šis katalogas talpina AI pagrįstus teksto redagavimo įrankius, kurie leidžia atlikti įvairias operacijas su dokumentų turiniu.

## Esami įrankiai

### Baziniai redagavimo įrankiai
- `runRewriteTool.ts` - perrašo pasirinktą tekstą pagal vartotojo nurodymus
- `runShortenTool.ts` - sutrumpina tekstą išlaikant esmę
- `runExpandTool.ts` - išplečia tekstą pridedant daugiau detalių
- `runFixGrammarTool.ts` - taiso gramatikos ir rašybos klaidas
- `runChangeToneTool.ts` - keičia teksto toną (pvz., iš oficialaus į draugišką)
- `runAddSectionTool.ts` - prideda naują teksto sekciją
- `runRemoveSectionTool.ts` - pašalina pasirinktą teksto sekciją
- `runFindAndReplaceTool.ts` - randą ir pakeičia nurodytą tekstą

### Specializuoti įrankiai
- `runSeoAnalysisTool.ts` - atlieka SEO analizę ir siūlo optimizavimo rekomendacijas
- `runPortalCheckTool.ts` - tikrina dokumento suderinamumą su portalo reikalavimais
- `runReorderSectionsTool.ts` - pertvarko dokumento sekcijų tvarką
- `runFactCheckTool.ts` - tikrina faktinę informaciją ir pateikia patikrinimo ataskaitą
- `runReadabilityAnalysisTool.ts` - analizuoja teksto skaitomumą ir sudėtingumą
- `runFormatConsistencyTool.ts` - tikrina ir užtikrina formato nuoseklumą

## Naudojimas

Kiekvienas įrankis yra `PhaseHandler` tipo funkcija, kuri:
1. Priima kontekstą su dokumento informacija, vartotojo žinute ir AI modeliu
2. Apdoroja užklausą ir sugeneruoja atsakymą
3. Grąžina rezultatą su nurodymais, kaip toliau elgtis pokalbio procesui

## Registracija

Visi įrankiai yra registruoti `index.ts` faile ir pasiekiami per `editingTools` objektą.

## Ateities planai

Daugiau informacijos apie planuojamus ateities įrankius rasite `FUTURE_TOOLS.md` faile.

## Kuriant naujus įrankius

Nauji įrankiai turėtų:
- Būti `PhaseHandler` tipo funkcijos
- Grąžinti `PhaseHandlerResult` objektą
- Būti užregistruoti `index.ts` faile
- Turėti aiškų pavadinimą, atitinkantį jų funkcionalumą (pvz., `run[Purpose]Tool`)
- Būti dokumentuoti .md faile
