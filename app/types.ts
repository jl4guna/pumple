// app/types.ts

// Define the shared structure for a Guest
export interface Guest {
  id: number; // Or string if your API/DB returns it differently
  name: string;
  status: 'pending' | 'confirmed' | 'declined';
  adults: number;
  children: number;
  // Add created_at, updated_at if needed in the frontend
}

// Optional: Define API response type here too
export interface ApiResponse<T = any> {
  success: boolean;
  guests?: T[];
  guest?: T;
  error?: string;
  details?: string;
  message?: string;
}
