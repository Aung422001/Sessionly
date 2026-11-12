import Link from 'next/link';
import { catalog, hotelRooms, quote } from '@/lib/data';
import { configured } from '@/lib/supabase';
import { destinations } from '@/lib/catalog';
import { readStay, text, type Query, stayParams } from '@/lib/stay';
import { SearchForm, HotelCard, DemoNotice, SetupNotice } from '@/components/ui';

export const metadata = { title: 'Find your stay' };

export default async function Stays({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  let stay;
  try { stay = readStay(params); } catch (error) { return <div className="wrap section"><h1>Let’s check those dates.</h1><p role="alert">{error instanceof Error ? error.message : 'Check your search.'}</p><Link className="button" href="/stays">Start a new search ↗</Link></div>; }
  const destination = destinations.find(d => d.id === stay.city)!;
  const candidates = (await catalog()).filter(h => h.city === stay.city);
  const listed = await Promise.all(candidates.map(async hotel => {
    const roomTypes = (await hotelRooms(hotel.id)).filter(r => r.capacity >= stay.guests);
    const quotes = await Promise.all(roomTypes.map(r => quote(r, stay)));
    const eligible = quotes.filter(q => !configured() || q.available).sort((a, b) => Number(a.total) - Number(b.total));
    return { hotel, price: eligible[0] };
  }));
  const minimum = text(params.min); const maximum = text(params.max); const rating = text(params.rating); const amenity = text(params.amenity);
  const valid = [minimum, maximum, rating].every(v => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number.isFinite(Number(v))));
  const results = valid ? listed.filter(item => item.price && (!minimum || Number(item.price.total) >= Number(minimum)) && (!maximum || Number(item.price.total) <= Number(maximum)) && (!rating || Number(item.hotel.rating) >= Number(rating)) && (!amenity || item.hotel.amenities.includes(amenity))) : [];
  results.sort((a, b) => text(params.sort) === 'price-desc' ? Number(b.price.total) - Number(a.price.total) : Number(a.price.total) - Number(b.price.total));
  return <div className="wrap section"><SearchForm stay={stay} compact /><DemoNotice />{!configured() && <SetupNotice />}
    <div className="section-heading results-heading"><div><p className="eyebrow">{destination.country} / {stay.checkIn} — {stay.checkOut}</p><h1>Make yourself at home<br />in <em>{destination.name}.</em></h1><p className="muted">{results.length} fictional stays · {stay.guests} guests · 1 room · Full stay totals</p></div><span className="editorial-note">A good place changes<br />the whole journey.</span></div>
    <div className="results-layout"><aside className="filters panel"><h2>Your kind of stay.</h2><form action="/stays">{Array.from(stayParams(stay)).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
      <label>Minimum stay total ({listed.find(i => i.price)?.price.currency || 'USD'})<input name="min" type="number" min="0" step="0.01" defaultValue={minimum} placeholder="Any" /></label>
      <label>Maximum stay total<input name="max" type="number" min="0" step="0.01" defaultValue={maximum} placeholder="Any" /></label>
      <label>Demo rating<select name="rating" defaultValue={rating}><option value="">Any rating</option><option value="4.5">4.5 and up</option><option value="4.7">4.7 and up</option></select></label>
      <label>Amenities<select name="amenity" defaultValue={amenity}><option value="">Any amenities</option>{['Wi-Fi', 'Air conditioning', 'Breakfast', 'Garden', 'Workspace'].map(a => <option key={a}>{a}</option>)}</select></label>
      <label>Sort by<select name="sort" defaultValue={text(params.sort)}><option value="price-asc">Total price: low to high</option><option value="price-desc">Total price: high to low</option></select></label>
      <button className="button full">Apply filters</button><Link className="text-button" href={`/stays?${stayParams(stay)}`}>Reset filters</Link>
    </form><p className="fineprint">All properties and ratings are fictional. Photographs are illustrative.</p></aside>
    <div>{results.length ? <div className="results-grid">{results.map(({ hotel, price }) => <HotelCard key={hotel.id} hotel={hotel} price={price} stay={stay} />)}</div> : <div className="empty-state"><h2>A different date, perhaps?</h2><p>{valid ? 'No rooms match all your dates and filters. Try changing the dates, guest count, or filters.' : 'Enter valid nonnegative price filters.'}</p></div>}</div></div>
  </div>;
}
