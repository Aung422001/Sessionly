import { NextResponse } from 'next/server';
import { database } from '@/lib/supabase';
import { safeNext } from '@/lib/domain';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const db = await database();
  const code = url.searchParams.get('code');
  const token = url.searchParams.get('token_hash');
  const result = code ? await db.auth.exchangeCodeForSession(code) : token ? await db.auth.verifyOtp({ token_hash: token, type: 'email' }) : { error: true };
  const origin = process.env.APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(new URL(result.error ? '/auth?error=verification' : safeNext(url.searchParams.get('next')), origin));
}
