export const currencies = ['USD', 'THB', 'VND', 'KHR', 'MYR', 'SGD', 'IDR'] as const;
export type Currency = typeof currencies[number];
export type Stay = { city: string; checkIn: string; checkOut: string; guests: number; currency: Currency };
export type Quote = {
  room_id: string; currency: Currency; nights: number; nightly: string; subtotal: string;
  fee: string; total: string; usd_total: string; rate: string; rate_id: string | null;
  rate_at: string | null; fallback: boolean; deadline: string; timezone: string;
  available: boolean;
};
export type Booking = {
  id: string; status: 'confirmed' | 'cancelled'; check_in: string; check_out: string;
  guests: number; created_at: string; deadline: string; quote: Quote;
  snapshot: { hotel: string; room: string; city: string; photo: string; timezone: string; terms: string };
};

export function currency(value: unknown): Currency {
  return typeof value === 'string' && currencies.includes(value as Currency) ? value as Currency : 'USD';
}

export function safeNext(value: unknown): string {
  if (typeof value !== 'string' || !/^\/(?!\/)/.test(value) || /[\\\u0000-\u0020]/.test(value)) return '/bookings';
  const url = new URL(value, 'https://sessionly.invalid');
  return url.origin === 'https://sessionly.invalid' ? `${url.pathname}${url.search}` : '/bookings';
}

export function dateOnly(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Choose valid stay dates.');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Choose valid stay dates.');
  return value;
}

export function nights(checkIn: string, checkOut: string): number {
  const count = (Date.parse(`${dateOnly(checkOut)}T00:00:00Z`) - Date.parse(`${dateOnly(checkIn)}T00:00:00Z`)) / 86400000;
  if (count < 1 || count > 30) throw new Error('Choose a stay of 1 to 30 nights.');
  return count;
}

export function localToday(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validGuests(value: unknown): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 3) throw new Error('Choose 1 to 3 guests for one room.');
  return number;
}

export function defaultDates(): { checkIn: string; checkOut: string } {
  const start = new Date(); start.setUTCDate(start.getUTCDate() + 7);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 3);
  return { checkIn: start.toISOString().slice(0, 10), checkOut: end.toISOString().slice(0, 10) };
}

export function money(amount: string | number, code: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency(code), currencyDisplay: 'code', maximumFractionDigits: code === 'VND' ? 0 : 2 }).format(Number(amount));
}

export function validateRates(value: unknown, now = Date.now()) {
  if (!value || typeof value !== 'object') throw new Error('Invalid exchange-rate response.');
  const data = value as Record<string, unknown>;
  const stamp = Number(data.time_last_update_unix) * 1000;
  if (data.result !== 'success' || data.base_code !== 'USD' || !Number.isSafeInteger(stamp) || stamp <= 0 || stamp > now + 300000 || now - stamp > 7 * 86400000) throw new Error('Invalid exchange-rate timestamp or base.');
  if (!data.rates || typeof data.rates !== 'object') throw new Error('Missing exchange rates.');
  const rates = data.rates as Record<string, unknown>;
  const selected: Record<string, string> = {};
  for (const code of currencies) {
    const rate = rates[code];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || rate > 100000000 || (code === 'USD' && rate !== 1)) throw new Error(`Invalid ${code} exchange rate.`);
    selected[code] = String(rate);
  }
  return { rates: selected, source_at: new Date(stamp).toISOString() };
}

export function previewQuote(room: { id: string; nightly_cents: number; fee_cents: number }, checkIn: string, checkOut: string): Quote {
  const count = nights(checkIn, checkOut);
  const decimal = (cents: bigint) => `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
  const subtotal = BigInt(room.nightly_cents) * BigInt(count);
  return { room_id: room.id, currency: 'USD', nights: count, nightly: decimal(BigInt(room.nightly_cents)), subtotal: decimal(subtotal), fee: decimal(BigInt(room.fee_cents)), total: decimal(subtotal + BigInt(room.fee_cents)), usd_total: decimal(subtotal + BigInt(room.fee_cents)), rate: '1', rate_id: null, rate_at: null, fallback: true, deadline: '', timezone: '', available: false };
}
