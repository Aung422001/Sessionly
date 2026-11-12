import Link from 'next/link';
import { destinations, photoUrl, rooms } from '@/lib/catalog';
import { defaultDates, previewQuote } from '@/lib/domain';
import { catalog } from '@/lib/data';
import { configured } from '@/lib/supabase';
import { SearchForm, Photo, HotelCard, DemoNotice, SetupNotice, Arrow } from '@/components/ui';

export default async function Home() {
  const stay = { ...defaultDates(), city: 'bangkok', guests: 2, currency: 'USD' as const };
  const hotels = await catalog();
  return <>
    <section className="hero wrap"><div className="hero-copy"><p className="eyebrow">SOUTHEAST ASIA / YOUR NEXT CHAPTER</p><h1>Find your next<br /><em>little escape.</em></h1><p className="hero-description">Thoughtful stays. Honest prices.<br />More room for the good kind of getting lost.</p><div className="hero-footnote"><span className="tiny-star" aria-hidden="true">✳</span><span>{destinations.length} cities, a thousand little stories.<br /><strong>Let’s find the start of yours.</strong></span></div></div>
      <div className="hero-image"><Photo priority src={photoUrl('photo-1508009603885-50cf7c579365', 1800)} alt="Golden temple rooftops and Bangkok cityscape at dusk" /><div className="photo-caption"><span>01 / BANGKOK, THAILAND</span><span>Take the scenic route. ↗</span></div><span className="hero-stamp">STAY<br />CURIOUS</span></div>
    </section>
    <div className="search-wrap wrap"><SearchForm stay={stay} /><DemoNotice /></div>
    {!configured() && <div className="wrap"><SetupNotice /></div>}
    <section className="section wrap"><div className="section-heading"><div><p className="eyebrow">{destinations.length} CITIES. MANY STORIES.</p><h2>Follow your curiosity.</h2></div><p>From a quiet courtyard to a city that never sleeps.<br />Find a place that feels a little like you.</p></div>
      <div className="destination-grid">{destinations.map((d, i) => <Link key={d.id} href={`/stays?city=${d.id}`} className="destination-card"><Photo src={photoUrl(d.photo, 600)} alt={`Travel photograph of ${d.name}`} /><div><small>{String(i + 1).padStart(2, '0')} / {d.country}</small><h3>{d.name} <Arrow /></h3><p>{d.caption}</p></div></Link>)}</div>
    </section>
    <section className="section featured-section"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">GOOD FINDS, LITTLE PRICES</p><h2>Stays worth settling into.</h2></div><Link className="underlined" href="/stays">Explore all stays <Arrow /></Link></div><div className="hotel-grid">{hotels.slice(0, 3).map(h => { const r = rooms.find(r => r.hotel_id === h.id); const sample = r || { id: '', nightly_cents: h.nightly_cents, fee_cents: 500 }; return <HotelCard key={h.id} hotel={h} stay={{ ...stay, city: h.city }} price={previewQuote(sample, stay.checkIn, stay.checkOut)} />; })}</div></div></section>
    <section className="manifesto wrap"><p className="eyebrow">LESS GUESSWORK. MORE GOING.</p><h2>A little farther,<br /><em>a lot more feeling.</em></h2><div className="promise-grid"><div><span>01 /</span><h3>The whole price. Always.</h3><p>Nightly rates, demo fees, and your full stay total. Clear before you confirm.</p></div><div><span>02 /</span><h3>Your currency, your pace.</h3><p>Browse in USD or six local currencies, with a visible exchange-rate timestamp.</p></div><div><span>03 /</span><h3>Plans can change.</h3><p>Free demo cancellation before your hotel’s local check-in time. Simple.</p></div></div></section>
  </>;
}
