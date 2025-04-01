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
  const totalConfirmed = totalConfirmedAdults + totalConfirmedChildren;
  const totalPending = pendingGuests.length; // Count pending invitations

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
      {' '}
      {/* Responsive grid layout, margin bottom */}
      {/* Card for Total Confirmed */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Total Confirmados
          </CardTitle>
          {/* Optional: Add an icon here */}
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
          <div className='text-2xl font-bold'>{totalConfirmed}</div>
          {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> // Example subtext */}
        </CardContent>
      </Card>
      {/* Card for Confirmed Adults */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Adultos Confirmados
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
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{totalConfirmedAdults}</div>
        </CardContent>
      </Card>
      {/* Card for Confirmed Children */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Niños Confirmados
          </CardTitle>
          {/* Basic child icon idea */}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'>
            <path d='M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 10c-4 0-6-2-6-4v-1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1c0 2-2 4-6 4z'></path>
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{totalConfirmedChildren}</div>
        </CardContent>
      </Card>
      {/* Card for Pending Invitations */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Invitaciones Pendientes
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
          <div className='text-2xl font-bold'>{totalPending}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestStats;
