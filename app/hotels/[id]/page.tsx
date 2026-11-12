import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalog, hotelRooms, quote } from '@/lib/data';
import { configured } from '@/lib/supabase';
import { readStay, stayParams, type Query } from '@/lib/stay';
import { Photo, PriceBreakdown, DemoNotice, SetupNotice, SearchForm } from '@/components/ui';

export default async function HotelDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const { id } = await params;
  const property = (await catalog()).find(h => h.id === id);
  if (!property) notFound();
  let stay;
  try { stay = readStay({ ...await searchParams, city: property.city }, property.city); }
  catch (error) { return <div className="wrap section"><h1>Check your stay details.</h1><p>{error instanceof Error ? error.message : 'Invalid stay.'}</p><Link href={`/hotels/${id}`}>Choose new dates</Link></div>; }
  const options = (await hotelRooms(id)).filter(room => room.capacity >= stay.guests);
  const priced = await Promise.all(options.map(async room => ({ room, price: await quote(room, stay) })));
  return <div className="wrap section"><SearchForm stay={stay} compact /><DemoNotice />{!configured() && <SetupNotice />}
    <Link className="back-link" href={`/stays?${stayParams(stay)}`}>← Back to {property.city_name} stays</Link>
    <div className="hotel-title"><div><p className="eyebrow">FICTIONAL STAY / {property.city_name}, {property.country}</p><h1>{property.name}</h1></div><span className="rating">★ {property.rating} <small>demo rating</small></span></div>
    <Photo className="hotel-gallery" src={property.photo} alt={`Illustrative photograph for fictional ${property.name}`} priority />
    <div className="detail-layout"><section><p className="eyebrow">A SMALL PLACE WITH A LITTLE SOUL</p><h2>Come for the city.<br /><em>Stay for the feeling.</em></h2><p className="description">{property.description}</p><div className="amenity-tags">{property.amenities.map(a => <span key={a}>✓ {a}</span>)}</div><div className="property-info"><h3>Good to know</h3><p>Local check-in: {property.check_in_time} ({property.timezone})</p><p>Free cancellation strictly before local check-in on arrival day. To change dates, cancel and book again.</p><p>One room per booking. All ratings and hotel details are fictional demonstration data.</p></div></section>
      <aside><p className="eyebrow">YOUR ROOM, YOUR PACE</p><h2>A little room to unwind.</h2>{priced.length ? priced.map(({ room, price }) => <article key={room.id} className="panel room-card"><div className="room-heading"><h3>{room.name}</h3><span className="badge">Up to {room.capacity} guests</span></div><PriceBreakdown price={price} /><Link className="button full" href={`/checkout?hotel=${id}&room=${room.id}&${stayParams(stay)}`}>{!configured() ? 'Preview your stay' : price.available ? 'Choose this room ↗' : 'View unavailable dates'}</Link></article>) : <p>No room fits your guest count. Try fewer guests.</p>}</aside>
    </div>
  </div>;
}
