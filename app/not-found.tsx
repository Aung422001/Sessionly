import Link from 'next/link';
export default function NotFound() { return <div className="wrap section"><p className="eyebrow">OFF THE MAP</p><h1>This little place<br /><em>isn’t here.</em></h1><p>The page is unavailable or does not belong to your account.</p><Link className="button" href="/stays">Explore stays ↗</Link></div>; }
