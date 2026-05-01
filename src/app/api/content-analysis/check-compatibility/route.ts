import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Portal, PortalCompatibilityResult } from '@/types/portal';
import { z } from "zod";
import { adminAuth } from '@/lib/firebase-admin';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimiter';

const checkCompatibilitySchema = z.object({
  content: z.string(),
  idToken: z.string(),
});

export async function POST(request: NextRequest) {
  // Rate limiting check
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = checkRateLimit('checkCompatibility', clientIp);
  
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse();
  }

  try {
    const body = await request.json();
    // Išskiriame tokeną iš likusio body
    const { idToken, ...payload } = body;

    // Patikriname, ar tokenas egzistuoja
    if (!idToken) {
      return NextResponse.json({ error: 'Authentication token is required' }, { status: 401 });
    }

    // Verifikuojame tokeną
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const uid = decodedToken.uid; // Gauname patvirtinto vartotojo ID

    const validationResult = checkCompatibilitySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.format() }, { status: 400 });
    }

    const { content } = payload;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Simple keyword-based analysis for categories
    const contentLower = content.toLowerCase();

    const categoryKeywords = {
      gambling: [
        'casino', 'betting', 'slot', 'poker', 'roulette', 'blackjack',
        'lottery', 'gambling', 'bet', 'sports betting', 'online casino',
        'jackpot', 'odds', 'wagering', 'craps', 'baccarat'
      ],
      crypto: [
        'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
        'blockchain', 'mining', 'wallet', 'trading', 'exchange', 'defi',
        'nft', 'stablecoin', 'airdrops', 'staking', 'hodl', 'shiba'
      ],
      adult: [
        'porn', 'adult', 'nude', 'sex', 'escort', 'dating', 'cam',
        'adult content', 'xxx', 'erotica', 'nsfw', 'adult videos'
      ]
    };

    const detectedCategories: string[] = [];

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const hasKeywords = keywords.some(keyword =>
        contentLower.includes(keyword.toLowerCase())
      );

      if (hasKeywords) {
        detectedCategories.push(category);
      }
    }

    // Get all portals from Firestore
    const portalsQuery = query(collection(db, 'portals'));
    const portalsSnapshot = await getDocs(portalsQuery);

    let portals: Portal[] = portalsSnapshot.docs.map(doc => {
      const data = doc.data();
      const portalCategories = data.categories || [];
      const isCompatible = detectedCategories.length === 0 ||
                          detectedCategories.some(cat => portalCategories.includes(cat));

      return {
        id: doc.id,
        name: data.name,
        url: data.url,
        categories: portalCategories,
        description: data.description,
        isCompatible,
        price: data.price || 100
      };
    });

    // If no portals found, use default sample data
    if (portals.length === 0) {
      const defaultPortals = [
        { id: '1', name: 'Casino Deluxe', url: 'https://casino-deluxe.example.com', categories: ['gambling'] as string[], description: 'Premium online casino', price: 100 },
        { id: '2', name: 'Sports Betting Plus', url: 'https://sportsbetting-plus.example.com', categories: ['gambling'] as string[], description: 'Professional sports betting', price: 100 },
        { id: '3', name: 'Crypto Trade Pro', url: 'https://cryptotrade-pro.example.com', categories: ['crypto'] as string[], description: 'Advanced cryptocurrency trading', price: 100 },
        { id: '4', name: 'General News Hub', url: 'https://general-news.example.com', categories: [] as string[], description: 'General news portal', price: 100 },
        { id: '5', name: 'Adult Content Network', url: 'https://adult-network.example.com', categories: ['adult'] as string[], description: 'Premium adult content', price: 100 },
      ];

      portals = defaultPortals.map(portal => ({
        ...portal,
        isCompatible: detectedCategories.length === 0 || detectedCategories.some(cat => portal.categories.includes(cat))
      }));
    }

    const result: PortalCompatibilityResult = {
      portals: portals,
      detectedCategories
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking portal compatibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
