import type { Quote } from './domain.ts';
import { money } from './domain.ts';

export type EmailEvent = {
  id: string; lease: string; kind: 'booking' | 'cancellation'; recipient: string;
  payload: { reference: string; check_in: string; check_out: string; guests: number; quote: Quote;
    snapshot: { hotel: string; room: string; terms: string } };
};

export function notificationText(event: EmailEvent) {
  const p = event.payload;
  return {
    subject: `Sessionly demo ${event.kind === 'booking' ? 'booking confirmation' : 'cancellation'} — no real reservation`,
    text: [
      'DEMO BOOKING — no real reservation or payment.',
      event.kind === 'booking' ? 'Your demo stay is confirmed.' : 'Your demo booking is cancelled. No real refund transaction occurred.',
      `Reference: ${p.reference}`, `${p.snapshot.hotel} · ${p.snapshot.room}`,
      `${p.check_in} to ${p.check_out} · ${p.guests} guests · one room`,
      `Accommodation: ${money(p.quote.subtotal, p.quote.currency)}`,
      `Demo fee: ${money(p.quote.fee, p.quote.currency)}`,
      `Saved total: ${money(p.quote.total, p.quote.currency)}`,
      `Saved rate: 1 USD = ${p.quote.rate} ${p.quote.currency}${p.quote.rate_at ? ` (${p.quote.rate_at})` : ''}`,
      p.snapshot.terms,
      'This message is from a portfolio demonstration. It does not reserve a real hotel room.',
    ].join('\n\n'),
  };
}
