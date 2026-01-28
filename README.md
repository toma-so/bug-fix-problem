# Scheduling Application

A scheduling application that allows users to book appointments. The app displays available time slots and lets users create bookings.

## Getting Started

```bash
# Install dependencies
bun install

# Start the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Your Task

This application has **3 bugs** that need to be fixed. Your goal is to:

1. Identify the bugs by using the application
2. Find the root cause in the code
3. Implement fixes

**Time limit:** 45 minutes

## Guidelines

- All bugs are in the `/src` directory
- The `/src/app/api/` routes are the mock backend — assume they work correctly
- The terminal logs show API requests and responses — use them!
- Think out loud as you debug so we can follow your reasoning

## Project Structure

```
src/
├── components/          # React components
│   ├── SchedulerPage.tsx    # Main page orchestrating the flow
│   ├── DatePicker.tsx       # Date selection UI
│   ├── SlotList.tsx         # Displays available time slots
│   ├── BookingForm.tsx      # Form to create a booking
│   └── BookingsList.tsx     # Shows existing bookings
│
├── services/            # Business logic & API calls
│   ├── calcomClient.ts      # Low-level API client
│   ├── availabilityService.ts   # Fetches & formats available slots
│   └── bookingService.ts    # Handles booking operations
│
├── types/               # TypeScript type definitions
│   └── index.ts
│
└── app/api/             # Mock API routes (assume correct)
    ├── slots/route.ts
    └── bookings/
        ├── route.ts
        └── list/route.ts
```

## How the App Works

1. **Date Selection**: User picks a date from the date picker
2. **Slot Display**: Available time slots for that date are shown
3. **Booking**: User selects a slot, fills in their details, and books
4. **Confirmation**: The booking appears in the "Your Bookings" panel

## Helpful Information

- The app uses a mock backend that simulates a scheduling API
- Times are stored in UTC but displayed in your local timezone
- Each day has pre-seeded bookings to simulate a realistic schedule
- The terminal shows detailed logs of all API requests and responses

## Commands

```bash
bun dev          # Start development server
bun install      # Install dependencies
```

---

Good luck! 🍀
