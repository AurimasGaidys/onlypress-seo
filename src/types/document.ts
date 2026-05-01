// /**
//  * PortalVariant - viena pergeneruota straipsnio versija konkrečiam portalui
//  */
// export interface PortalVariant {
//   portalId: string;           // Portal ID iš portals collection
//   portalTitle: string;        // Portal pavadinimas
//   portalDomain: string;       // Portal domain
//   content: string;            // Pergeneruotas HTML turinys
//   title?: string;             // Pergeneruotas straipsnio title (jei skiriasi nuo original)
//   status: 'pending' | 'generating' | 'generated' | 'published' | 'failed';
//   generatedAt?: number;       // Timestamp kada sugeneruota
//   publishedAt?: number;       // Timestamp kada publikuota
//   price: number;              // Portalo kaina (iš portals collection)
//   error?: string;             // Klaidos pranešimas jei status = 'failed'
// }

// /**
//  * PublishVariantsMap - Map struktūra visoms portal variants
//  * Key = portalId, Value = PortalVariant
//  */
// export type PublishVariantsMap = {
//   [portalId: string]: PortalVariant;
// };

export interface ArticleDocument {
  id: string;
  title: string;
  content: string;
  snippet: string;
  userId: string;
  folderId?: string;
  clientId?: string;
  projectId?: string;
  agencyId?: string;
  createdAt: Date;
  lastEdited: Date;
  publishAt?: Date; // TODO keep planed publish date
  // thumbnailUrl?: string;
  // Cia gausis kad mes padarome on order create 
  status?: 'draft' | 'scheduled' | 'in-review' | 'paid' |'rejected' | 'approved' | 'published';
  wordCount?: number;
  tags?: string[];

  // ========== NAUJI LAUKAI (MULTI-PORTAL PUBLISHING) ==========
  selectedPortals?: string[];              // Array of selected portal IDs
  orderId?: string;                        // ID of the associated publish order
  // publishVariants?: PublishVariantsMap;    // Map of portal variants v2??
  // ============================================================

  metadata?: {
    featuredImage?: string;
    seoTitle?: string;
    seoDescription?: string;
  };
}

export type DocumentVersionChangeType = 'auto' | 'manual' | 'ai';

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  title: string;
  createdAt: Date;
  changeType: DocumentVersionChangeType;
}

// // Legacy Document interface for backward compatibility
// export interface Document {
//   id: string;
//   title: string;
//   content: string;
//   snippet: string;
//   userId: string;
//   createdBy: string;  // Map from userId
//   folderId?: string;
//   clientId?: string;
//   projectId?: string;
//   agencyId?: string;
//   createdAt: number;   // timestamp format
//   updatedAt: number;  // Map from lastEdited
//   lastEdited: Date;
//   thumbnailUrl?: string;
//   status?: 'draft' | 'in-review' | 'approved' | 'published';
//   wordCount?: number;
//   tags?: string[];
//   workspace: 'personal' | 'agency';
//   scheduledDate?: number;
//   publishedDate?: number;

//   // ========== NAUJI LAUKAI (MULTI-PORTAL PUBLISHING) ==========
//   selectedPortals?: string[];              // Array of selected portal IDs
//   publishVariants?: PublishVariantsMap;    // Map of portal variants
//   // ============================================================

//   metadata?: {
//     author?: string;
//     excerpt?: string;
//     featuredImage?: string;
//     seoTitle?: string;
//     seoDescription?: string;
//     keywords?: string[];
//   };
// }
