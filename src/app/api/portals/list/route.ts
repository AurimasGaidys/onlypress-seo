// src/app/api/portals/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const listPortalsSchema = z.object({
  idToken: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = listPortalsSchema.parse(body);

    const requestingUser = await adminAuth.verifyIdToken(idToken);

    // CORRECTED: Query 'portals' collection with active filter
    const portalsSnapshot = await adminDb
      .collection('portals')
      .where('active', '==', true) // We only want to show active portals
      .get();

    const portals = portalsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // ENHANCED: Better data transformation and validation with domain support
      const portal = {
        id: doc.id,
        title: data.title || data.name || data.description?.split(' ').slice(0, 3).join(' ') || 'Untitled Portal',
        name: data.name || data.title || 'Untitled Portal', // Fallback
        url: data.url || data.website || data.link || '',
        domain: data.domain, // Include domain field for UI fallback
        categories: Array.isArray(data.categories) 
          ? data.categories.filter(cat => typeof cat === 'string' && !cat.includes('-')) // Filter out UUID-like strings
          : ['General'], // Fallback for non-array categories
        description: data.description || data.title || 'No description available.',
        price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
        ahrefsDomainRating: typeof data.ahrefsDomainRating === 'number' ? data.ahrefsDomainRating : 0, // ADDED
        usersPerMonth: typeof data.usersPerMonth === 'number' ? data.usersPerMonth : 0, // ADDED
        active: typeof data.active === 'boolean' ? data.active : true, // ADDED
        isCompatible: typeof data.isCompatible === 'boolean' ? data.isCompatible : false,
        weDoNotPublishThemes: data.weDoNotPublishThemes || '', // ADDED
        possiblePublicationsInTopics: Array.isArray(data.possiblePublicationsInTopics) ? data.possiblePublicationsInTopics : [] // ADDED
      };

      // Debug logging to help identify data issues
      console.log('Portal document:', doc.id, portal);
      console.log('Original data:', data);
      
      return portal;
    });

    console.log('Total portals fetched:', portals.length);

    let userCredit = 0;
    const userPrivateDoc = await adminDb.collection('users-private').doc(requestingUser.uid).get();
    if (userPrivateDoc.exists) {
      userCredit = userPrivateDoc.data()?.credit || 0;
    }

    return NextResponse.json({
      success: true,
      portals,
      userCredit,
    });

  } catch (error) {
    console.error('Error in portals list API:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.format() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
