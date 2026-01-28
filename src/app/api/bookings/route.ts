import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/mockDb';
import { BookingRequest, CalcomBookingResponse } from '@/types';

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  console.log('\n📥 [API] POST /api/bookings');

  try {
    const body: BookingRequest = await request.json();

    console.log('   Request body:', {
      eventTypeId: body.eventTypeId,
      start: body.start,
      attendee: body.attendee,
    });

    // Validate required fields
    if (!body.eventTypeId || !body.start || !body.attendee) {
      console.log('   ❌ Error: Missing required fields');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields: eventTypeId, start, attendee',
        },
        { status: 400 }
      );
    }

    if (!body.attendee.name || !body.attendee.email || !body.attendee.timeZone) {
      console.log('   ❌ Error: Incomplete attendee data');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Attendee must have name, email, and timeZone',
        },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const booking = createBooking(body.eventTypeId, body.start, body.attendee);

    const response: CalcomBookingResponse = {
      status: 'success',
      data: booking,
    };

    console.log('   ✅ Booking created:', {
      id: booking.id,
      uid: booking.uid,
      start: booking.start,
      end: booking.end,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.log('   ❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
