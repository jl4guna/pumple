import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Guest } from '@/app/types'; // Import shared Guest type

// Remove local Guest interface definition
// interface Guest { ... }

// Define props using imported Guest type
interface GuestStatsProps {
  guests: Guest[];
}

const GuestStats: React.FC<GuestStatsProps> = ({ guests }) => {
  // Calculate statistics
  const confirmedGuests = guests.filter((g) => g.status === 'confirmed');
  const pendingGuests = guests.filter((g) => g.status === 'pending');

  const totalConfirmedAdults = confirmedGuests.reduce(
    (sum, guest) => sum + guest.adults,
    0
  );
  const totalConfirmedChildren = confirmedGuests.reduce(
    (sum, guest) => sum + guest.children,
    0
  );

  const totalPendingAdults = pendingGuests.reduce(
    (sum, guest) => sum + guest.adults,
    0
  );
  const totalPendingChildren = pendingGuests.reduce(
    (sum, guest) => sum + guest.children,
    0
  );

  return (
    <div className='grid gap-4 md:grid-cols-2 mb-6'>
      {/* Card for Confirmed Guests */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Invitados Confirmados
          </CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'>
            <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path>
            <circle cx='9' cy='7' r='4'></circle>
            <path d='M22 21v-2a4 4 0 0 0-3-3.87'></path>
            <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold mb-2'>
            {totalConfirmedAdults + totalConfirmedChildren} Total
          </div>
          <div className='text-sm text-muted-foreground'>
            <p>Adultos: {totalConfirmedAdults}</p>
            <p>Niños: {totalConfirmedChildren}</p>
          </div>
        </CardContent>
      </Card>

      {/* Card for Pending Guests */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Invitados Pendientes
          </CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'>
            <path d='M22 12h-4l-3 9L9 3l-3 9H2'></path>
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold mb-2'>
            {totalPendingAdults + totalPendingChildren} Total
          </div>
          <div className='text-sm text-muted-foreground'>
            <p>Adultos: {totalPendingAdults}</p>
            <p>Niños: {totalPendingChildren}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestStats;
