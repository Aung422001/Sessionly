# Tasks

All checkboxes are future implementation work. This proposal does not implement or deploy the application. Acceptance behavior is defined in the five capability specs; architecture and invariants are in `design.md`.

## 1. Application foundation

- [ ] 1.1 Scaffold Next.js App Router, TypeScript, and Tailwind in Sessionly without overwriting OpenSpec or including `.openspec-cli` as app source; verify the development server starts, the production build succeeds, and existing planning files remain intact.
- [ ] 1.2 Configure Supabase server/browser access and Resend server-only configuration with an environment template and secret-safe errors; verify missing required settings produce an actionable setup message and private keys are absent from browser bundles.
- [ ] 1.3 Add concise local setup commands and package scripts for type checking, linting, and the small chosen test harness; verify the documented clean-install/start commands and scripts run as written.

## 2. Catalog, inventory, and authorization schema

- [ ] 2.1 Create versioned migrations for hotels, room types, per-date inventory, immutable exchange-rate sets, bookings, and notification events with foreign keys, uniqueness, valid-money/date/capacity checks, and inventory bounds; verify migrations apply to a clean demo database and constraints reject invalid rows.
- [ ] 2.2 Add public catalog read permissions and owner-only private-data RLS, revoke direct customer stock/status writes, and constrain mutation-function privileges; verify anonymous reads expose only public catalog data and two test customers cannot read or mutate one another's records through direct database requests.
- [ ] 2.3 Seed fictional hotels in all eleven cities, varied room types, amenities, demo ratings, permitted photos, hotel-local check-in settings, and a documented future inventory horizon; verify every city has searchable rooms and missing inventory dates are unavailable.
- [ ] 2.4 Document safe seeding, inventory-horizon extension, asset provenance, and schema rollback without deleting existing bookings; verify rerunning supported seed/extension operations preserves reservation and notification records.

## 3. Authoritative pricing and exchange rates

- [ ] 3.1 Implement the shared database quote calculation using USD cents, exact exchange-rate arithmetic, hotel-local date night counts, explicit fee lines, and consistent currency rounding; verify tests for multi-night totals, all seven display currencies, zero-decimal currencies, and component/total reconciliation.
- [ ] 3.2 Select one live USD-based rate source after checking its documented THB/VND/KHR/MYR/SGD/IDR coverage, timestamps, quotas, and usage terms; record the source and setup requirements, verifying a representative response satisfies the fixed rate contract without signing up for a paid plan.
- [ ] 3.3 Implement server-only rate retrieval and validation plus atomic immutable rate-set storage; verify tests reject missing currencies, zero/negative/nonfinite rates, wrong base currency, invalid timestamps, and older replacement data while preserving the previous valid set.
- [ ] 3.4 Add the protected daily refresh operation, timestamped saved-rate fallback, and explicit USD-only fallback when no set exists; verify unauthorized refresh requests fail and simulated source failures produce the correct rate notice or USD fallback.
- [ ] 3.5 Add shared currency selection and decimal-string formatting across results, room details, and checkout; verify USD 100 at 35 THB/USD displays THB 3,500 consistently and document refresh, fallback, and rounding behavior.

## 4. Verified customer accounts

- [ ] 4.1 Implement registration, email verification, email/password sign-in, and sign-out through Supabase Auth; verify valid and invalid authentication flows with controlled accounts and confirm no password or session secret enters application logs.
- [ ] 4.2 Protect booking/history/cancellation on the server and require verified email for confirmation while preserving and revalidating the intended room/stay through sign-in; verify anonymous, unverified, and expired-session direct requests cannot reserve rooms or consume inventory.
- [ ] 4.3 Document Auth verification sender and redirect configuration; verify the local and intended deployment callback paths with controlled recipient accounts and ensure sign-out removes private booking content from the next view.

## 5. Hotel discovery and responsive experience

- [ ] 5.1 Build the English, photo-led home/search and hotel detail pages with destination/date/guest inputs, room choices, consistent total-price cards, and visible fictional/demo labels; verify each of the eleven cities can be explored publicly.
- [ ] 5.2 Implement available-for-every-night search, capacity matching, combined price/rating/amenity filters, and full-stay-total sorting in the selected currency; verify focused cases for unavailable nights, multiple matching room types, combined filters, empty results, invalid dates, and invalid guest counts.
- [ ] 5.3 Complete mobile/desktop layouts, loading/error/empty states, labeled controls, image alternatives, focus states, and keyboard operation; verify search and room selection at 360-pixel width without horizontal page scrolling and through a keyboard-only walkthrough.

## 6. Reservations and cancellation

- [ ] 6.1 Implement atomic confirmation with authenticated identity, verified email, contact/capacity/date validation, ordered inventory locks, and `[check_in, check_out)` consumption; verify integration tests for last-room concurrency, a missing inventory night, adjacent stays, and full rollback on failure.
- [ ] 6.2 Add caller-scoped request identifiers/fingerprints and authoritative reviewed-quote comparison; verify retries return one booking with one inventory decrement and one event, conflicting identifier reuse fails, fabricated prices fail, and changed prices/rates require a new review.
- [ ] 6.3 Save immutable hotel/room/terms and money snapshots plus the hotel's local check-in deadline as a UTC instant; verify subsequent catalog/rate changes and currency preferences leave original confirmation amounts and terms unchanged.
- [ ] 6.4 Implement the one-room checkout UI with contact details, reconciled price breakdown, demo payment simulation, cancellation terms, quote-change handling, and durable confirmation; verify a complete booking makes no real payment request and collects no card details.
- [ ] 6.5 Implement atomic owner-only cancellation before the saved deadline and replay-safe inventory restoration; verify tests immediately before, exactly at, and after the deadline, across a different browser timezone, with repeated/concurrent cancellation, and with another customer's session.
- [ ] 6.6 Build private booking history/detail and cancellation views with confirmed/cancelled states, saved totals, references, and a clear cancel/rebook path for date changes; verify customers only see their own records and document the cancellation rule and simulated-payment limits.

## 7. Booking and cancellation email

- [ ] 7.1 Create immutable booking/cancellation notification events in their respective transactions with unique event keys and the owning customer's verified account email; verify booking retries create one event, cancellation creates one additional event, and unverified contact addresses cannot redirect messages.
- [ ] 7.2 Build Resend booking/cancellation templates from saved event data with demo labels in subject and body, original booking totals/terms, and no real-payment/refund claims; verify template output and send controlled test messages to a verified test recipient.
- [ ] 7.3 Implement delivery after commit plus protected retry processing with claimed events, bounded backoff, stable provider idempotency keys, and safe handling beyond the provider deduplication window; verify provider failure, lost responses, and concurrent workers do not repeat inventory changes or intentionally resend delivered events.
- [ ] 7.4 Show delivery-delay status separately from the durable booking/cancellation result and document sending-domain setup, retry operation, and ambiguous-delivery inspection; verify failed delivery leaves booking history usable and preserves the correct stock/status.

## 8. Whole-journey validation

- [ ] 8.1 Run type checking, linting, production build, and all focused tests introduced with their feature groups; verify all commands pass and review the source/bundle for exposed secrets and accidentally enabled payment integrations.
- [ ] 8.2 Exercise search -> sign-in/verification -> room selection -> converted-price review -> simulated checkout -> confirmation/email -> history -> eligible cancellation on mobile and desktop; verify saved amounts, notification contents, privacy, inventory changes, and demo labels agree across the journey.
- [ ] 8.3 Exercise integration failures for unavailable rates with/without saved data, email outage, lost booking response, expired session, and simultaneous last-room requests; verify each failure follows the corresponding spec without partial stock changes or hidden currency changes.
- [ ] 8.4 Finish setup/run documentation and a portfolio walkthrough describing fictional inventory, provider configuration, credentials, daily jobs, email limits, and the separate future real-customer phase; verify instructions reflect the actual built commands and record any deployment-dependent checks that could not be performed.
