import { NextRequest, NextResponse } from 'next/server';
import { getPaginatedBookings } from '@/lib/mockDb';

// GET /api/bookings/list - Get bookings with pagination
// Uses offset-based pagination with take/skip
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Pagination parameters
  const take = parseInt(searchParams.get('take') || '5', 10);
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  
  // Optional date filters
  const afterStart = searchParams.get('afterStart') || undefined;
  const beforeEnd = searchParams.get('beforeEnd') || undefined;

  console.log('\n📥 [API] GET /api/bookings/list');
  console.log('   Parameters:', {
    take,
    skip,
    afterStart: afterStart || '(none)',
    beforeEnd: beforeEnd || '(none)',
  });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const { data, pagination } = getPaginatedBookings(take, skip, afterStart, beforeEnd);

  console.log('   ✅ Response:', {
    bookingsReturned: pagination.returnedItems,
    totalBookings: pagination.totalItems,
    hasNextPage: pagination.hasNextPage,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    bookings: data.map((b) => `${b.start} - ${b.title}`),
  });

  return NextResponse.json({
    status: 'success',
    data,
    pagination,
  });
}
