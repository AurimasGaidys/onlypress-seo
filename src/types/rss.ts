// src/types/rss.ts

// Ši sąsaja apibrėžia naują įdėtinį SEO objektą
export interface RssSeoInfo {
  featuredImage?: string;
  title: string;
  description: string;
}

// Atnaujinta RssTextInfo sąsaja, kuri dabar talpina savyje RssSeoInfo
export interface RssTextInfo {
  title: string;
  content: string; // HTML turinys
  seo: RssSeoInfo;
}

// Galutinė RssRelease sąsaja, atitinkanti naują API atsakymą
export interface RssRelease {
  id: string;
  status: string;
  textInfo: RssTextInfo;
  textLanguage: string;
  publishCategory: string; // Paliekame suderinamumui, jei kur nors naudojama
  publishCategories: string[]; // Pagrindinis kategorijų masyvas
  sourceUrl: string;
  dateCreated: number; // Unix timestamp in milliseconds
  dateUpdated: number; // Unix timestamp in milliseconds
  sourceName?: string; // Pridedame šaltinio pavadinimą (neprivalomas)
  contacts?: {
    name?: string;
    company?: string;
    phone?: string;
    position?: string;
  };
}

export interface RssApiResponse {
  success: boolean;
  count: number;
  data: RssRelease[];
}
