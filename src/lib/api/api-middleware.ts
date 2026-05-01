import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from './auth-utils';

type AuthenticatedApiHandler = (
    req: NextRequest,
    context: { userId: string }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedApiHandler) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const userId = await getUserIdFromRequest(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return handler(req, { userId });
    };
}
