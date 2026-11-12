# Spec Delta

## Purpose

Help budget travelers discover and compare fictional Southeast Asian hotels through a complete, accessible portfolio experience with transparent stay prices.

## ADDED Requirements

### Requirement: Supported destination catalog
The system SHALL provide fictional hotels in Bangkok, Chiang Mai, Hanoi, Siem Reap, Kuala Lumpur, Singapore, Jakarta, Yangon, Mandalay, Taunggyi, and Kalaw. Each hotel SHALL expose photos, a description, amenities, a demo rating, location, local timezone and check-in time, and room types with nightly prices, capacity, and availability.

#### Scenario: Explore a supported city
- **WHEN** a visitor opens any supported destination
- **THEN** the system displays fictional hotels for that city and allows viewing hotel and room details
- **AND** ratings and properties are identifiable as demonstration data rather than verified real properties or reviews

#### Scenario: Explore Myanmar destinations
- **WHEN** a visitor selects Yangon, Mandalay, Taunggyi, or Kalaw
- **THEN** the system provides fictional hotels and room choices for that destination in Myanmar (Burma)
- **AND** hotel-local dates and check-in deadlines use Asia/Yangon, including its half-hour UTC offset

#### Scenario: View the Cambodia destination image
- **WHEN** a visitor views the Siem Reap destination card
- **THEN** the destination photograph depicts Angkor Wat in Cambodia and retains a documented image source

### Requirement: Search by stay and occupancy
The system SHALL allow unauthenticated visitors to search by destination, check-in date, check-out date, and a positive integer guest count. Search results SHALL include only hotels with a room type that accommodates those guests and is available for every night of the stay.

#### Scenario: Find an available room
- **WHEN** a visitor searches a supported destination with valid future stay dates and two guests
- **THEN** each result offers at least one room type with capacity for two and inventory for every requested night

#### Scenario: Reject invalid search input
- **WHEN** dates are invalid, check-in is in the past at the destination, check-out is not after check-in, or the guest count is not a positive integer
- **THEN** the system shows an actionable validation message and does not present those inputs as a valid stay

#### Scenario: No matching hotels
- **WHEN** no available room matches the search
- **THEN** the system shows an empty result state and allows changing dates, guest count, or destination

### Requirement: Comparable results and filters
The system SHALL show consistent hotel cards with photo, location, demo rating, key amenities, nightly rate, and full-stay total. Visitors SHALL be able to combine price, rating, and amenity filters and sort by full-stay total. Price filters SHALL use that total in the selected display currency.

#### Scenario: Filter and sort a stay
- **WHEN** a visitor applies a price range, minimum rating, and amenities and sorts by total price
- **THEN** the results satisfy all active filters and are ordered by the displayed full-stay total
- **AND** each card prices an available room that fits the requested guest count

### Requirement: Responsive and accessible presentation
The system SHALL present an English, photo-led interface that supports mobile and desktop layouts, keyboard navigation, labeled controls, meaningful image alternatives, visible focus, and readable validation and loading states.

#### Scenario: Complete search on a mobile viewport
- **WHEN** a visitor uses the search and hotel detail pages at a 360-pixel viewport width
- **THEN** primary content and booking controls remain usable without horizontal page scrolling

#### Scenario: Navigate without a mouse
- **WHEN** a visitor operates search, filters, and hotel selection using a keyboard
- **THEN** controls have accessible names, visible focus, and a usable tab order

### Requirement: Persistent demo disclosure
The system SHALL clearly identify the catalog, availability, and bookings as fictional throughout discovery and checkout. It SHALL NOT imply that a real hotel room can be reserved or that simulated payment charges money.

#### Scenario: Enter checkout from a hotel
- **WHEN** a visitor moves from a hotel detail page into checkout
- **THEN** both views clearly state that this is a demo and no real hotel reservation or payment will occur
