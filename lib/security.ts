import { timingSafeEqual } from 'node:crypto';

export function validMaintenanceToken(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !header?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function allowedOrigin(origin: string | null, canonical: string): boolean {
  try { return origin !== null && new URL(origin).origin === new URL(canonical).origin; }
  catch { return false; }
}
