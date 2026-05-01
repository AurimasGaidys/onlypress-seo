export interface PortalPublic {
    id: string;
    title: string;
    description: string;
    domain: string;
    image: string;

    categories: string[];
    price: number;
    customPrice: number; // lokalus kintamasis 

    weDoNotPublishThemes: string;
    possiblePublicationsInTopics: string[];
    sensitiveContentPrice: number;

    usersPerMonth: number;
    ahrefsDomainRating: number; // Ahrefs domain rating
    socalMediaFollowers: {
        instagram: number;
        facebook: number;
        twitter: number;
        youtube: number;
        tiktok: number;
        other: string;
    };

    allowHtmlCode: boolean; // HTML code for the publication
    canProvideBacklink: boolean;
    backlinkType: "dofollow" | "nofollow" | "both"; // type of backlink

    language: string[]; // ISO language codes like "en", "lt", "de"
    country: string; // country code like "US", "LT", "DE" or "International" for global portals

    active: boolean;
    createdAt: number;
    updatedAt: number;
}