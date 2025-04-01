import React, { useState, useEffect, useRef } from 'react';
import AddGuestForm from './AddGuestForm'; // Importar AddGuestForm
import GuestList from './GuestList'; // Importar GuestList
import GuestStats from './GuestStats'; // Import the new stats component
import { Button } from '@/components/ui/button'; // Import Button for export/import
import Papa from 'papaparse'; // Import papaparse
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

  // --- CSV Export Logic ---
  const handleExportCSV = () => {
    if (guests.length === 0) {
      alert('No hay invitados para exportar.');
      return;
    }

    // We only need specific fields for export, excluding 'id'
    const dataToExport = guests.map(({ name, status, adults, children }) => ({
      Nombre: name,
      Estado: status,
      Adultos: adults,
      Niños: children,
    }));

    const csv = Papa.unparse(dataToExport);

    // Create a Blob from the CSV string
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // Create a link element
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // Check if browser supports download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'invitados_fiesta.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the object URL
    } else {
      alert('La exportación directa no es soportada por tu navegador.');
    }
  };

  // --- CSV Import Logic ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Updated handleFileChange to parse and process the CSV
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return; // No file selected
    }

    Papa.parse<Record<string, string>>(file, {
      header: true, // Expect headers (Nombre, Estado, Adultos, Niños)
      skipEmptyLines: true,
      complete: (results) => {
        const importedGuests: Guest[] = [];
        let errors: string[] = [];

        results.data.forEach((row, index) => {
          const name = row.Nombre?.trim();
          const status = row.Estado?.trim().toLowerCase() as Guest['status'];
          const adults = parseInt(row.Adultos, 10);
          const children = parseInt(row.Niños, 10);

          // Basic Validation
          if (!name) {
            errors.push(`Fila ${index + 2}: Falta el nombre.`);
            return; // Skip this row
          }
          if (!['pending', 'confirmed', 'declined'].includes(status)) {
            errors.push(
              `Fila ${index + 2} (${name}): Estado inválido ('${
                row.Estado
              }'). Usar 'pending', 'confirmed', o 'declined'.`
            );
            return; // Skip this row
          }
          if (isNaN(adults) || adults < 0) {
            errors.push(
              `Fila ${index + 2} (${name}): Número de adultos inválido ('${
                row.Adultos
              }').`
            );
            return; // Skip this row
          }
          if (isNaN(children) || children < 0) {
            errors.push(
              `Fila ${index + 2} (${name}): Número de niños inválido ('${
                row.Niños
              }').`
            );
            return; // Skip this row
          }
          if (adults === 0 && children > 0) {
            errors.push(
              `Fila ${
                index + 2
              } (${name}): Debe haber al menos 1 adulto si hay niños.`
            );
            return; // Skip this row
          }
          if (adults + children === 0) {
            errors.push(
              `Fila ${
                index + 2
              } (${name}): Debe haber al menos 1 asistente (adulto o niño).`
            );
            return; // Skip this row
          }

          // Add valid guest
          importedGuests.push({
            id: Date.now() + index, // Generate a pseudo-unique ID
            name,
            status,
            adults,
            children,
          });
        });

        if (errors.length > 0) {
          // Show errors to the user
          alert(
            `Errores al importar:\n\n${errors.join(
              '\n'
            )}\n\nNo se importaron las filas con errores.`
          );
        }

        if (importedGuests.length > 0) {
          // Ask for confirmation before replacing the list
          const replaceConfirm = window.confirm(
            `Se importaron ${importedGuests.length} invitados válidos. ¿Deseas reemplazar la lista actual con estos invitados?`
          );
          if (replaceConfirm) {
            setGuests(importedGuests);
            alert('Lista de invitados importada con éxito.');
          }
        } else if (errors.length === 0) {
          alert('No se encontraron invitados válidos en el archivo.');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert(`Error al leer el archivo CSV: ${error.message}`);
      },
    });

    // Reset file input to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8'>
      <h1 className='text-2xl font-bold mb-6 text-center'>
        Administración de Invitados
      </h1>

      {/* Render GuestStats component here, passing the guests list */}
      <GuestStats guests={guests} />

      {/* Export/Import Buttons Section */}
      <div className='flex justify-end space-x-2 mb-4'>
        {' '}
        {/* Align buttons to the right */}
        <Button variant='outline' onClick={handleExportCSV}>
          Exportar CSV
        </Button>
        {/* Import Button - will trigger hidden file input */}
        <Button variant='outline' onClick={handleImportClick}>
          Importar CSV
        </Button>
        {/* Hidden file input */}
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          accept='.csv'
          style={{ display: 'none' }}
        />
      </div>

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
