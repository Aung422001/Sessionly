import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { catalog, hotelRooms, quote } from '@/lib/data';
import { configured, currentUser } from '@/lib/supabase';
import { readStay, stayParams, text, type Query } from '@/lib/stay';
import { Photo, DemoNotice, SetupNotice, PriceBreakdown } from '@/components/ui';
import BookingForm from '@/components/booking-form';

export const metadata = { title: 'Your demo booking' };

export default async function Checkout({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const hotel = (await catalog()).find(h => h.id === text(params.hotel));
  if (!hotel) notFound();
  const room = (await hotelRooms(hotel.id)).find(r => r.id === text(params.room));
  if (!room) notFound();
  let stay;
  try { stay = readStay({ ...params, city: hotel.city }); }
  catch { return <div className="wrap section"><h1>Choose valid stay dates.</h1><Link href={`/hotels/${hotel.id}`}>Return to the hotel</Link></div>; }
  const next = `/checkout?hotel=${hotel.id}&room=${room.id}&${stayParams(stay)}`;
  const user = await currentUser();
  if (configured() && !user) redirect(`/auth?next=${encodeURIComponent(next)}`);
  const price = await quote(room, stay);
  const terms = `Free cancellation strictly before ${stay.checkIn} at ${hotel.check_in_time} (${hotel.timezone}). Date changes require cancellation and rebooking.`;
  return <div className="wrap section narrow"><Link className="back-link" href={`/hotels/${hotel.id}?${stayParams(stay)}`}>← Back to your room</Link><p className="eyebrow">ONE LITTLE ESCAPE, COMING UP</p><h1>Make it <em>yours.</em></h1><DemoNotice />
    <div className="checkout-summary panel"><Photo src={hotel.photo} alt={`Illustrative photo for ${hotel.name}`} /><div><h2>{hotel.name}</h2><p>{room.name} · {hotel.city_name}</p><p>{stay.checkIn} — {stay.checkOut} · {stay.guests} guests · 1 room</p><span className="badge">Simulated payment only</span></div></div>
    {!configured() ? <><SetupNotice /><section className="panel"><h2>Preview price</h2><PriceBreakdown price={price} /><p>{terms}</p><p>Booking is disabled until the database and verified accounts are configured.</p></section></> : !user?.email_confirmed_at ? <div className="notice"><h2>Verify your email first.</h2><p>Open your verification email, then return here to book.</p><Link href="/auth">Back to account sign-in</Link></div> : !price.available ? <div className="notice"><h2>This room is unavailable for those dates.</h2><Link href={`/hotels/${hotel.id}`}>Choose a new stay</Link></div> : <BookingForm price={price} stay={stay} room={room.id} requestId={randomUUID()} email={user.email || ''} terms={terms} />}
  </div>;
}
