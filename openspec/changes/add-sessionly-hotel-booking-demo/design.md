# Design

## Context

See `proposal.md` for motivation and the five capability delta specs for behavior. Inspection found an initialized `spec-driven` OpenSpec project, generated workflow skills, and a local CLI installation. There is no application source, package manifest, test suite, existing database schema, or existing main capability spec to extend. This design is a greenfield proposal, not a description of implemented behavior.

The agreed stack is Next.js, TypeScript, Tailwind CSS, Supabase Auth/Postgres, and Resend. The user confirmed free cancellation strictly before local check-in during this proposal workflow. Real bookings and payments are a later product phase, not latent production functionality in this demo.

## Goals / Non-Goals

**Goals:**
- Keep one application deployment and one authoritative database for inventory, pricing, reservations, and delivery state.
- Make concurrency, ownership, money, and timezone rules explicit at the responsible boundary.
- Support a reviewable portfolio journey without real payment credentials or hotel supplier access.

**Non-Goals:**
- No separate API service, generalized payment gateway, supplier abstraction, admin application, or currency trading system.
- No deployment or external account provisioning as part of this planning change.
- No commitment that this schema can take real bookings without a separate production-readiness design.

## Decisions

### 1. One Next.js application with server-owned mutations

Use the App Router with TypeScript and Tailwind. Public discovery and hotel details read the seeded catalog; booking, cancellation, rates, and email secrets stay server-side. Use ordinary server functions/routes and the Supabase client directly where needed rather than introduce a separate API backend or repository/service wrappers. Tailwind and small accessible page components fit the agreed stack without adding a design-system dependency in advance.

Proposed routes cover home/search, hotel detail, sign-up/sign-in/verification, checkout, booking confirmation, and booking history/detail. Share the currency selection and search criteria across the journey. Preserve the intended room/stay during authentication, then revalidate it. Use labeled native inputs where they satisfy the design and accessible focus/error states throughout. All primary views carry the demo disclosure.

Alternative: a static frontend with browser-local bookings would be smaller but cannot demonstrate protected accounts, shared availability, or reliable multi-user reservations.

### 2. Supabase owns identity and data isolation

Use Supabase Auth for email/password registration, verification, sessions, and sign-out. Server requests validate the authenticated identity; do not infer it from a client-provided user ID. Use row-level security for private tables, public read access only for safe catalog data, and no direct customer writes to inventory or booking status. Explicitly project public fields rather than expose private contact information through joins or views.

Database mutation functions verify `auth.uid()` and verified-email status, use a fixed safe `search_path`, and expose only the minimum execute privileges. Avoid service-role access for customer mutations; reserve privileged credentials for narrowly scoped rate and email maintenance. Function permissions and RLS are part of migrations and integration checks.

Alternative: custom password/session storage adds security responsibilities already handled by the agreed identity provider.

### 3. Small relational model with date-specific inventory

Proposed tables:

| Data | Responsibility |
| --- | --- |
| `hotels` | Fictional name, destination, description, photos, demo rating, amenities, IANA timezone, local check-in time |
| `room_types` | Hotel, room description, maximum guests, USD nightly price, explicit demo fee data |
| `room_inventory` | Room type plus local stay date, total and reserved room counts; unique room/date and bounds constraints |
| `exchange_rate_sets` | Validated immutable USD-based six-currency rates, source identity, source timestamp, retrieval time |
| `bookings` | Owner, request identifier/fingerprint, state, room type, local dates, guests/contact, immutable confirmation and money snapshot, saved check-in deadline |
| `booking_notifications` | Unique booking/event type, saved recipient and event payload, delivery state, attempt metadata, provider delivery identifier |

Seed a small useful catalog in all eleven cities, including Standard Double/Twin-style choices, varied amenities and prices, and limited inventory for testable scarcity. Yangon, Mandalay, Taunggyi, and Kalaw use `Asia/Yangon`. Photos must be appropriately licensed and must not imply that a fictional property is a real partner. Document destination image sources in `docs/destination-image-sources.md`; Siem Reap uses an identified Angkor Wat photograph. Do not present invented ratings as verified reviews.

Seed inventory for a documented finite future date range and treat missing dates as unavailable. Make that range easy to regenerate deliberately without replacing bookings. Do not silently reset shared inventory or erase reservations when the application starts. There is no hotel-owner editing UI.

Alternative: a single stock count per room cannot represent overlapping stays. Individual physical room assignments are unnecessary for the agreed room-type demo.

### 4. Database transactions preserve reservation invariants

Use narrow Postgres booking and cancellation functions rather than a series of client writes. For confirmation:

1. Validate the caller and claim a caller-scoped attempt identifier. A unique `(owner_id, request_id)` plus an input fingerprint serializes duplicate attempts; a replay returns the existing result, while changed details are rejected.
2. Validate destination-local dates, positive integer guests, room capacity, and contact fields. Lock the requested inventory rows in a stable date order and require a row for every date in `[check_in, check_out)`.
3. Recompute the current authoritative quote, including supported currency and rate snapshot. Compare it with the amount/currency/rate the customer reviewed. Return a quote-changed response without committing if it differs. Client-submitted amounts are review expectations, never price authority.
4. Ensure every night has capacity, increment reserved counts, save the booking and immutable confirmation snapshot, and create one booking-email event in the same transaction.

Cancel by locking the owned booking, comparing database time against its saved deadline, transitioning confirmed to cancelled, decrementing reserved counts for its nights, and inserting one cancellation event atomically. A replay returns cancelled status without another decrement. All failed operations roll back fully. Keep database constraints as the final protection against negative or excess reserved inventory.

Alternative: checking availability in the browser or application before later updates permits overbooking. Serializing a booking in the database keeps the invariant beside the inventory.

### 5. One authoritative money calculation

Keep USD prices in integer cents and exchange rates in Postgres exact `numeric` values. Expose monetary values as decimal strings at JSON boundaries; use JavaScript only to format, not to multiply floating-point monetary values. Use a shared database quote calculation for search totals, checkout, and the confirmation transaction, so filters and sorting use the same stay total.

Count nights from hotel-local calendar dates, independent of browser timezone or daylight-saving duration. Calculate the USD accommodation subtotal plus explicit demo fee lines. For display, convert each subtotal/fee line using the same selected rate and round half-up to that currency's standard minor-unit precision. Sum those rounded lines for the displayed total, so the breakdown reconciles. Show the converted nightly rate as a rate, not as a second independent source for the stay total. Do not invent regional taxes: seed and label any mock fees explicitly.

Save the USD breakdown, rate set/timestamp, selected currency, rounded converted breakdown, total, and terms with the booking. Catalog, currency selector, and rate changes never rewrite it. USD uses an identity rate of one and needs no remote request.

Alternative: browser conversions or independent computations on each page drift through floating-point or rounding differences and make historical confirmations unstable.

### 6. Validated daily rates with an honest fallback

Use one server-side USD-based HTTP rate source that provides all six destination currencies. Before integration, verify that its documented response supplies the required coverage, timestamps, usage permissions, and refresh frequency; do not select a paid account without authorization. The provider is a configuration choice within this fixed rate-fetching boundary, not a generalized provider plugin system.

A scheduled protected operation attempts refresh every 24 hours. Validate response shape, USD base/direction, full currency coverage, finite positive rates, and sensible source timestamps; atomically save a complete valid set, rejecting older or invalid replacements. Show the source timestamp on converted prices. On failure, retain the last valid set and visibly label the fallback. Without any valid set, show USD and require review before checkout changes currency. Never silently substitute a different amount/currency during confirmation.

Alternative: fixed demo rates cannot satisfy the user's live-conversion decision; fetching on every page makes availability depend on rate-source uptime and wastes quota.

### 7. Hotel-local check-in is a saved instant

Store an IANA timezone and local check-in time for each hotel. Convert the arrival date plus that local time into a UTC deadline in Postgres when creating the booking. Save the timezone, local deadline text, UTC instant, and accepted cancellation terms with the confirmation. Database time decides eligibility: cancellation is allowed only when `now < deadline`; the exact deadline is ineligible.

Alternative: browser timezone or mutable hotel settings can produce different cancellation outcomes for the same booking. Persisting the accepted deadline makes the contract stable.

### 8. Transactional email events survive provider failures

Create notification events in the reservation transaction, then attempt delivery after commit with Resend. Persist the owning customer's verified account email and the saved event payload. Booking contact details cannot redirect emails to an arbitrary recipient. Registration/verification email remains an Auth concern with a configured sender; booking/cancellation emails are explicit Resend events.

Store pending/delivered/failed state and retry metadata. A protected scheduled delivery operation claims pending events to prevent concurrent sends and retries temporary failures with bounded backoff. Reuse the event identifier as the provider idempotency key. Avoid replaying ambiguous attempts beyond the provider's documented deduplication window; retain their state for inspection rather than promise exactly-once internet delivery. A failed email never changes booking or stock; show an honest delivery-delay state in the app.

Alternative: sending email before commit can notify a customer about a failed reservation. Sending without a persisted event can lose confirmations when the request ends unexpectedly.

## Risks / Trade-offs

- [Provider credentials, verified sender, and scheduling are not yet configured] -> Keep secrets server-side, supply an environment template during implementation, validate required settings, and show explicit integration status rather than fake delivery.
- [Rate source coverage or quotas may be unsuitable] -> Verify all six currencies and update semantics before integration; preserve saved-rate/USD fallbacks and record the selected source in setup documentation.
- [Old saved rates can diverge from current market prices] -> Show timestamps and fallback notices. These are display conversions for a demo, not executable exchange quotes.
- [Public demo inventory can be exhausted] -> Seed sufficient documented inventory and provide deliberate development reseeding instructions; never automatically delete bookings or reset shared stock.
- [Email retries can duplicate after an ambiguous response outside provider deduplication limits] -> Stable event keys, explicit delivery states, bounded retry timing, and inspection of ambiguous attempts.
- [Fictional property photography can mislead] -> Use permitted assets, visible fictional/demo labels, and no real-partner claims.
- [Real customer launch has additional obligations] -> Require a separate change for supplier confirmations, actual payments/refunds, privacy/retention, operational support, and production policy review.

## Migration Plan

1. Scaffold the agreed application stack without replacing this OpenSpec directory or treating `.openspec-cli` as application source.
2. Add versioned schema/RLS/function migrations and apply them to a dedicated demo database. Seed fictional catalog and a documented future inventory horizon.
3. Configure Auth verification, Resend sender, the selected rate source, and protected scheduled operations. Test with controlled recipient accounts before opening the demo.
4. Validate application checks and reservation concurrency/ownership invariants, then exercise the full journey in the target deployment environment.
5. For rollback, disable public booking mutations and scheduled jobs before reverting application code. Prefer forward corrective migrations; back up persisted bookings and notification state before any destructive schema or seed operation. Never reset the database as a routine rollback.

## Open Questions

- Which rate-source vendor meets the fixed six-currency contract and available account terms? Resolve during the explicit provider-selection task; the USD-base/fallback behavior is already settled.
- Which permitted photo assets, exact fictional hotel names, and brand styling should populate the seeded catalog?
- Which hosting account and verified sending domain will be used? These affect setup credentials, not the agreed application behavior; provisioning or paid plans require separate authorization.
