import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
// Remove standard Input import if only NumericInput is used for numbers
// import { Input } from '@/components/ui/input';
import { Input } from '@/components/ui/input'; // Keep for Name input
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericInput } from '@/components/ui/numeric-input'; // Import the new component

// Define the props for the component
interface AddGuestFormProps {
  // Update prop to accept adults and children
  onAddGuest: (name: string, adults: number, children: number) => void;
}

const AddGuestForm: React.FC<AddGuestFormProps> = ({ onAddGuest }) => {
  // State for guest name
  const [guestName, setGuestName] = useState('');
  // State for adults, initialize to 1
  const [adults, setAdults] = useState(1);
  // State for children, initialize to 0
  const [children, setChildren] = useState(0);

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Use the state values directly as they should be valid numbers controlled by NumericInput
    const numAdults = adults;
    const numChildren = children;

    if (guestName.trim() && numAdults + numChildren > 0) {
      // Ensure at least one person is attending
      if (numAdults <= 0 && numChildren > 0) {
        alert('Debe haber al menos un adulto por invitación.');
        return; // Prevent submission if only children are specified without adults
      }
      onAddGuest(guestName.trim(), numAdults, numChildren);
      setGuestName('');
      setAdults(1); // Reset adults to 1
      setChildren(0); // Reset children to 0
    } else if (!guestName.trim()) {
      alert('Por favor, introduce el nombre del invitado.');
    } else {
      alert(
        'El número total de asistentes (adultos + niños) debe ser al menos 1.'
      );
    }
  };

  return (
    <Card className='w-full max-w-sm mb-6'>
      <CardHeader>
        <CardTitle className='text-lg'>Añadir Nuevo Invitado</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Name Input */}
          <div className='grid gap-2'>
            <Label htmlFor='guestName'>Nombre</Label>
            <Input
              id='guestName'
              type='text'
              value={guestName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGuestName(e.target.value)
              }
              placeholder='Nombre completo del invitado'
              required
            />
          </div>
          {/* Adults Input */}
          <div className='grid gap-2'>
            <Label htmlFor='adults'>Adultos</Label>
            <NumericInput
              id='adults'
              value={adults}
              onChange={setAdults} // Pass the state setter directly
              min={0} // Allow 0 adults initially
              // No need for required here as validation is in handleSubmit
            />
          </div>
          {/* Children Input */}
          <div className='grid gap-2'>
            <Label htmlFor='children'>Niños</Label>
            <NumericInput
              id='children'
              value={children}
              onChange={setChildren} // Pass the state setter directly
              min={0} // Allow 0 children
              // No need for required here
            />
          </div>
          <Button type='submit' className='w-full'>
            Añadir Invitado
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddGuestForm;
