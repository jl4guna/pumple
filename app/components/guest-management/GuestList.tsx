import React from 'react';
import { Button } from '@/components/ui/button'; // Import Button
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Import Select components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Import Table components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components

// Re-using the Guest interface (consider moving to a shared types file)
interface Guest {
  id: number;
  name: string;
  status: 'pending' | 'confirmed' | 'declined';
  adults: number;
  children: number;
}

// Define the props for the component
interface GuestListProps {
  guests: Guest[]; // The list of guests to display
  onUpdateStatus: (id: number, newStatus: Guest['status']) => void; // Function to update status
  onRemoveGuest: (id: number) => void; // Function to remove guest
}

const GuestList: React.FC<GuestListProps> = ({
  guests,
  onUpdateStatus,
  onRemoveGuest,
}) => {
  // Helper to get display text for status
  const getStatusText = (status: Guest['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'declined':
        return 'Rechazado';
      default:
        return '';
    }
  };

  return (
    <Card className='w-full'>
      {' '}
      {/* Wrap table in a Card */}
      <CardHeader>
        <CardTitle className='text-lg'>Lista de Invitados</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add a container div for horizontal scrolling on small screens */}
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                {/* Consider adding min-width to prevent excessive shrinking */}
                <TableHead className='min-w-[150px]'>Nombre</TableHead>
                <TableHead className='w-[80px] text-center'>Adultos</TableHead>
                <TableHead className='w-[80px] text-center'>Niños</TableHead>
                <TableHead className='min-w-[180px]'>Estado</TableHead>{' '}
                {/* Ensure status select fits */}
                <TableHead className='text-right min-w-[100px]'>
                  Acciones
                </TableHead>{' '}
                {/* Ensure button fits */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center h-24'>
                    {' '}
                    {/* Span across columns and center text */}
                    No hay invitados todavía.
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className='font-medium'>{guest.name}</TableCell>{' '}
                    {/* Medium font weight for name */}
                    <TableCell className='text-center'>
                      {guest.adults}
                    </TableCell>
                    <TableCell className='text-center'>
                      {guest.children}
                    </TableCell>
                    <TableCell>
                      {/* Select component for status */}
                      <Select
                        value={guest.status}
                        onValueChange={(newStatus: Guest['status']) => {
                          onUpdateStatus(guest.id, newStatus);
                        }}>
                        <SelectTrigger className='w-full'>
                          {' '}
                          {/* Allow trigger to fill cell */}
                          <SelectValue placeholder='Seleccionar estado' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='pending'>Pendiente</SelectItem>
                          <SelectItem value='confirmed'>Confirmado</SelectItem>
                          <SelectItem value='declined'>Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className='text-right'>
                      {' '}
                      {/* Align button to the right */}
                      <Button
                        variant='outline' // Use outline style for less emphasis
                        size='sm' // Smaller button
                        onClick={() => onRemoveGuest(guest.id)}>
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuestList;
