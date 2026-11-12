'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="wrap section"><p className="eyebrow">A SMALL DETOUR</p><h1>Let’s try <em>that again.</em></h1><p role="alert">We couldn’t load this page. Your saved bookings remain in your account. If this is a new installation, check the database setup in the README.</p><button className="button" onClick={reset}>Try again ↗</button></div>;
}
