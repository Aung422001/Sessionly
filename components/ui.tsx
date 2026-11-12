import Image from 'next/image';
import Link from 'next/link';
import { destinations, type Hotel } from '@/lib/catalog';
import { currencies, money, type Stay, type Quote } from '@/lib/domain';
import { stayParams } from '@/lib/stay';

export function Arrow() { return <span aria-hidden="true">↗</span>; }
export function DemoNotice() { return <p className="demo-note"><span aria-hidden="true">◇</span> Portfolio demo · Fictional hotels · No real reservation or payment</p>; }
export function SetupNotice() { return <aside className="notice"><strong>You’re exploring the design preview.</strong> Hotel prices are illustrative USD prices. Connect Supabase using the README to enable verified accounts, date-based inventory, live conversion, and bookings.</aside>; }
export function Photo({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return <div className={`photo ${className}`}><Image src={src} alt={alt} fill sizes="(max-width: 700px) 100vw, 55vw" unoptimized priority={priority} /></div>;
}

export function SearchForm({ stay, compact = false }: { stay: Stay; compact?: boolean }) {
  return <form action="/stays" className={`search-form ${compact ? 'compact' : ''}`}>
    <label>Where to?<select name="city" defaultValue={stay.city}>{destinations.map(d => <option key={d.id} value={d.id}>{d.name}, {d.country}</option>)}</select></label>
    <label>Check-in<input type="date" name="checkIn" defaultValue={stay.checkIn} required /></label>
    <label>Check-out<input type="date" name="checkOut" defaultValue={stay.checkOut} required /></label>
    <label>Who’s coming?<select name="guests" defaultValue={stay.guests}><option value="1">1 guest · 1 room</option><option value="2">2 guests · 1 room</option><option value="3">3 guests · 1 room</option></select></label>
    <label>Currency<select name="currency" defaultValue={stay.currency}>{currencies.map(c => <option key={c}>{c}</option>)}</select></label>
    <button className="button">Find a stay <Arrow /></button>
  </form>;
}

export function HotelCard({ hotel, stay, price }: { hotel: Hotel; stay: Stay; price: Quote }) {
  return <article className="hotel-card">
    <Link href={`/hotels/${hotel.id}?${stayParams(stay)}`} className="card-photo-link" aria-label={`Explore ${hotel.name}`}><Photo src={hotel.photo} alt={`Illustrative accommodation photograph for fictional ${hotel.name}`} /></Link>
    <div className="card-content"><div className="card-topline"><span className="eyebrow">{hotel.city_name} / {hotel.country}</span><span className="rating">★ {hotel.rating}<small>demo rating</small></span></div>
      <h3><Link href={`/hotels/${hotel.id}?${stayParams(stay)}`}>{hotel.name}</Link></h3>
      <p className="muted amenities">{hotel.amenities.slice(0, 3).join(' · ')}</p>
      <div className="card-price"><span>{money(price.nightly, price.currency)}<small> / night</small></span><Link href={`/hotels/${hotel.id}?${stayParams(stay)}`}>{money(price.total, price.currency)}<small> / {price.nights} nights total</small> <Arrow /></Link></div>
      <small className="muted">Fictional property · {price.available ? 'Demo rooms available for your dates' : 'Preview price; availability not confirmed'}</small>
    </div>
  </article>;
}

export function PriceBreakdown({ price }: { price: Quote }) {
  return <div className="price-breakdown">
    <div><span>{money(price.nightly, price.currency)} / night · {price.nights} nights</span><strong>{money(price.subtotal, price.currency)}</strong></div>
    <div><span>Demo service fee</span><strong>{money(price.fee, price.currency)}</strong></div>
    <div className="price-total"><span>Full stay total</span><strong>{money(price.total, price.currency)}</strong></div>
    <p className="rate-note">1 USD = {price.rate} {price.currency}{price.rate_at && <> · Rate dated {new Date(price.rate_at).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</>}{price.fallback && <><br />{price.currency === 'USD' ? 'Conversion unavailable. Showing USD.' : 'Using the last saved rate.'}</>}</p>
    <small><a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates by ExchangeRate-API</a></small>
  </div>;
}
