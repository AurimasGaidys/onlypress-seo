import * as crypto from 'crypto';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certsCache: { keys: Record<string, string>; expiresAt: number } | null = null;

async function getPublicKeys(): Promise<Record<string, string>> {
    if (certsCache && Date.now() < certsCache.expiresAt) return certsCache.keys;

    const res = await fetch(CERTS_URL);
    const keys = await res.json() as Record<string, string>;
    const cacheControl = res.headers.get('cache-control') ?? '';
    const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] ?? '3600', 10);
    certsCache = { keys, expiresAt: Date.now() + maxAge * 1000 };

    return keys;
}

function base64urlDecode(str: string): Buffer {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64');
}

export async function verifyAuthToken(req: Request): Promise<string> {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Missing auth token');

    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const header = JSON.parse(base64urlDecode(parts[0]).toString());
    const payload = JSON.parse(base64urlDecode(parts[1]).toString());

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) throw new Error('Token expired');
    if (payload.aud !== PROJECT_ID) throw new Error('Invalid audience');
    if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) throw new Error('Invalid issuer');

    const keys = await getPublicKeys();
    const cert = keys[header.kid];
    if (!cert) throw new Error('Unknown key ID');

    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = base64urlDecode(parts[2]);

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signingInput);
    const valid = verify.verify(cert, signature);
    if (!valid) throw new Error('Invalid signature');

    return payload.sub as string;
}
