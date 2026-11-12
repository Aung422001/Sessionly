import { writeFileSync } from 'node:fs';
import { hotels, rooms } from '../lib/catalog.ts';

const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const sql = ['-- Generated from lib/catalog.ts. Re-running adds missing records without replacing bookings or stock.', 'begin;'];
for (const hotel of hotels) {
  sql.push(`insert into public.hotels(id,city,city_name,country,name,description,photo,amenities,rating,timezone,check_in_time) values (${[hotel.id, hotel.city, hotel.city_name, hotel.country, hotel.name, hotel.description, hotel.photo].map(literal).join(',')},array[${hotel.amenities.map(literal).join(',')}],${hotel.rating},${literal(hotel.timezone)},'14:00') on conflict(id) do nothing;`);
}
for (const room of rooms) sql.push(`insert into public.room_types(id,hotel_id,name,capacity,nightly_cents,fee_cents) values (${[room.id, room.hotel_id, room.name].map(literal).join(',')},${room.capacity},${room.nightly_cents},${room.fee_cents}) on conflict(id) do nothing;`);
sql.push("insert into public.room_inventory(room_id,night,total) select r.id,d::date,4 from public.room_types r cross join generate_series(current_date,current_date+365,interval '1 day') d on conflict(room_id,night) do nothing;", 'commit;', '');
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql.join('\n'));
console.log(`Generated non-destructive seed: ${hotels.length} hotels, ${rooms.length} room types, 366 calendar dates.`);
