import { NextRequest, NextResponse } from 'next/server';
import { getAllSlots } from '@/lib/mockDb';
import { CalcomSlotResponse } from '@/types';

// GET /api/slots - Get available time slots
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const eventTypeId = searchParams.get('eventTypeId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const timeZone = searchParams.get('timeZone') || 'UTC';

  // Log the incoming request
  console.log('\n📥 [API] GET /api/slots');
  console.log('   Parameters:', {
    eventTypeId,
    start,
    end,
    timeZone,
  });

  // Validate required parameters
  if (!eventTypeId || !start || !end) {
    console.log('   ❌ Error: Missing required parameters');
    return NextResponse.json(
      {
        status: 'error',
        message: 'Missing required parameters: eventTypeId, start, end',
      },
      { status: 400 }
    );
  }

  // Simulate some network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    const { data } = getAllSlots(start, end);

    const response: CalcomSlotResponse = {
      status: 'success',
      data,
    };

    // Log the response
    console.log('   ✅ Response:', {
      slotsReturned: data.length,
      slots: data.map((s) => s.time),
    });

    return NextResponse.json(response);
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
