import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
  try {
    const { scheduleId } = await params;
    const { idToken, newScheduledAt } = await req.json();

    if (!idToken || !newScheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify user authentication
    await adminAuth.verifyIdToken(idToken);
    
    const scheduleRef = adminDb.doc(`schedules/${scheduleId}`);
    const scheduleSnap = await scheduleRef.get();

    if (!scheduleSnap.exists) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    // Čia galite pridėti papildomą teisių patikrinimą pagal agencyId

    await scheduleRef.update({
      scheduledAt: Timestamp.fromDate(new Date(newScheduledAt)),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const resolvedParams = await params;
    console.error(`[API/schedules/${resolvedParams.scheduleId} PUT] Error:`, error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
  try {
    const { scheduleId } = await params;
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify user authentication
    await adminAuth.verifyIdToken(idToken);
    
    const scheduleRef = adminDb.doc(`schedules/${scheduleId}`);
    const scheduleSnap = await scheduleRef.get();

    if (!scheduleSnap.exists) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    // Čia galite pridėti papildomą teisių patikrinimą pagal agencyId

    await scheduleRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    const resolvedParams = await params;
    console.error(`[API/schedules/${resolvedParams.scheduleId} DELETE] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
