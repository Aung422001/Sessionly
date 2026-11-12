# Proposal

## Why

Sessionly needs a complete hotel-booking portfolio experience for budget travelers exploring Southeast Asia, with clear full-stay prices and easy comparison. A clearly labeled fictional catalog and simulated payments let visitors exercise realistic reservations without implying that real hotel rooms have been reserved.

## What Changes

- Provide a mobile-friendly, English, photo-led hotel search and booking experience for Bangkok, Chiang Mai, Hanoi, Siem Reap, Kuala Lumpur, Singapore, Jakarta, Yangon, Mandalay, Taunggyi, and Kalaw. The four Myanmar (Burma) destinations use Asia/Yangon local time.
- Search by destination, stay dates, and guest count; filter by price, rating, and amenities; sort by full-stay price using consistent hotel cards.
- Seed fictional hotels and room types with nightly USD prices, guest limits, photos, amenities, and date-based room inventory. One booking reserves one room.
- Allow public browsing, verified email/password accounts, authenticated booking, private booking history, and cancellation with restored inventory. Date changes require cancellation and rebooking.
- Simulate payment without collecting payment credentials or charging money. Persist a booking reference, room, guest details, dates, price breakdown, cancellation terms, and confirmation.
- Convert USD prices into THB, VND, KHR, MYR, SGD, and IDR using daily live exchange-rate updates. Show rate timestamps, fall back to saved rates and then USD, and preserve each booking's selected currency, rate, and total.
- Send clearly labeled demo booking and cancellation emails to the customer's verified address, alongside in-app confirmations. Email failure must not undo a committed reservation.
- Allow free cancellation strictly before the hotel's local check-in time on arrival day; show the terms before confirmation and preserve them with the booking.
- Defer real reservations and payments, actual currency exchange, supplier integration, hotel-owner dashboards, multiple-room bookings, translations, and a separate side-by-side comparison page.

## Capabilities

### New Capabilities

- `hotel-discovery`: Destination catalog, hotel and room details, search, comparison, filters, sorting, responsive presentation, and demo disclosures.
- `customer-accounts`: Verified email/password sign-in and isolation of customers' bookings and contact details.
- `hotel-reservations`: One-room demo booking, simulated checkout, inventory consistency, booking history, and cancellation.
- `currency-pricing`: USD-based stay pricing, supported display currencies, exchange-rate refresh and fallback, and immutable booking price snapshots.
- `booking-notifications`: In-app confirmations and clearly labeled transactional demo emails independent of booking success.

### Modified Capabilities

None. The initialized project has no existing capability specs or application implementation.

## Impact

This is a greenfield application proposal. The agreed stack is Next.js, TypeScript, Tailwind CSS, Supabase Auth/Postgres, and Resend. Implementation will introduce customer-facing pages, server-side reservation and pricing operations, database migrations and seed data, authorization rules, exchange-rate retrieval, transactional email delivery, and focused automated checks. External credentials, an email sending identity, an exchange-rate source, and hosting configuration will be needed; no accounts, paid services, deployment, real hotel connections, or application code are created by this proposal.
