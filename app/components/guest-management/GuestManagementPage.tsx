import React, { useState, useEffect } from 'react';
import AddGuestForm from './AddGuestForm'; // Importar AddGuestForm
import GuestList from './GuestList'; // Importar GuestList
import GuestStats from './GuestStats'; // Import the new stats component
// Importaremos los otros componentes aquí más tarde

// Define the structure of a guest object
interface Guest {
  id: number;
  name: string;
  status: 'pending' | 'confirmed' | 'declined';
  adults: number;
  children: number;
}

// Define the key for localStorage
const LOCAL_STORAGE_KEY = 'partyGuests';

const GuestManagementPage: React.FC = () => {
  // State to hold the list of guests
  const [guests, setGuests] = useState<Guest[]>(() => {
    if (typeof window !== 'undefined') {
      const storedGuests = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedGuests) {
        try {
          const parsedGuests = JSON.parse(storedGuests);
          // Migrate old data: ensure guests have adults/children fields
          return parsedGuests.map((guest: any) => ({
            id: guest.id,
            name: guest.name,
            status: guest.status,
            // If adults/children exist, use them. Otherwise, migrate from attendees (assuming all adults), default to 1 adult if nothing exists.
            adults:
              guest.adults !== undefined
                ? Number(guest.adults)
                : guest.attendees !== undefined
                ? Number(guest.attendees)
                : 1,
            children: guest.children !== undefined ? Number(guest.children) : 0, // Default children to 0 if missing
          }));
        } catch (error) {
          console.error(
            'Error parsing/migrating guests from localStorage',
            error
          );
          return [];
        }
      }
    }
    return [];
  });

  // useEffect to save guests to localStorage whenever the 'guests' state changes
  useEffect(() => {
    // Check if window is defined
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(guests)); // Stringify and save
      } catch (error) {
        console.error('Error saving guests to localStorage', error);
      }
    }
  }, [guests]); // Dependency array includes 'guests'

  // Function to add a new guest
  // Update signature to accept adults and children
  const handleAddGuest = (name: string, adults: number, children: number) => {
    const newGuest: Guest = {
      id: Date.now(),
      name,
      adults, // Add adults
      children, // Add children
      status: 'pending',
    };
    setGuests((prevGuests) => [...prevGuests, newGuest]);
  };

  // Function to update a guest's status (will be passed to GuestList/GuestItem)
  const handleUpdateStatus = (id: number, newStatus: Guest['status']) => {
    setGuests((prevGuests) =>
      prevGuests.map((guest) =>
        guest.id === id ? { ...guest, status: newStatus } : guest
      )
    );
  };

  // Function to remove a guest (optional, we can add this later)
  const handleRemoveGuest = (id: number) => {
    setGuests((prevGuests) => prevGuests.filter((guest) => guest.id !== id));
  };

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8'>
      <h1 className='text-2xl font-bold mb-6 text-center'>
        Administración de Invitados
      </h1>

      {/* Render GuestStats component here, passing the guests list */}
      <GuestStats guests={guests} />

      <div className='flex flex-col md:flex-row md:space-x-6'>
        <div className='flex-shrink-0 md:w-1/3 mb-6 md:mb-0'>
          <AddGuestForm onAddGuest={handleAddGuest} />
        </div>

        <div className='flex-grow'>
          <GuestList
            guests={guests}
            onUpdateStatus={handleUpdateStatus}
            onRemoveGuest={handleRemoveGuest}
          />
        </div>
      </div>
    </div>
  );
};

export default GuestManagementPage;
