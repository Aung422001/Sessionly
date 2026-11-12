import { currency, dateOnly, defaultDates, nights, validGuests, localToday, type Stay } from './domain.ts';
import { destinations } from './catalog.ts';

export type Query = Record<string, string | string[] | undefined>;
export const text = (value: Query[string]) => typeof value === 'string' ? value : '';

export function readStay(params: Query, fallbackCity = 'bangkok'): Stay {
  const defaults = defaultDates();
  const city = text(params.city) || fallbackCity;
  const destination = destinations.find(d => d.id === city);
  if (!destination) throw new Error('Choose one of our destinations.');
  const checkIn = dateOnly(text(params.checkIn) || defaults.checkIn);
  const checkOut = dateOnly(text(params.checkOut) || defaults.checkOut);
  nights(checkIn, checkOut);
  if (checkIn < localToday(destination.timezone)) throw new Error('Choose a check-in date that has not passed at your destination.');
  return { city, checkIn, checkOut, guests: validGuests(text(params.guests) || 2), currency: currency(text(params.currency)) };
}

export function stayParams(stay: Stay) {
  return new URLSearchParams({ city: stay.city, checkIn: stay.checkIn, checkOut: stay.checkOut, guests: String(stay.guests), currency: stay.currency });
}
