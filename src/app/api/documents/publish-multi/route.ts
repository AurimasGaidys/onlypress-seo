import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

/**
 * POST /api/documents/publish-multi
 * 
 * Publikuoja dokumentą į kelis portalus vienu metu.
 * 
 * Request Body:
 * {
 *   idToken: string;
 *   documentId: string;
 *   portalIds: string[];     // Portal IDs to publish to
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   published: string[];     // Successfully published portal IDs
 *   failed: Array<{portalId: string, error: string}>;
 *   totalCost: number;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, documentId, portalIds } = body;

    // ========== 1. AUTHENTICATION ==========
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // ========== 2. VALIDATION ==========
    if (!documentId || !portalIds || !Array.isArray(portalIds) || portalIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }

    // ========== 3. GET DOCUMENT ==========
    const docRef = adminDb.collection('documents').doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = docSnap.data();

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document data is missing' },
        { status: 404 }
      );
    }

    // Check access
    if (document.userId !== userId && document.agencyId) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData?.agencies?.[document.agencyId]) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // ========== 4. CALCULATE TOTAL COST ==========
    let totalCost = 0;
    const publishVariants = document.publishVariants || {};

    for (const portalId of portalIds) {
      const variant = publishVariants[portalId];
      if (variant && variant.status === 'generated') {
        totalCost += variant.price || 0;
      }
    }

    // ========== 5. CHECK USER CREDIT ==========
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const userCredit = userData?.credit || 0;

    if (userCredit < totalCost) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient credits',
          required: totalCost,
          available: userCredit
        },
        { status: 402 } // Payment Required
      );
    }

    // ========== 6. PUBLISH TO EACH PORTAL ==========
    const published: string[] = [];
    const failed: Array<{ portalId: string; error: string }> = [];

    for (const portalId of portalIds) {
      try {
        const variant = publishVariants[portalId];
        
        if (!variant) {
          failed.push({ portalId, error: 'Variant not found' });
          continue;
        }

        if (variant.status !== 'generated') {
          failed.push({ portalId, error: `Invalid status: ${variant.status}` });
          continue;
        }

        // TODO: Čia turėtų būti integacija su Publikuota.lt API arba WordPress plugin
        // Dabar tik pažymime kaip published Firestore
        
        await docRef.update({
          [`publishVariants.${portalId}.status`]: 'published',
          [`publishVariants.${portalId}.publishedAt`]: Date.now(),
          updatedAt: Date.now(),
        });

        published.push(portalId);

      } catch (error) {
        console.error(`Failed to publish to portal ${portalId}:`, error);
        failed.push({
          portalId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // ========== 7. DEDUCT CREDITS ==========
    if (published.length > 0) {
      const actualCost = published.reduce((sum, portalId) => {
        const variant = publishVariants[portalId];
        return sum + (variant?.price || 0);
      }, 0);

      await userRef.update({
        credit: userCredit - actualCost
      });

      // Log the transaction
      await adminDb.collection('transactions').add({
        userId,
        type: 'multi-publish',
        documentId,
        portalIds: published,
        amount: -actualCost,
        timestamp: Date.now(),
        description: `Multi-portal publishing: ${published.length} portals`
      });
    }

    // ========== 8. RETURN RESULTS ==========
    return NextResponse.json({
      success: true,
      published,
      failed,
      totalCost: totalCost,
      actualCost: published.length > 0 ? totalCost : 0,
      remainingCredit: userCredit - totalCost
    });

  } catch (error) {
    console.error('Error in publish-multi:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to publish articles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
