# Spec Delta

## Purpose

Give customers verified accounts for making demo reservations and securely accessing only their own booking history and contact details.

## ADDED Requirements

### Requirement: Verified email and password accounts
The system SHALL support email/password registration, email verification, sign-in, and sign-out. A customer MUST have a verified email address before creating a booking. Passwords and session credentials SHALL NOT be exposed through public pages or application logs.

#### Scenario: Register and verify
- **WHEN** a visitor registers and successfully verifies the registered email address
- **THEN** the visitor can sign in and proceed with a demo booking

#### Scenario: Unverified customer attempts checkout
- **WHEN** a signed-in customer whose email is unverified attempts to confirm a booking
- **THEN** the system requires email verification and creates no booking or inventory change

#### Scenario: Invalid sign-in
- **WHEN** a visitor provides invalid credentials
- **THEN** the system denies access with an actionable message without exposing another customer's account data

#### Scenario: Sign out
- **WHEN** a customer signs out
- **THEN** subsequent protected requests require authentication and private booking content is no longer shown

### Requirement: Public browsing and protected booking actions
The system SHALL allow hotel browsing without authentication and SHALL require a valid authenticated session for booking creation, booking history, and cancellation. Authentication checks SHALL apply to direct requests as well as page navigation.

#### Scenario: Browse then sign in
- **WHEN** an unauthenticated visitor chooses an available room
- **THEN** the system requests sign-in before confirmation and preserves the intended hotel, room, stay, and guest selection for revalidation after sign-in

#### Scenario: Session expires before confirmation
- **WHEN** a customer submits confirmation with an expired session
- **THEN** the system requests authentication and does not create a booking or consume inventory

### Requirement: Customer data isolation
The system SHALL restrict private booking records, saved contact details, and cancellation operations to the owning customer. A booking reference alone SHALL NOT authorize access. Client-supplied customer identifiers SHALL NOT override the authenticated identity.

#### Scenario: Attempt to access another customer's booking
- **WHEN** a customer requests another customer's booking by reference or identifier
- **THEN** the system denies access without disclosing booking or contact details

#### Scenario: Attempt to cancel another customer's booking
- **WHEN** a customer submits a cancellation for another customer's booking
- **THEN** the system denies the action and leaves the booking and inventory unchanged

#### Scenario: View own history
- **WHEN** a signed-in customer opens booking history
- **THEN** only bookings owned by that customer are displayed, including confirmed and cancelled demo bookings
