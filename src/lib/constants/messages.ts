/**
 * Centralized Lithuanian toast notification messages
 * Provides consistent user-facing messages across the application
 */

export const welcomeMessageContent = `Sveiki! Jūsų straipsnio juodraštis paruoštas.

Aš esu jūsų AI redaktorius, **Co-pilot**. Kartu paverskime šį tekstą išskirtiniu.

Štai keli būdai, kaip galime efektyviai dirbti kartu:
---
1.  **Chirurginis Tikslumas: Redaguokite Pažymėtą Tekstą**
    Pažymėkite bet kurią teksto dalį (žodį, sakinį ar visą pastraipą) ir duokite man komandą. Aš pakeisiu **TIK TĄ DALĮ**, nepakeisdamas likusio turinio.
    *   Pavyzdžiui: "Sutrumpink šią pastraipą."
    *   Pavyzdžiui: "Perfrazuok šį sakinį, kad skambėtų profesionaliau."
    *   Pavyzdžiui: "Pakeisk toną į laisvesnį."

2.  **Turinio Plėtra: Pridėkite Naujas Skiltis**
    Nereikia kopijuoti ir įklijuoti. Tiesiog nurodykite, kur ir ką norite pridėti. Aš suprasiu kontekstą.
    *   Pavyzdžiui: "Po įžangos pridėk skiltį apie istorinį kontekstą."
    *   Pavyzdžiui: "Straipsnio pabaigoje sukurk DUK (Dažniausiai Užduodamų Klausimų) sekciją."

3.  **Viso Dokumento Analizė: Gaukite Įžvalgas**
    Jums nereikia nieko žymėti. Tiesiog paprašykite atlikti analizę arba generuoti apibendrinimus.
    *   Pavyzdžiui: "Sukurk viso straipsnio santrauką (TL;DR versiją)."
    *   Pavyzdžiui: "Pasiūlyk 5 alternatyvius pavadinimus šiam tekstui."
    *   Pavyzdžiui: "Atlik greitą SEO patikrą."
---
**Patarimas:** Kuo konkretesnė jūsų užduotis, tuo geresnį rezultatą pateiksiu.

Ką norėtumėte patobulinti pirmiausia?`;

export const MESSAGES = {
  success: {
    documentSaved: 'Dokumentas sėkmingai išsaugotas',
    documentDeleted: 'Dokumentas sėkmingai ištrintas',
    versionRestored: 'Versija sėkmingai atkuriama',
    versionSaved: 'Versija sėkmingai išsaugota rankiniu būdu!',
    authenticationRequired: 'Reikalingas prisijungimas',
    fileUploaded: 'Failas sėkmingai įkeltas',
    settingsSaved: 'Nustatymai sėkmingai išsaugoti',
    folderCreated: 'Aplankas sėkmingai sukurtas',
    folderDeleted: 'Aplankas sėkmingai ištrintas',
    contentUpdated: 'Turinys sėkmingai atnaujintas',
    published: 'Straipsnis sėkmingai publikuotas',
    draftCreated: 'Juodraštis sėkmingai sukurtas',
    keywordsGenerated: 'Raktažodžiai sėkmingai sugeneruoti',
    metaGenerated: 'Meta duomenys sėkmingai sugeneruoti',
    titlesGenerated: 'Pavadinimai sėkmingai sugeneruoti',
    seoAnalysisComplete: 'SEO analizė sėkmingai atlikta',
    linkAdded: 'Nuoroda sėkmingai pridėta',
    copySuccess: 'Nukopijuota sėkmingai',
    documentDownloaded: 'Dokumentas sėkmingai atsisiųstas',
  },
  errors: {
    authenticationRequired: 'Reikalingas prisijungimas',
    authenticationFailed: 'Nepavyko patvirtinti tapatybę',
    permissionDenied: 'Leidimas atmestas',
    documentNotFound: 'Dokumentas nerastas',
    saveFailed: 'Nepavyko išsaugoti dokumentą',
    deleteFailed: 'Nepavyko ištrinti dokumentą',
    uploadFailed: 'Nepavyko įkelti failą',
    networkError: 'Tinklo klaida',
    validationError: 'Patvirtinimo klaida',
    generationFailed: 'Nepavyko sugeneruoti turinį',
    publishFailed: 'Nepavyko publikuoti straipsnį',
    invalidRequest: 'Neteisinga užklausa',
    rateLimitExceeded: 'Viršytas prašymų limitas',
    serverError: 'Serverio klaida',
    copyFailed: 'Nepavyko nukopijuoti',
    loadFailed: 'Nepavyko įkelti duomenis',
    operationFailed: 'Operacija nepavyko',
    sessionExpired: 'Sesija baigėsi',
  },
  info: {
    loading: 'Kraunama...',
    processing: 'Apdorojama...',
    saving: 'Išsaugoma...',
    generating: 'Generuojama...',
    uploading: 'Įkeliama...',
    fetching: 'Gaunama...',
    noChanges: 'Pakeitimų nėra',
    noData: 'Duomenų nėra',
    autoSaveEnabled: 'Auto išsaugojimas įjungtas',
    lastSaved: 'Paskutinis kartą išsaugota',
    versionHistory: 'Versijų istorija',
    selectFile: 'Pasirinkite failą',
    confirmDelete: 'Ar tikrai norite ištrinti šį dokumentą? Šio veiksmo negalima atšaukti.',
    confirmRestore: 'Ar tikrai norite atkurti šią versiją?',
    unsavedChanges: 'Neišsaugoti pakeitimai',
    connectionLost: 'Ryšys prarastas',
  },
  warnings: {
    unsavedChanges: 'Turite neišsaugotų pakeitimų',
    largeFile: 'Failas per didelis',
    slowConnection: 'Lėtas ryšys',
    quotaExceeded: 'Viršytota kvota',
    deprecatedBrowser: 'Naudote pasenętos naršyklės versiją',
    incompatibleFormat: 'Nepalaikomas failo formatas',
  },
};

// Helper functions for common toast patterns
export const showSuccessToast = (message: keyof typeof MESSAGES.success) => {
  // This would be used with: import { toast } from 'sonner'; toast.success(MESSAGES.success[message]);
};

export const showErrorToast = (message: keyof typeof MESSAGES.errors) => {
  // This would be used with: import { toast } from 'sonner'; toast.error(MESSAGES.errors[message]);
};

export const showInfoToast = (message: keyof typeof MESSAGES.info) => {
  // This would be used with: import { toast } from 'sonner'; toast.info(MESSAGES.info[message]);
};

export const showWarningToast = (message: keyof typeof MESSAGES.warnings) => {
  // This would be used with: import { toast } from 'sonner'; toast.warning(MESSAGES.warnings[message]);
};
