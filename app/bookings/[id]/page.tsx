import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { database, configured, currentUser } from '@/lib/supabase';
import type { Booking } from '@/lib/domain';
import { DemoNotice, Photo, PriceBreakdown } from '@/components/ui';
import { cancelReservation } from '@/app/actions';
import type { Query } from '@/lib/stay';

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const { id } = await params;
  if (!configured()) redirect('/bookings');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  if (!await currentUser()) redirect(`/auth?next=${encodeURIComponent(`/bookings/${id}`)}`);
  const db = await database();
  const { data, error } = await db.from('bookings').select('id,status,check_in,check_out,guests,created_at,deadline,quote,snapshot').eq('id', id).maybeSingle();
  if (error) throw new Error('This booking could not be loaded.');
  if (!data) notFound();
  const b = data as Booking;
  const { data: delivery } = await db.from('booking_notifications').select('kind,status').eq('booking_id', id);
  const relevant = delivery?.find(e => e.kind === (b.status === 'cancelled' ? 'cancellation' : 'booking'));
  const query = await searchParams;
  // eslint-disable-next-line react-hooks/purity -- This dynamic server view only previews eligibility; Postgres authorizes cancellation.
  const canCancel = b.status === 'confirmed' && Date.now() < Date.parse(b.deadline);
  return <div className="wrap section narrow"><Link href="/bookings" className="back-link">← Your bookings</Link><p className="eyebrow">A LITTLE ESCAPE / {b.snapshot.city}</p><h1>{b.status === 'cancelled' ? 'Plans changed.' : 'You’re all set.'}<br /><em>{b.status === 'cancelled' ? 'Another story awaits.' : 'Let the story begin.'}</em></h1><DemoNotice />
    <section className="panel booking-confirmation"><span className={`badge ${b.status === 'cancelled' ? 'neutral' : ''}`}>Demo {b.status}</span><p className="reference">Reference: {b.id}</p><Photo src={b.snapshot.photo} alt={`Illustrative photo for fictional ${b.snapshot.hotel}`} /><h2>{b.snapshot.hotel}</h2><p>{b.snapshot.room} · {b.guests} guests · 1 room</p><p>{b.check_in} — {b.check_out}</p><PriceBreakdown price={b.quote} />
      <p className="terms">{b.snapshot.terms}</p><p className="notice" role="status">{relevant?.status === 'sent' ? 'Demo confirmation email sent to your verified account address.' : 'Your booking status is saved. Demo email delivery is pending or delayed; this does not affect your booking.'}</p>
      {query.error && <p className="error-message" role="alert">{query.error === 'deadline' ? 'The hotel-local check-in deadline has passed. Cancellation is closed.' : 'Cancellation could not be completed. Please retry.'}</p>}
      {canCancel ? <form action={cancelReservation}><input type="hidden" name="id" value={id} /><button className="button danger">Cancel demo booking</button><p className="fineprint">Cancellation restores the demo room inventory. No fee is charged.</p></form> : <p className="muted">{b.status === 'cancelled' ? 'Your demo booking is cancelled. No actual refund transaction occurred.' : 'Cancellation is closed because the hotel-local check-in deadline has passed.'}</p>}
      <Link className="underlined" href="/stays">Find another little escape ↗</Link>
    </section></div>;
}
