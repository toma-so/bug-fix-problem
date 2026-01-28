import { Suspense } from 'react';
import { SchedulerPage } from '@/components/SchedulerPage';

function LoadingFallback() {
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div className="flex gap-2 mb-6">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-16 w-16 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <Suspense fallback={<LoadingFallback />}>
        <SchedulerPage />
      </Suspense>
    </main>
  );
}
