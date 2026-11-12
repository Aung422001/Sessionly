# Spec Delta

## Purpose

Show transparent hotel stay prices calculated from USD and converted consistently into supported destination currencies while preserving the price accepted for each booking.

## ADDED Requirements

### Requirement: USD base and supported display currencies
The system SHALL calculate authoritative hotel prices in USD and offer USD, THB, VND, KHR, MYR, SGD, and IDR as display currencies. Conversion SHALL use the number of target currency units per USD. A currency selector SHALL apply consistently across search, room details, and checkout.

#### Scenario: Select a destination currency
- **WHEN** a visitor selects THB with a valid rate of 35 THB per USD
- **THEN** a USD 100 amount is displayed as THB 3,500 in the relevant price views
- **AND** the underlying USD price is unchanged

#### Scenario: Unsupported currency is requested
- **WHEN** an unsupported currency code is supplied
- **THEN** the system rejects that preference or explicitly resets it to USD without labeling USD amounts as another currency

### Requirement: Transparent stay totals
The system SHALL show nightly rate, night count, accommodation subtotal, each applicable demo fee, and full-stay total before confirmation. Nights SHALL be counted by hotel-local calendar dates. Monetary calculations SHALL use exact decimal arithmetic or equivalent integer arithmetic and currency-appropriate display precision.

#### Scenario: Review a multi-night stay
- **WHEN** a customer reviews three nights at USD 40 per night with a USD 5 demo fee
- **THEN** the USD subtotal is 120 and total is 125
- **AND** any selected-currency conversion uses the same rate for the full breakdown and its displayed components reconcile with the displayed total

#### Scenario: Display a currency without fractional units
- **WHEN** a converted VND price would contain a fractional dong
- **THEN** the system displays it at the currency's supported precision using a consistent documented rounding rule
- **AND** checkout and confirmation use the same saved rounded amount

### Requirement: Daily live exchange-rate refresh
The system SHALL attempt to refresh supported exchange rates at least once every 24 hours while deployed. It SHALL validate currency coverage, rate direction, finite positive rate values, and the source timestamp before accepting rates. Displayed conversions SHALL identify the rate timestamp and whether a saved rate is being used.

#### Scenario: Accept a valid refresh
- **WHEN** the rate source provides valid USD-based rates for all six destination currencies
- **THEN** new quotes use the refreshed rates and show the associated timestamp
- **AND** existing booking snapshots remain unchanged

#### Scenario: Reject invalid provider data
- **WHEN** a refresh contains missing currencies, invalid values, an invalid timestamp, or an incompatible base currency
- **THEN** the system retains the last valid rate set and does not price bookings using the invalid data

### Requirement: Exchange-rate failure fallback
When fresh rates are unavailable, the system SHALL use the last saved valid rate set with its timestamp and a visible fallback notice. If no valid saved rates exist, it SHALL show USD prices only and clearly identify that conversion is unavailable. It SHALL NOT invent rates or silently change a customer's reviewed checkout currency.

#### Scenario: Refresh fails with saved rates available
- **WHEN** the rate source is unavailable and a valid saved rate set exists
- **THEN** the system converts using that set and discloses its timestamp and fallback status

#### Scenario: First request has no valid rate set
- **WHEN** conversion is requested before any valid rate set has been saved and the source fails
- **THEN** the system displays explicitly labeled USD prices and explains that currency conversion is unavailable
- **AND** confirming a previously reviewed non-USD quote requires review of the USD fallback quote

### Requirement: Saved booking currency snapshot
Each confirmed booking SHALL preserve its USD price breakdown, selected currency, accepted conversion rate and timestamp, rounded displayed breakdown, and total. Later rate updates or currency preference changes SHALL NOT rewrite that snapshot. USD bookings SHALL use an identity rate of one without requiring an external rate source.

#### Scenario: Rate changes after booking
- **WHEN** a customer books a USD 100 stay at 35 THB per USD and the live rate later becomes 36
- **THEN** the saved booking remains THB 3,500 using the original rate and timestamp
- **AND** new quotes can use the updated rate

#### Scenario: USD remains available during an outage
- **WHEN** a customer reviews and confirms a USD quote while external rates are unavailable
- **THEN** the system can save the USD booking at a rate of one without depending on the rate source
