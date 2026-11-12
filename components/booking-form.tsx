'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { reserve, type ReserveState } from '@/app/actions';
import { PriceBreakdown } from './ui';
import type { Quote, Stay } from '@/lib/domain';

function ConfirmButton() {
  const { pending } = useFormStatus();
  return <button className="button full" disabled={pending}>{pending ? 'Confirming your demo stay…' : 'Confirm demo booking ↗'}</button>;
}

export default function BookingForm({ price, stay, room, requestId, email, terms }: { price: Quote; stay: Stay; room: string; requestId: string; email: string; terms: string }) {
  const [state, action] = useActionState<ReserveState, FormData>(reserve, { error: '' });
  const current = state.quote || price;
  const reviewed = { currency: current.currency, total: current.total, rate: current.rate, rate_id: current.rate_id };
  return <form action={action} className="checkout-form">
    <section className="panel"><h2>Your details</h2><p className="muted">Booking emails go to your verified account address: {email}</p>
      <label>Guest full name<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label>Contact email<input name="email" type="email" autoComplete="email" maxLength={254} defaultValue={email} required /></label>
    </section>
    <section className="panel"><h2>Your stay, clearly priced.</h2><PriceBreakdown price={current} /><div className="terms">{terms}</div>
      <label className="checkbox"><input type="checkbox" name="accept" required /> I understand this is a demo and accept the cancellation terms.</label>
      <input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="room" value={room} />
      <input type="hidden" name="checkIn" value={stay.checkIn} /><input type="hidden" name="checkOut" value={stay.checkOut} />
      <input type="hidden" name="guests" value={stay.guests} /><input type="hidden" name="currency" value={current.currency} />
      <input type="hidden" name="reviewed" value={JSON.stringify(reviewed)} />
      {state.error && <p className="error-message" role="alert">{state.error}</p>}
      <ConfirmButton /><p className="fineprint">Simulated checkout. No card details collected. No money charged.</p>
    </section>
  </form>;
}
