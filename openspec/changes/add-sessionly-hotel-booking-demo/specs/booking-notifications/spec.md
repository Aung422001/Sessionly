# Spec Delta

## Purpose

Keep customers informed about demo bookings and cancellations through durable in-app confirmations and transactional email without making reservation success depend on email delivery.

## ADDED Requirements

### Requirement: Durable in-app confirmation
After a successful booking or cancellation, the system SHALL show the saved status in the app and booking history. Booking confirmation SHALL include the reference, hotel, room, dates, guest count, accepted price breakdown, currency and exchange-rate details, cancellation terms, and the statement that no real reservation or payment occurred.

#### Scenario: View confirmation after booking
- **WHEN** a demo booking commits successfully
- **THEN** the customer can view its saved confirmation immediately and again through their private booking history

#### Scenario: View cancellation confirmation
- **WHEN** a demo cancellation commits successfully
- **THEN** the customer sees the cancelled status, booking reference, and confirmation that no real refund transaction occurred

### Requirement: Transactional demo emails
The system SHALL send booking and cancellation emails only to the owning customer's verified account email address. Both the subject and body SHALL clearly label the message as a demo with no real hotel reservation. Booking emails SHALL use saved confirmation data, and cancellation emails SHALL identify the cancelled booking without claiming an actual refund.

#### Scenario: Email a booking confirmation
- **WHEN** a verified customer completes a demo booking
- **THEN** a demo confirmation email is sent to their verified account email with the saved reference, hotel, room, stay dates, guest count, total, currency, and cancellation terms

#### Scenario: Email a cancellation confirmation
- **WHEN** an owning customer successfully cancels a demo booking
- **THEN** a clearly labeled demo cancellation email identifies the booking and its cancelled status

#### Scenario: Contact email differs from account email
- **WHEN** booking contact details contain an address different from the verified account email
- **THEN** transactional booking emails are sent only to the verified account email and not to the unverified contact address

### Requirement: Delivery independent of reservation success
An email failure SHALL NOT roll back a booking or cancellation or change room inventory. The system SHALL retain the notification for retry and distinguish delivery problems from booking failure in customer-facing messages. An email delivery retry SHALL NOT create a reservation or repeat a cancellation.

#### Scenario: Email service is unavailable
- **WHEN** a booking commits but the email service fails
- **THEN** the booking remains confirmed with its inventory consumed exactly once
- **AND** its in-app confirmation remains available, a delivery-delay message is shown, and the notification remains eligible for retry

#### Scenario: Cancellation email fails
- **WHEN** cancellation commits but its email cannot be sent
- **THEN** the booking remains cancelled and inventory remains restored exactly once
- **AND** only the notification delivery is retried

### Requirement: Safe notification retries
Each booking or cancellation transition SHALL produce one logical notification event. Repeated booking submissions, cancellation submissions, and delivery attempts SHALL reuse that event and prevent duplicate emails when supported by the delivery provider's deduplication window. Already delivered events SHALL NOT be intentionally resent by a retry process.

#### Scenario: Repeated confirmation request
- **WHEN** a confirmed booking request is retried after a response was lost
- **THEN** the existing confirmation and its original notification event are reused

#### Scenario: Email response is lost
- **WHEN** an email request succeeds at the provider but its response is lost
- **THEN** a retry uses the same event delivery identifier to suppress duplicate delivery within the provider's supported deduplication window
