import 'server-only';
import { hotels, rooms, type Hotel, type Room } from './catalog.ts';
import { database, configured } from './supabase.ts';
import { previewQuote, type Stay, type Quote } from './domain.ts';

export async function catalog(): Promise<Hotel[]> {
  if (!configured()) return hotels;
  const db = await database();
  const { data, error } = await db.from('hotels').select('*, room_types(nightly_cents)').order('name');
  if (error) throw new Error('The hotel catalog could not be loaded. Check database setup.');
  return data.map(h => ({ ...h, rating: String(h.rating), nightly_cents: Math.min(...h.room_types.map((r: { nightly_cents: number }) => r.nightly_cents)) })) as Hotel[];
}

export async function hotelRooms(hotelId: string): Promise<Room[]> {
  if (!configured()) return rooms.filter(r => r.hotel_id === hotelId);
  const db = await database();
  const { data, error } = await db.from('room_types').select('*').eq('hotel_id', hotelId).order('nightly_cents');
  if (error) throw new Error('Rooms could not be loaded.');
  return data as Room[];
}

export async function quote(room: Room, stay: Stay): Promise<Quote> {
  if (!configured()) return previewQuote(room, stay.checkIn, stay.checkOut);
  const db = await database();
  const { data, error } = await db.rpc('stay_quote', { p_room: room.id, p_in: stay.checkIn, p_out: stay.checkOut, p_guests: stay.guests, p_currency: stay.currency });
  if (error) throw new Error(error.message.includes('INVALID_STAY') ? 'Choose valid future dates and a room that fits your guests.' : 'The stay price could not be loaded. Check database setup.');
  return data as Quote;
}
