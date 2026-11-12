export const destinations = [
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok', photo: 'photo-1508009603885-50cf7c579365', caption: 'River days. Rooftop nights.', names: ['The Lantern House', 'Mango & Mint Rooms'], price: 4000 },
  { id: 'chiang-mai', name: 'Chiang Mai', country: 'Thailand', timezone: 'Asia/Bangkok', photo: 'photo-1512553353614-82a7370096dc', caption: 'A slower kind of adventure.', names: ['Tamarind Courtyard', 'Little Mountain Stay'], price: 2800 },
  { id: 'hanoi', name: 'Hanoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', photo: 'photo-1509030450996-dd1a26dda07a', caption: 'Old streets. New stories.', names: ['Paper Lantern Hanoi', 'The Quiet Quarter'], price: 3200 },
  { id: 'siem-reap', name: 'Siem Reap', country: 'Cambodia', timezone: 'Asia/Phnom_Penh', photo: 'photo-1665386949480-75643c2de56f', caption: 'Wake up to a little wonder.', names: ['Lotus Lane House', 'Palm & Stone'], price: 2500 },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', photo: 'photo-1596422846543-75c6fc197f07', caption: 'Find your own city rhythm.', names: ['Kampung House', 'The Meranti Rooms'], price: 3800 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', photo: 'photo-1525625293386-3f8f99389edd', caption: 'Small island. Endless possibilities.', names: ['Joo Chiat Hideaway', 'The Little Shophouse'], price: 7800 },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta', photo: 'photo-1555899434-94d1368aa7af', caption: 'Meet the unexpected.', names: ['Senja Garden Stay', 'The Menteng Nook'], price: 3000 },
  { id: 'yangon', name: 'Yangon', country: 'Myanmar (Burma)', timezone: 'Asia/Yangon', photo: 'photo-1559116865-2826a53cacb8', caption: 'Golden evenings. Storied streets.', names: ['Golden Courtyard Yangon', 'The Rangoon Nook'], price: 3000 },
  { id: 'mandalay', name: 'Mandalay', country: 'Myanmar (Burma)', timezone: 'Asia/Yangon', photo: 'photo-1719859798039-b4a38a8cce83', caption: 'A bridge to a slower day.', names: ['Mandalay Teak House', 'The Irrawaddy Rooms'], price: 2800 },
  { id: 'taunggyi', name: 'Taunggyi', country: 'Myanmar (Burma)', timezone: 'Asia/Yangon', photo: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Taunggyi_cityscape_seen_from_Nyaungshwe_plain.jpg', caption: 'Hilltop mornings. Shan State stories.', names: ['Shan Hills Courtyard', 'The Taunggyi Terrace'], price: 2600 },
  { id: 'kalaw', name: 'Kalaw', country: 'Myanmar (Burma)', timezone: 'Asia/Yangon', photo: 'photo-1641809310451-f261938fbbf5', caption: 'Pine trails and misty mornings.', names: ['Kalaw Pine House', 'The Misty Hill Rooms'], price: 2400 },
];

export const photoUrl = (id: string, width = 1000) => id.startsWith('https://') ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const hotels = destinations.flatMap((destination, index) => destination.names.map((name, variant) => ({
  id: `${destination.id}-${variant + 1}`, city: destination.id, name,
  country: destination.country, city_name: destination.name, timezone: destination.timezone,
  check_in_time: '14:00', rating: (4.7 - variant * 0.2).toFixed(1),
  description: `A thoughtful little base for your ${destination.name} days. Settle into an airy room, find a favourite neighbourhood café, and make space for a slower morning. This is a fictional demonstration property; photographs are illustrative.`,
  photo: variant === 0 && index === 0 ? photoUrl('photo-1566073771259-6a8506099945') : photoUrl('photo-1611892440504-42a792e24d32'),
  amenities: variant === 0 ? ['Wi-Fi', 'Air conditioning', 'Breakfast', 'Garden'] : ['Wi-Fi', 'Air conditioning', 'Workspace'],
  nightly_cents: destination.price + variant * 800,
})));

export type Hotel = typeof hotels[number];
export type Room = { id: string; hotel_id: string; name: string; capacity: number; nightly_cents: number; fee_cents: number };
export const rooms: Room[] = hotels.flatMap(hotel => [
  { id: `${hotel.id}-double`, hotel_id: hotel.id, name: 'Courtyard Double', capacity: 2, nightly_cents: hotel.nightly_cents, fee_cents: 500 },
  { id: `${hotel.id}-twin`, hotel_id: hotel.id, name: 'Garden Twin', capacity: 3, nightly_cents: hotel.nightly_cents + 1200, fee_cents: 500 },
]);
