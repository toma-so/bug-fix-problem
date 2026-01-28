// Mock Database for scheduling API
// Uses JSON file for persistence

import { CalcomBooking, CalcomSlot } from '@/types';
import { config } from './config';
import * as fs from 'fs';
import * as path from 'path';

// Slot interval in minutes
const SLOT_INTERVAL = 30;
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

// Generate ALL possible slots for a date (9 AM - 5 PM in host timezone)
// Returns raw slots - filtering is done by the service layer
function generateSlotsForDate(date: Date): CalcomSlot[] {
  const dateStr = date.toISOString().split('T')[0];
  const random = seededRandom(dateSeed(dateStr));

  // Generate slots in host's business hours (converted to UTC)
  const tzOffset = getTimezoneOffset(config.hostTimezone);
  const startHourUtc = config.businessHours.start - tzOffset;
  const endHourUtc = config.businessHours.end - tzOffset;

  const allPossibleSlots: Date[] = [];
  for (let hour = startHourUtc; hour < endHourUtc; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL) {
      const slotTime = new Date(date);
      slotTime.setUTCHours(hour, minute, 0, 0);
      allPossibleSlots.push(slotTime);
    }
  }

  // Randomly select a subset of slots to simulate varying availability
  const numSlotsToday = Math.floor(random() * 7) + 6;
  const shuffled = [...allPossibleSlots].sort(() => random() - 0.5);
  const selectedSlots = shuffled.slice(0, numSlotsToday);
  selectedSlots.sort((a, b) => a.getTime() - b.getTime());

  return selectedSlots.map(slot => ({ time: slot.toISOString() }));
}

// Generate slots for a date range (raw, unfiltered)
export function generateSlotsForDateRange(
  startDate: string,
  endDate: string
): { slots: CalcomSlot[]; totalCount: number } {
  const slots: CalcomSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const currentDate = new Date(start);
  currentDate.setUTCHours(0, 0, 0, 0);

  while (currentDate < end) {
    const daySlots = generateSlotsForDate(currentDate);
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

// Get all slots for a date range (raw data)
export function getAllSlots(
  startDate: string,
  endDate: string
): { data: CalcomSlot[] } {
  const { slots } = generateSlotsForDateRange(startDate, endDate);
  return { data: slots };
}

// Get all bookings (for filtering in service layer)
export function getAllBookings(): CalcomBooking[] {
  const bookings = loadBookings();
  return Array.from(bookings.values()).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
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

// Create a booking
export function createBooking(
  eventTypeId: number,
  start: string,
  duration: number,
  attendee: { name: string; email: string; timeZone: string }
): CalcomBooking {
  const bookings = loadBookings();
  
  const id = Math.floor(Math.random() * 100000);
  const uid = `booking_${Date.now()}_${id}`;

  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const booking: CalcomBooking = {
    id,
    uid,
    title: `Meeting with ${attendee.name}`,
    start,
    end: endDate.toISOString(),
    duration,
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
  console.log(`   Duration: ${duration} minutes`);
  console.log(`   Attendee: ${attendee.name} (${attendee.email})`);
  console.log(`   Timezone: ${attendee.timeZone}\n`);

  return booking;
}

// Get a booking by UID
export function getBookingByUid(uid: string): CalcomBooking | undefined {
  const bookings = loadBookings();
  return bookings.get(uid);
}

// Clear all bookings
export function clearBookings(): void {
  saveBookings(new Map());
}

// Initialize demo bookings if JSON file doesn't exist or is empty
function initializeDemoBookings() {
  ensureDataDir();
  
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

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    const dateStr = date.toISOString().split('T')[0];
    const dayRandom = seededRandom(dateSeed(dateStr));
    const tzOffset = getTimezoneOffset(config.hostTimezone);
    const startHourUtc = config.businessHours.start - tzOffset;
    const endHourUtc = config.businessHours.end - tzOffset;

    const allSlots: Date[] = [];
    for (let hour = startHourUtc; hour < endHourUtc; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_INTERVAL) {
        const slotTime = new Date(date);
        slotTime.setUTCHours(hour, minute, 0, 0);
        allSlots.push(slotTime);
      }
    }

    const numSlotsToday = Math.floor(dayRandom() * 7) + 6;
    const shuffled = [...allSlots].sort(() => dayRandom() - 0.5);
    const daySlots = shuffled.slice(0, numSlotsToday);

    // Vary bookings: days 0,2,4 have 2-4, days 1,3,5,6 have 6-8
    const numToBook = dayOffset % 2 === 0 
      ? Math.floor(random() * 3) + 2
      : Math.floor(random() * 3) + 6;
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
        const duration = random() > 0.7 ? 60 : 30;
        const endDate = new Date(slotTime.getTime() + duration * 60 * 1000);

        const booking: CalcomBooking = {
          id,
          uid,
          title: `Meeting with ${name}`,
          start: slotTime.toISOString(),
          end: endDate.toISOString(),
          duration,
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
