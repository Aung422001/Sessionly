import type { Metadata } from 'next';
import Link from 'next/link';
import { currentUser } from '@/lib/supabase';
import { signOut } from './actions';
import { destinations } from '@/lib/catalog';
import './globals.css';

export const metadata: Metadata = { title: { default: 'Sessionly — a little farther, a lot more feeling', template: '%s · Sessionly' }, description: `Discover thoughtful fictional stays across ${destinations.length} Southeast Asian cities. A hotel-booking portfolio demonstration.` };
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return <html lang="en"><body><a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><Link className="brand" href="/" aria-label="Sessionly home"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 24V10l11-6 11 6v14l-11 5-11-5Z" stroke="currentColor" strokeWidth="1.5"/><path d="m5 10 11 6 11-6M16 16v13M11 7l11 6v13" stroke="currentColor" strokeWidth="1.5"/></svg>sessionly<span className="brand-dot">.</span></Link>
      <nav aria-label="Main navigation"><Link href="/stays">Explore stays</Link><Link href="/bookings">My bookings</Link>{user ? <form action={signOut}><button className="text-button">Sign out</button></form> : <Link className="nav-signin" href="/auth">Sign in <span aria-hidden="true">↗</span></Link>}</nav>
    </header>
    <main id="main">{children}</main>
    <footer className="site-footer"><Link className="brand" href="/">sessionly.</Link><p>Small stays. Memorable places.<br /><span>Portfolio demo — no real reservations or payments.</span></p><a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates by ExchangeRate-API ↗</a></footer>
  </body></html>;
}
