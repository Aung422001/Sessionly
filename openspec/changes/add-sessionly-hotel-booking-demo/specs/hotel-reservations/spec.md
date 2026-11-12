# Spec Delta

## Purpose

Provide a realistic one-room demo reservation lifecycle with reliable inventory, private booking history, and clear cancellation behavior without making real hotel reservations.

## ADDED Requirements

### Requirement: Complete one-room checkout
The system SHALL let verified customers select one room type, stay dates, guest count, and contact details; review the full price and cancellation terms; and explicitly confirm a demo booking. A room MUST accommodate the guest count and be available for every night. Check-out day SHALL NOT consume an extra inventory night.

#### Scenario: Complete a valid reservation
- **WHEN** a verified customer confirms an available room for a valid stay with valid contact details
- **THEN** the system records one confirmed demo booking with a unique reference and returns its confirmation
- **AND** the booking records the hotel, room, dates, guest count, contact details, price breakdown, currency snapshot, and accepted cancellation terms

#### Scenario: Reject invalid booking input
- **WHEN** a confirmation contains invalid dates, insufficient guest capacity, invalid contact details, an unknown room, or a stay outside available inventory
- **THEN** the system identifies the problem and creates no booking or inventory change

### Requirement: Explicit simulated payment
Checkout SHALL use a clearly labeled payment simulation and SHALL NOT collect card details, charge money, initiate an actual currency exchange, or claim payment was received. Confirmations SHALL state that no real room was reserved.

#### Scenario: Confirm simulated checkout
- **WHEN** a customer completes the payment simulation
- **THEN** the system creates only a demo reservation and identifies payment as simulated in checkout, history, and confirmation

### Requirement: Authoritative booking validation
The system SHALL revalidate identity, dates, capacity, availability, prices, fees, and conversion rates before committing a booking. It SHALL NOT trust client-supplied totals. A changed quote SHALL require customer review and confirmation before booking at a different total or currency.

#### Scenario: Submitted price is altered
- **WHEN** a customer submits a fabricated lower total
- **THEN** the system uses the authoritative quote and requires confirmation of that quote before creating the booking

#### Scenario: Price changes before submission
- **WHEN** an authoritative nightly price, fee, or exchange rate changes after review
- **THEN** the system presents the updated quote and does not silently confirm the changed amount

### Requirement: Consistent room inventory
A confirmed booking SHALL consume one unit of room-type inventory for each stay night. Availability checking, booking creation, and inventory consumption MUST succeed or fail together. Concurrent requests SHALL NOT consume more rooms than the available inventory.

#### Scenario: Two customers request the last room
- **WHEN** two customers concurrently confirm the last available room for overlapping nights
- **THEN** at most one booking is confirmed
- **AND** the other customer receives an availability message and no partial booking or inventory change

#### Scenario: One stay night is unavailable
- **WHEN** inventory exists for some but not all requested nights
- **THEN** confirmation fails without consuming inventory on any night

#### Scenario: Consecutive stays share a boundary
- **WHEN** one booking checks out on the same date another checks in
- **THEN** the first booking does not consume inventory for that shared check-out date

### Requirement: Safe repeated confirmation
Repeated submissions of the same confirmation attempt SHALL return the same booking result without creating additional bookings, consuming additional inventory, or creating duplicate notification events. Reusing an attempt identifier with changed booking details SHALL be rejected.

#### Scenario: Customer retries after a lost response
- **WHEN** a successful confirmation is retried with the same attempt identifier and booking details
- **THEN** the existing booking confirmation is returned without further inventory consumption

#### Scenario: Attempt identifier is reused for another room
- **WHEN** a confirmation reuses an existing attempt identifier with different booking details
- **THEN** the system rejects the conflicting submission and preserves the original booking

### Requirement: Booking history and immutable confirmation
Customers SHALL be able to view their confirmed and cancelled demo bookings and open their original confirmation details. Later catalog edits, display-currency changes, or exchange-rate refreshes SHALL NOT alter a booking's accepted price, cancellation terms, room description, or stay details.

#### Scenario: Revisit after currency preference changes
- **WHEN** a customer changes the display currency and opens an existing booking
- **THEN** its confirmation shows the saved booking currency, rate, price breakdown, and total rather than a newly converted total

### Requirement: Free cancellation before local check-in
An owning customer SHALL be able to cancel a confirmed demo booking without fees strictly before the saved check-in instant on arrival day in the hotel's local timezone. At or after that instant, cancellation SHALL be rejected. The terms and local deadline SHALL be displayed before confirmation and saved with the booking. Date changes SHALL require cancellation and a new booking.

#### Scenario: Cancel before the deadline
- **WHEN** an owning customer cancels before the saved local check-in deadline
- **THEN** the booking becomes cancelled and its consumed room inventory is restored atomically with no cancellation fee or real refund transaction

#### Scenario: Cancel at or after the deadline
- **WHEN** an owning customer requests cancellation at or after the saved check-in instant
- **THEN** the system rejects cancellation, explains the deadline, and leaves status and inventory unchanged

#### Scenario: Browser timezone differs from the hotel
- **WHEN** a customer in another timezone views or cancels a booking
- **THEN** the displayed deadline identifies the hotel's timezone and eligibility uses the same saved instant regardless of the browser timezone

#### Scenario: Repeat a cancellation
- **WHEN** cancellation is retried for an already cancelled booking
- **THEN** the system returns the cancelled status without restoring inventory a second time or creating another cancellation event
