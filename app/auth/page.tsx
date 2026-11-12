import Link from 'next/link';
import { safeNext } from '@/lib/domain';
import { text, type Query } from '@/lib/stay';
import { configured } from '@/lib/supabase';
import { authenticate } from '@/app/actions';
import { Photo, DemoNotice, SetupNotice } from '@/components/ui';
import { photoUrl } from '@/lib/catalog';

export const metadata = { title: 'Welcome back' };

export default async function Auth({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  return <div className="auth-layout wrap section"><div><Photo src={photoUrl('photo-1566073771259-6a8506099945')} alt="Illustrative courtyard hotel with a pool" /><div className="auth-photo-caption"><p className="eyebrow">GOOD PLACES. GOOD COMPANY.</p><h2>Your next chapter<br />starts with a stay.</h2></div></div><section className="auth-panel"><p className="eyebrow">YOUR SESSIONLY ACCOUNT</p><h1>A familiar<br /><em>little hello.</em></h1><p className="muted">Sign in to book, revisit your stays, and make room for what’s next.</p><DemoNotice />{!configured() ? <SetupNotice /> : <form action={authenticate} className="panel"><input type="hidden" name="next" value={safeNext(text(params.next))} />
    <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" minLength={12} maxLength={128} required /></label>
    <p className="fineprint">Use 12–128 characters. New accounts must verify their email before booking.</p>
    {params.error && <p className="error-message" role="alert">{params.error === 'verification' ? 'That verification link is invalid or expired. Try signing in or request a new verification email through your account provider.' : 'We could not complete that request. Check your details and email verification, or wait a moment before retrying.'}</p>}
    {params.notice === 'verify' && <p className="notice" role="status">If registration succeeded, check your inbox to verify your email. Existing account? Sign in below.</p>}
    <button name="mode" value="signin" className="button full">Sign in ↗</button><button name="mode" value="signup" className="button secondary full">Create a demo account</button>
    </form>}<Link href="/stays" className="underlined">Keep exploring without an account ↗</Link></section></div>;
}
