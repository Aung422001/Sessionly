'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { database } from '@/lib/supabase';
import { safeNext, dateOnly, validGuests, currency, type Quote } from '@/lib/domain';
import { allowedOrigin } from '@/lib/security';
import { deliverNotifications } from '@/lib/jobs';

async function checkOrigin() {
  if (!allowedOrigin((await headers()).get('origin'), process.env.APP_URL || 'http://localhost:3000')) throw new Error('This request did not come from Sessionly.');
}

export async function authenticate(form: FormData) {
  await checkOrigin();
  const next = safeNext(form.get('next'));
  const mode = form.get('mode') === 'signup' ? 'signup' : 'signin';
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) redirect(`/auth?next=${encodeURIComponent(next)}&error=credentials`);
  const db = await database();
  if (mode === 'signup') {
    const { error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/confirm?next=${encodeURIComponent(next)}` } });
    if (error) redirect(`/auth?next=${encodeURIComponent(next)}&error=signup`);
    redirect(`/auth?next=${encodeURIComponent(next)}&notice=verify`);
  }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) redirect(`/auth?next=${encodeURIComponent(next)}&error=credentials`);
  redirect(next);
}

export async function signOut() {
  await checkOrigin();
  const { error } = await (await database()).auth.signOut();
  if (error) throw new Error('Sign-out failed. Please try again.');
  revalidatePath('/', 'layout');
  redirect('/');
}

export type ReserveState = { error: string; quote?: Quote };

export async function reserve(_previous: ReserveState, form: FormData): Promise<ReserveState> {
  await checkOrigin();
  let bookingId = '';
  try {
    if (form.get('accept') !== 'on') return { error: 'Accept the demo and cancellation terms before confirming.' };
    const db = await database();
    const { data: { user } } = await db.auth.getUser();
    if (!user?.email_confirmed_at) return { error: 'Sign in with a verified email address to book.' };
    const room = String(form.get('room') || '');
    const checkIn = dateOnly(form.get('checkIn')); const checkOut = dateOnly(form.get('checkOut'));
    const guests = validGuests(form.get('guests')); const code = currency(form.get('currency'));
    const reviewed = JSON.parse(String(form.get('reviewed') || '{}'));
    const { data, error } = await db.rpc('confirm_booking', {
      p_request: String(form.get('requestId') || ''), p_room: room, p_in: checkIn, p_out: checkOut,
      p_guests: guests, p_currency: code, p_reviewed: reviewed,
      p_name: String(form.get('name') || '').trim(), p_email: String(form.get('email') || '').trim(),
    });
    if (error) {
      if (error.message.includes('QUOTE_CHANGED')) {
        const fresh = await db.rpc('stay_quote', { p_room: room, p_in: checkIn, p_out: checkOut, p_guests: guests, p_currency: code });
        return { error: 'The price or exchange rate changed. Review the updated total, then confirm again.', quote: fresh.error ? undefined : fresh.data as Quote };
      }
      const messages: Record<string, string> = { ROOM_UNAVAILABLE: 'That room just became unavailable. Try another room or different dates.', TOO_MANY_BOOKINGS: 'Too many bookings. Please wait ten minutes.', INVALID_CONTACT: 'Enter a valid name and email address.', INVALID_STAY: 'Check your stay dates and guest count.', VERIFY_EMAIL_REQUIRED: 'Verify your account email before booking.', REQUEST_CONFLICT: 'This attempt was already used. Open your booking history before starting a new reservation.' };
      return { error: Object.entries(messages).find(([code]) => error.message.includes(code))?.[1] || 'The booking could not be confirmed. No payment was taken. Check your history before retrying.' };
    }
    bookingId = String(data);
  } catch { return { error: 'The booking could not be confirmed. Check your history before retrying. No payment was taken.' }; }
  after(async () => { try { await deliverNotifications(); } catch { console.warn('Demo email delivery is delayed.'); } });
  revalidatePath('/bookings');
  redirect(`/bookings/${bookingId}?new=1`);
}

export async function cancelReservation(form: FormData) {
  await checkOrigin();
  const id = String(form.get('id') || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect('/bookings');
  const { error } = await (await database()).rpc('cancel_booking', { p_booking: id });
  if (error) redirect(`/bookings/${id}?error=${error.message.includes('CANCELLATION_CLOSED') ? 'deadline' : 'cancel'}`);
  after(async () => { try { await deliverNotifications(); } catch { console.warn('Demo email delivery is delayed.'); } });
  revalidatePath('/bookings'); revalidatePath(`/bookings/${id}`);
  redirect(`/bookings/${id}`);
}
