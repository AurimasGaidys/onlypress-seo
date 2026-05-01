export interface TextInfo {
    title: string,
    content: string,
    seo: {
        featuredImage: string, // image url
        title: string,
        description: string,
    }
}

export interface PublishTaskInfo {
    id: string,
    status: "Created" | "Published" | "PortalRejected" | "BuyerRejected" | "Completed",
    portalId: string,
    price: number,
    backLink: string, // link to the portal
    dateCreated: number,
    datePublished: number,
}

export interface PublishOrder {
    id: string,
    status: "Created" | "Paid" | "Rejected" | "Completed", // is callback competed (back link), rejected
    publishers: string[],
    prices: number[]; // prices for each publisher
    publishDate: number,
    dateToPublish: number, // when to publish, if not set, then publish immediately
    price: number,

    publisherCategories: string[], // text category id
    textInfo: TextInfo,

    publishTasks: PublishTaskInfo[]

    buyerId: string,
    agencyId?: string,
    paymentId: string

    dateCreated: number,
    dateUpdated: number,
    offsetInMinutes: number, // offset in minutes from UTC

    createPublicReloease: boolean, // create public release in the portal
    seoDocumentId?: string; // optional seo document id
}
