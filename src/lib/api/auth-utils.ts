import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

/**
 * Extracts and verifies the userId from a Firebase ID token in the request
 * @param request - The NextRequest object
 * @returns The user ID if authenticated, null if not authenticated or invalid token
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      console.log('Firebase Admin SDK not initialized');
      return null;
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('No authorization header found');
      return null;
    }

    // Extract the token from "Bearer <token>" format
    const token = authHeader.replace(/^Bearer\s+/, '');
    
    if (!token) {
      console.log('No token found in authorization header');
      return null;
    }

    // Verify the token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken.uid) {
      console.log('No uid found in decoded token');
      return null;
    }

    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}

/**
 * Alternative method - extracts userId from session cookies if using session-based auth
 * This would be used if the frontend sets Firebase auth tokens as httpOnly cookies
 */
export async function getUserIdFromCookies(request: NextRequest): Promise<string | null> {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      console.log('Firebase Admin SDK not initialized');
      return null;
    }

    // Get the session cookie (if using Firebase Auth with session cookies)
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('No session cookie found');
      return null;
    }

    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    return decodedClaims.uid;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

/**
 * Middleware to require authentication for API routes
 * Returns the userId if authenticated, or throws an error if not
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  // First try to get userId from Authorization header
  let userId = await getUserIdFromRequest(request);
  
  // If that fails, try cookies as fallback
  if (!userId) {
    userId = await getUserIdFromCookies(request);
  }
  
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  return userId;
}
