import Link from 'next/link';
import { redirect } from 'next/navigation';
import { database, configured, currentUser } from '@/lib/supabase';
import { money, type Booking } from '@/lib/domain';
import { DemoNotice, Photo, SetupNotice } from '@/components/ui';

export const metadata = { title: 'Your bookings' };

export default async function Bookings() {
  if (!configured()) return <div className="wrap section"><h1>Your little escapes.</h1><SetupNotice /><Link className="button" href="/stays">Explore stays ↗</Link></div>;
  const user = await currentUser();
  if (!user) redirect('/auth?next=/bookings');
  const { data, error } = await (await database()).from('bookings').select('id,status,check_in,check_out,guests,created_at,deadline,quote,snapshot').order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error('Booking history is unavailable. Please retry.');
  const bookings = data as Booking[];
  return <div className="wrap section"><p className="eyebrow">YOUR OWN LITTLE TRAVEL JOURNAL</p><h1>Your little <em>escapes.</em></h1><DemoNotice />{bookings.length ? <div className="bookings-grid">{bookings.map(b => <article key={b.id} className="panel booking-card"><Photo src={b.snapshot.photo} alt={`Illustrative photo for ${b.snapshot.hotel}`} /><div><span className={`badge ${b.status === 'cancelled' ? 'neutral' : ''}`}>{b.status === 'confirmed' ? 'Demo confirmed' : 'Demo cancelled'}</span><h2>{b.snapshot.hotel}</h2><p>{b.snapshot.room} · {b.guests} guests</p><p>{b.check_in} — {b.check_out}</p><strong>{money(b.quote.total, b.quote.currency)} saved total</strong><Link className="underlined" href={`/bookings/${b.id}`}>View booking ↗</Link></div></article>)}</div> : <div className="empty-state"><h2>Your next story is still unwritten.</h2><p>Choose a place, find a room, and try a demo booking.</p><Link className="button" href="/stays">Find a stay ↗</Link></div>}</div>;
}
