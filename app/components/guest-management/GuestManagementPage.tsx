import React, { useState, useEffect, useRef } from 'react';
import AddGuestForm from './AddGuestForm'; // Importar AddGuestForm
import GuestList from './GuestList'; // Importar GuestList
import GuestStats from './GuestStats'; // Import the new stats component
// Import Skeleton for loading state
import { Skeleton } from '@/components/ui/skeleton';
import type { Guest, ApiResponse } from '@/app/types'; // Import shared types using alias
import { Button } from '@/components/ui/button';
// Importaremos los otros componentes aquí más tarde

const GuestManagementPage: React.FC = () => {
  // State for guests, initialized as empty
  const [guests, setGuests] = useState<Guest[]>([]);
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  // State for error messages
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Refetch Guests Function --- //
  // Extract fetch logic into a reusable function
  const fetchGuests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/guests');
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData: ApiResponse = await response.json();
          errorMsg = errData.error || errData.message || errorMsg;
        } catch {
          /* Ignore */
        }
        throw new Error(errorMsg);
      }
      const data: ApiResponse<Guest> = await response.json();
      if (data.success && Array.isArray(data.guests)) {
        setGuests(data.guests);
      } else {
        throw new Error(data.error || 'Invalid data format from API');
      }
    } catch (e: any) {
      console.error('Failed to fetch guests:', e);
      setError(`Error al cargar invitados: ${e.message}`);
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchGuests();
  }, []);

  // Function to add a new guest
  // Update signature to accept adults and children
  const handleAddGuest = async (
    name: string,
    adults: number,
    children: number
  ) => {
    setError(null); // Clear previous errors
    // Optionally add a specific loading state for the form

    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, adults, children }),
      });

      const data: ApiResponse<Guest> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.guest) {
        // Add the new guest (returned by the API with its ID) to the state
        setGuests((prevGuests) => [data.guest!, ...prevGuests]);
      } else {
        // If API didn't return the guest, refetch? Or just show message?
        console.warn('Guest added, but API did not return the guest object.');
        // Optionally refetch all guests: fetchGuests(); // Implement fetchGuests as a reusable function if needed
      }
    } catch (e: any) {
      console.error('Failed to add guest:', e);
      setError(`Error al añadir invitado: ${e.message}`);
      // Optionally provide more specific user feedback
    } finally {
      // Optionally stop the form-specific loading state
    }
  };

  // Function to update a guest's status (will be passed to GuestList/GuestItem)
  const handleUpdateStatus = async (id: number, newStatus: Guest['status']) => {
    setError(null);
    // Store the original state in case we need to revert on error (optimistic update)
    const originalGuests = [...guests];

    // Optimistic UI Update:
    setGuests((prevGuests) =>
      prevGuests.map((guest) =>
        guest.id === id ? { ...guest, status: newStatus } : guest
      )
    );

    try {
      const response = await fetch(`/api/guests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data: ApiResponse<Guest> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Optional: If API returns the updated guest, ensure our state matches
      if (data.guest) {
        setGuests((prevGuests) =>
          prevGuests.map((guest) =>
            guest.id === data.guest!.id ? data.guest! : guest
          )
        );
      }
      // If update was successful on server, our optimistic update was correct.
    } catch (e: any) {
      console.error(`Failed to update status for guest ${id}:`, e);
      setError(`Error al actualizar estado: ${e.message}`);
      // Revert optimistic update on error
      setGuests(originalGuests);
    }
  };

  // Function to remove a guest (optional, we can add this later)
  const handleRemoveGuest = async (id: number) => {
    setError(null);
    const originalGuests = [...guests];

    // Optimistic UI Update:
    setGuests((prevGuests) => prevGuests.filter((guest) => guest.id !== id));

    try {
      const response = await fetch(`/api/guests/${id}`, {
        method: 'DELETE',
      });

      // Check if response is ok, even if no content
      if (!response.ok) {
        // Try to get error message from body
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const data: ApiResponse = await response.json();
          errorMsg = data.error || errorMsg;
        } catch {
          /* Ignore if no JSON body */
        }
        throw new Error(errorMsg);
      }

      // Check for specific success response if API provides one, otherwise assume ok means success
      // const data = await response.json(); // Only if DELETE returns a body
      // if (!data.success) { throw new Error(data.error || 'Deletion failed'); }

      // If successful, optimistic update was correct.
    } catch (e: any) {
      console.error(`Failed to remove guest ${id}:`, e);
      setError(`Error al eliminar invitado: ${e.message}`);
      // Revert optimistic update
      setGuests(originalGuests);
    }
  };

  // --- CSV Export Logic (Manual Implementation) ---
  const handleExportCSV = () => {
    // No longer async
    if (guests.length === 0) {
      alert('No hay invitados para exportar.');
      return;
    }

    const headers = ['Nombre', 'Estado', 'Adultos', 'Niños'];
    // Escape commas and quotes in names, handle potential null/undefined values just in case
    const escapeCSV = (value: string | number | null | undefined): string => {
      const str = String(value ?? ''); // Ensure string, default to empty if null/undefined
      // If the string contains a comma, double quote, or newline, enclose in double quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Within quoted string, double quotes must be escaped by doubling them
        return `\"${str.replace(/"/g, '""')}\"`;
      }
      return str;
    };

    // Map data rows, ensuring order matches headers and values are escaped
    const rows = guests.map((guest) =>
      [
        escapeCSV(guest.name),
        escapeCSV(guest.status),
        escapeCSV(guest.adults),
        escapeCSV(guest.children),
      ].join(',')
    ); // Join cells with comma

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n'); // Join rows with newline

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'invitados_fiesta.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('La exportación directa no es soportada por tu navegador.');
    }
  };

  // --- CSV Import Logic (Manual Implementation) ---
  const handleImportClick = () => {
    // Reset file input value before opening dialog
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // No longer async
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      // Make the onload async to call API
      const text = e.target?.result;
      if (typeof text !== 'string') {
        alert('Error al leer el contenido del archivo.');
        return;
      }

      // Simple CSV Parsing (split by lines, then by comma)
      // Assumes comma is the delimiter and doesn't handle commas within quoted fields complexly
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        // Need at least header + 1 data row
        alert('Archivo CSV vacío o inválido (necesita cabecera y datos).');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const expectedHeaders = ['Nombre', 'Estado', 'Adultos', 'Niños'];

      // Basic header validation
      if (
        headers.length !== expectedHeaders.length ||
        !expectedHeaders.every((h, i) => headers[i] === h)
      ) {
        alert(
          `Cabeceras inválidas. Se esperaban: ${expectedHeaders.join(', ')}`
        );
        return;
      }

      const guestsToImport: Omit<Guest, 'id'>[] = [];
      let validationErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(','); // Simple split, won't handle commas in quotes well
        if (values.length !== headers.length) {
          validationErrors.push(
            `Fila ${i + 1}: Número incorrecto de columnas.`
          );
          continue; // Skip row
        }

        // Trim values - assumes no complex quoting needed for simple data
        const name = values[0]?.trim();
        const status = values[1]?.trim().toLowerCase() as Guest['status'];
        const adults = parseInt(values[2]?.trim(), 10);
        const children = parseInt(values[3]?.trim(), 10);

        // Basic Validation (same as before)
        if (!name) {
          validationErrors.push(`Fila ${i + 1}: Falta el nombre.`);
          continue;
        }
        if (!['pending', 'confirmed', 'declined'].includes(status)) {
          validationErrors.push(`Fila ${i + 1} (${name}): Estado inválido.`);
          continue;
        }
        if (isNaN(adults) || adults < 0) {
          validationErrors.push(`Fila ${i + 1} (${name}): Adultos inválido.`);
          continue;
        }
        if (isNaN(children) || children < 0) {
          validationErrors.push(`Fila ${i + 1} (${name}): Niños inválido.`);
          continue;
        }
        if (adults === 0 && children > 0) {
          validationErrors.push(
            `Fila ${i + 1} (${name}): Adulto requerido si hay niños.`
          );
          continue;
        }
        if (adults + children === 0) {
          validationErrors.push(`Fila ${i + 1} (${name}): Mínimo 1 asistente.`);
          continue;
        }

        guestsToImport.push({ name, status, adults, children });
      }

      // --- Handle Validation Results and API Call --- (same logic as before)
      if (validationErrors.length > 0) {
        alert(
          `Errores de validación en el archivo:\n\n${validationErrors.join(
            '\n'
          )}\n\nCorrige el archivo y vuelve a intentarlo.`
        );
        return;
      }
      if (guestsToImport.length === 0) {
        alert(
          'No se encontraron invitados válidos para importar en el archivo.'
        );
        return;
      }
      const importConfirm = window.confirm(
        `Se encontraron ${guestsToImport.length} invitados válidos en el archivo. ¿Deseas importarlos y REEMPLAZAR la lista actual?`
      );
      if (!importConfirm) return;

      try {
        const response = await fetch('/api/guests/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guests: guestsToImport }),
        });
        const data: ApiResponse = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(
            data.error || `Error del servidor: ${response.status}`
          );
        }
        alert(
          `¡Éxito! Se importaron ${
            data.count || guestsToImport.length
          } invitados.`
        );
        fetchGuests(); // Refetch list
      } catch (e: any) {
        console.error('Failed to import guests via API:', e);
        setError(`Error al importar: ${e.message}`);
      }
    };

    reader.onerror = () => {
      alert('Error al leer el archivo.');
      setError('Error al leer el archivo.');
    };

    reader.readAsText(file); // Read the file content
  };

  // --- Render Logic with Loading/Error States ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div>
          {/* Show skeletons for stats */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-[100px] w-full' />
            ))}
          </div>
          {/* Show skeletons for form/list layout */}
          <div className='flex flex-col md:flex-row md:space-x-6'>
            <div className='flex-shrink-0 md:w-1/3 mb-6 md:mb-0'>
              <Skeleton className='h-[250px] w-full' />
            </div>
            <div className='flex-grow'>
              <Skeleton className='h-[300px] w-full' />
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return <p className='text-red-600 text-center font-semibold'>{error}</p>;
    }

    // Render actual content when loaded and no error
    return (
      <>
        <GuestStats guests={guests} />

        {/* Export/Import Buttons Section */}
        <div className='flex justify-end space-x-2 mb-4'>
          <Button
            variant='outline'
            onClick={handleExportCSV}
            disabled={guests.length === 0}>
            Exportar CSV
          </Button>
          <Button variant='outline' onClick={handleImportClick}>
            Importar CSV
          </Button>
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
      </>
    );
  };

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8'>
      <h1 className='text-2xl font-bold mb-6 text-center'>
        Administración de Invitados
      </h1>
      {renderContent()}
    </div>
  );
};

export default GuestManagementPage;
