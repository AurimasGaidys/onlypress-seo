// src/types/env.d.ts

// This file provides type definitions for Node.js environment variables.
// It helps TypeScript understand the types of variables defined in .env files.

namespace NodeJS {
  interface ProcessEnv {
    // Server-side variables
    GOOGLE_API_KEY: string;
    ARTICLE_GENERATION_MODEL: string;
    IMAGE_GENERATION_MODEL: string;
    DOCUMENT_ANALYSIS_MODEL: string;
    STRIPE_SECRET_KEY: string;
    
    // Public (client-side) variables
    NEXT_PUBLIC_FIREBASE_API_KEY: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    NEXT_PUBLIC_FIREBASE_APP_ID: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  }
}
