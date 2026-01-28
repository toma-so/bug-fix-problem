// Mock Database for scheduling API
// Uses JSON file for persistence so you can see bookings

import { CalcomBooking, CalcomSlot } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

// Simulated slot duration in minutes
const SLOT_DURATION = 30;
const BOOKINGS_PER_PAGE = 5;

// Path to the JSON file for bookings
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load bookings from JSON file
function loadBookings(): Map<string, CalcomBooking> {
  ensureDataDir();
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
      const arr: CalcomBooking[] = JSON.parse(data);
      const map = new Map<string, CalcomBooking>();
      for (const booking of arr) {
        map.set(booking.uid, booking);
      }
      return map;
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
  }
  return new Map();
}

// Save bookings to JSON file
function saveBookings(bookings: Map<string, CalcomBooking>) {
  ensureDataDir();
  const arr = Array.from(bookings.values());
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(arr, null, 2));
  console.log(`💾 Saved ${arr.length} bookings to ${BOOKINGS_FILE}`);
}

// Simple seeded random number generator for consistent results per date
function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Generate a seed from a date string
function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get timezone offset in hours for common timezones
function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    'America/Los_Angeles': -8,
    'America/Denver': -7,
    'America/Chicago': -6,
    'America/New_York': -5,
    'UTC': 0,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Asia/Tokyo': 9,
  };
  return offsets[timezone] ?? -8;
}

// Generate available slots for a given date with VARIED availability per day
function generateSlotsForDate(date: Date, userTimezone: string): CalcomSlot[] {
  const bookings = loadBookings();
  const dateStr = date.toISOString().split('T')[0];
  const random = seededRandom(dateSeed(dateStr));

  const tzOffset = getTimezoneOffset(userTimezone);
  const startHourUtc = 9 - tzOffset;
  const endHourUtc = 17 - tzOffset;

  const allPossibleSlots: Date[] = [];
  for (let hour = startHourUtc; hour < endHourUtc; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
      const slotTime = new Date(date);
      slotTime.setUTCHours(hour, minute, 0, 0);
      allPossibleSlots.push(slotTime);
    }
  }

  const numSlotsToday = Math.floor(random() * 7) + 6;
  const shuffled = [...allPossibleSlots].sort(() => random() - 0.5);
  const selectedSlots = shuffled.slice(0, numSlotsToday);
  selectedSlots.sort((a, b) => a.getTime() - b.getTime());

  const slots: CalcomSlot[] = [];
  for (const slotTime of selectedSlots) {
    const slotIsoString = slotTime.toISOString();
    const isBooked = Array.from(bookings.values()).some(
      (booking) => booking.start === slotIsoString
    );
    if (!isBooked) {
      slots.push({ time: slotIsoString });
    }
  }

  return slots;
}

// Generate slots for a date range
export function generateSlotsForDateRange(
  startDate: string,
  endDate: string,
  timeZone: string
): { slots: CalcomSlot[]; totalCount: number } {
  const slots: CalcomSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const currentDate = new Date(start);
  currentDate.setUTCHours(0, 0, 0, 0);

  while (currentDate < end) {
    const daySlots = generateSlotsForDate(currentDate, timeZone);
    for (const slot of daySlots) {
      const slotTime = new Date(slot.time);
      if (slotTime >= start && slotTime < end) {
        slots.push(slot);
      }
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return { slots, totalCount: slots.length };
}

// Get all slots
export function getAllSlots(
  startDate: string,
  endDate: string,
  timeZone: string
): { data: CalcomSlot[] } {
  const { slots } = generateSlotsForDateRange(startDate, endDate, timeZone);
  return { data: slots };
}

// Pagination response structure
export interface PaginationInfo {
  totalItems: number;
  remainingItems: number;
  returnedItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Get paginated bookings
export function getPaginatedBookings(
  take: number = BOOKINGS_PER_PAGE,
  skip: number = 0,
  afterStart?: string,
  beforeEnd?: string
): { data: CalcomBooking[]; pagination: PaginationInfo } {
  const bookings = loadBookings();
  let allBookings = Array.from(bookings.values()).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  if (afterStart) {
    const afterDate = new Date(afterStart);
    allBookings = allBookings.filter((b) => new Date(b.start) >= afterDate);
  }
  if (beforeEnd) {
    const beforeDate = new Date(beforeEnd);
    allBookings = allBookings.filter((b) => new Date(b.start) < beforeDate);
  }

  const totalItems = allBookings.length;
  const totalPages = Math.ceil(totalItems / take);
  const currentPage = Math.floor(skip / take) + 1;
  const pageBookings = allBookings.slice(skip, skip + take);

  const pagination: PaginationInfo = {
    totalItems,
    remainingItems: Math.max(0, totalItems - skip - pageBookings.length),
    returnedItems: pageBookings.length,
    itemsPerPage: take,
    currentPage,
    totalPages,
    hasNextPage: skip + pageBookings.length < totalItems,
    hasPreviousPage: skip > 0,
  };

  return { data: pageBookings, pagination };
}

// Create a booking - SAVES TO JSON FILE
export function createBooking(
  eventTypeId: number,
  start: string,
  attendee: { name: string; email: string; timeZone: string }
): CalcomBooking {
  const bookings = loadBookings();
  
  const id = Math.floor(Math.random() * 100000);
  const uid = `booking_${Date.now()}_${id}`;

  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + SLOT_DURATION * 60 * 1000);

  const booking: CalcomBooking = {
    id,
    uid,
    title: `Meeting with ${attendee.name}`,
    start,
    end: endDate.toISOString(),
    status: 'accepted',
    attendees: [attendee],
  };

  bookings.set(uid, booking);
  saveBookings(bookings);
  
  console.log(`\n✅ BOOKING CREATED:`);
  console.log(`   UID: ${uid}`);
  console.log(`   Title: ${booking.title}`);
  console.log(`   Start: ${booking.start}`);
  console.log(`   End: ${booking.end}`);
  console.log(`   Attendee: ${attendee.name} (${attendee.email})`);
  console.log(`   Timezone: ${attendee.timeZone}\n`);

  return booking;
}

// Get a booking by UID
export function getBookingByUid(uid: string): CalcomBooking | undefined {
  const bookings = loadBookings();
  return bookings.get(uid);
}

// Get all bookings
export function getAllBookings(): CalcomBooking[] {
  const bookings = loadBookings();
  return Array.from(bookings.values()).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

// Clear all bookings
export function clearBookings(): void {
  saveBookings(new Map());
}

// Initialize demo bookings if JSON file doesn't exist or is empty
function initializeDemoBookings() {
  ensureDataDir();
  
  // Check if we already have bookings
  const existing = loadBookings();
  if (existing.size > 0) {
    console.log(`\n📅 Loaded ${existing.size} existing bookings from ${BOOKINGS_FILE}\n`);
    return;
  }

  console.log('\n🔧 No bookings found, creating demo data...\n');

  const names = [
    'Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown',
    'Emma Davis', 'Frank Miller', 'Grace Wilson', 'Henry Moore',
    'Ivy Taylor', 'Jack Anderson', 'Kate Thomas', 'Leo Jackson',
    'Maria Garcia', 'Nathan Lee', 'Olivia Martinez', 'Peter Wong',
  ];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const defaultTimezone = 'America/Los_Angeles';
  const random = seededRandom(42);
  const bookings = new Map<string, CalcomBooking>();

  // Create bookings across the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    // Generate slots for this day (without checking existing bookings)
    const dateStr = date.toISOString().split('T')[0];
    const dayRandom = seededRandom(dateSeed(dateStr));
    const tzOffset = getTimezoneOffset(defaultTimezone);
    const startHourUtc = 9 - tzOffset;
    const endHourUtc = 17 - tzOffset;

    const allSlots: Date[] = [];
    for (let hour = startHourUtc; hour < endHourUtc; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
        const slotTime = new Date(date);
        slotTime.setUTCHours(hour, minute, 0, 0);
        allSlots.push(slotTime);
      }
    }

    const numSlotsToday = Math.floor(dayRandom() * 7) + 6;
    const shuffled = [...allSlots].sort(() => dayRandom() - 0.5);
    const daySlots = shuffled.slice(0, numSlotsToday);

    // Book 4-7 slots per day
    const numToBook = Math.floor(random() * 4) + 4;
    const usedIndices = new Set<number>();

    for (let i = 0; i < numToBook && usedIndices.size < daySlots.length; i++) {
      let slotIndex: number;
      do {
        slotIndex = Math.floor(random() * daySlots.length);
      } while (usedIndices.has(slotIndex) && usedIndices.size < daySlots.length);

      usedIndices.add(slotIndex);
      const slotTime = daySlots[slotIndex];

      if (slotTime) {
        const id = Math.floor(Math.random() * 100000);
        const uid = `demo_${dayOffset}_${i}_${id}`;
        const name = names[Math.floor(random() * names.length)];
        const startDate = slotTime;
        const endDate = new Date(startDate.getTime() + SLOT_DURATION * 60 * 1000);

        const booking: CalcomBooking = {
          id,
          uid,
          title: `Meeting with ${name}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          status: 'accepted',
          attendees: [{
            name,
            email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
            timeZone: defaultTimezone,
          }],
        };

        bookings.set(uid, booking);
      }
    }
  }

  saveBookings(bookings);
  console.log(`\n📅 Initialized ${bookings.size} demo bookings across 7 days\n`);
  console.log(`📁 Bookings saved to: ${BOOKINGS_FILE}\n`);
}

// Initialize on module load
initializeDemoBookings();
