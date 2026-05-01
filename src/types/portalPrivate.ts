
export interface PortalSocialMedia {
    id: string;
    link: string;
    flowerCount: number;
    type: "instagram" | "facebook" | "twitter" | "youtube" | "tiktok" | "other";
}

export interface PortalPrivate {
    id: string;
    active: boolean;
    ownerId: string; // owner of the publisher
    adminIds: string[]; // owner of the publisher
    privateKey: string; // private key for the publisher
    createdAt: number;
    updatedAt: number;
    // step1

    title: string;
    domain: string; // domain of the publisher
    categories: string[]; // category of the publisher
    languagesOfPublication: string[]; // languages in which the publisher can publish content
    country: string; // country of the publisher
    type: string; // "blog" | "news" | "magazine" | "other"
    range: string[];
    requiredToProvidePhotoSource: boolean;

    // step2
    description: string;
    tags: string[];
    weDoNotPublishThemes: string;
    possiblePublicationsInTopics: string[];
    sensitiveContentPrice: number;

    // step3
    usersPerMonth: number;
    ahrefsDomainRating: number; // Ahrefs domain rating
    socialMediaFollowers: PortalSocialMedia[];
    price: number;
    priceType: "fixed" | "negotiable"; // fixed or negotiable
    priceNegotiable: boolean; // if priceType is negotiable, this indicates if the publisher is open to negotiation
    allowHtmlCode: boolean; // HTML code for the publication
    canProvideBacklink: boolean;
    backlinkType: "dofollow" | "nofollow" | "both"; // type of backlink
    canProvideStatistics: boolean; // if the publisher can provide statistics on the publication
    statisticsType: "views" | "clicks" | "both"; // type of statistics provided
    statisticsPrice: number; // price for statistics if applicable

    pluginActive?: boolean; // if the plugin is approved by the publisher
    pluginLastChecked?: number; // last time the plugin was checked
    pluginVersion?: string; // version of the plugin
    customInstallation?: boolean; // custom installation instructions for the plugin
    test?: boolean; // if true, then test mode is enabled, no changes will be made to the portal and loging enabled

    defaultUser?: string // wordpress user id of the plugin publish author
    defaultCategory?: string // wordpress category for the plugin publish 
    
    // Custom URL settings
    articlesPublishedInDifferentUrl?: boolean; // if articles are published in different URLs
    customUrls?: string[]; // custom URLs where articles can be published
}
