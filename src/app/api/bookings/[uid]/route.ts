import { NextRequest, NextResponse } from 'next/server';
import { getBookingByUid } from '@/lib/mockDb';
import { CalcomBookingResponse } from '@/types';

// GET /api/bookings/:uid - Get a booking by UID
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const { uid } = params;

  console.log('\n📥 [API] GET /api/bookings/' + uid);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const booking = getBookingByUid(uid);

  if (!booking) {
    console.log('   ❌ Booking not found');
    return NextResponse.json(
      {
        status: 'error',
        message: 'Booking not found',
      },
      { status: 404 }
    );
  }

  const response: CalcomBookingResponse = {
    status: 'success',
    data: booking,
  };

  console.log('   ✅ Booking found:', {
    id: booking.id,
    uid: booking.uid,
    start: booking.start,
    status: booking.status,
  });

  return NextResponse.json(response);
}
