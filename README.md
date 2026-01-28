# Scheduling Application

A scheduling application for booking appointments.

## Getting Started

```bash
bun install
bun dev
```

To refresh data
```bash
bun dev:clean
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Your Task

This application has bugs. Find and fix them.

## What You Can Modify

```
src/
├── components/
│   ├── SchedulerPage.tsx      # Main page
│   ├── DatePicker.tsx         # Date selection
│   ├── SlotList.tsx           # Time slot display
│   ├── BookingForm.tsx        # Booking form
│   └── BookingsList.tsx       # Bookings display
│
└── services/
    ├── config.ts              # Service configuration
    ├── calcomClient.ts        # API client
    ├── availabilityService.ts # Slot fetching
    └── bookingService.ts      # Booking logic
```

## What You Should NOT Modify

```
src/
├── app/api/         # API routes
├── lib/             # Database & config
└── types/           # Type definitions
```

---

Good luck!
