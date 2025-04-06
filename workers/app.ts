import { Hono } from 'hono';
import { createRequestHandler } from 'react-router';
import type { Guest } from '../app/types'; // Import Guest type

// Define environment types including D1 binding
type Bindings = {
  DB: D1Database; // D1 database binding
  // Add other bindings/vars if needed
  VALUE_FROM_CLOUDFLARE: string;
};

// Extend global CloudflareEnvironment (Optional but good practice)
declare global {
  interface CloudflareEnvironment extends Bindings {}
}

// Extend React Router's AppLoadContext
declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnvironment;
      ctx: ExecutionContext;
    };
  }
}

// --- React Router SSR Handler ---
// Keep the existing SSR handler setup
const ssrHandler = createRequestHandler(
  // @ts-expect-error - virtual module provided by React Router
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE
);

// --- Hono API Application ---
// Create Hono app instance with types for bindings
const app = new Hono<{ Bindings: Bindings }>();

// Middleware to handle potential CORS issues (optional, useful for local dev)
// import { cors } from 'hono/cors'
// app.use('/api/*', cors())

// ----- API Routes for Guests -----

// GET /api/guests - Fetch all guests
app.get('/api/guests', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, status, adults, children FROM guests ORDER BY created_at DESC'
    ).all();
    return c.json({ success: true, guests: results });
  } catch (e: any) {
    console.error('Failed to fetch guests:', e);
    return c.json(
      { success: false, error: 'Failed to fetch guests', details: e.message },
      500
    );
  }
});

// POST /api/guests - Add a new guest
app.post('/api/guests', async (c) => {
  try {
    const { name, adults, children } = await c.req.json<{
      name: string;
      adults: number;
      children: number;
    }>();

    // Basic server-side validation (complementary to client-side)
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return c.json({ success: false, error: 'Guest name is required.' }, 400);
    }
    if (
      typeof adults !== 'number' ||
      adults < 0 ||
      typeof children !== 'number' ||
      children < 0
    ) {
      return c.json(
        {
          success: false,
          error: 'Adults and children must be non-negative numbers.',
        },
        400
      );
    }
    if (adults === 0 && children > 0) {
      return c.json(
        {
          success: false,
          error: 'At least one adult is required if children are attending.',
        },
        400
      );
    }
    if (adults + children === 0) {
      return c.json(
        {
          success: false,
          error: 'At least one guest (adult or child) is required.',
        },
        400
      );
    }

    // Insert into D1
    const { success, meta } = await c.env.DB.prepare(
      'INSERT INTO guests (name, adults, children, status) VALUES (?, ?, ?, ?)'
    )
      .bind(name.trim(), adults, children, 'pending') // Default status to 'pending'
      .run();

    if (success) {
      // Optionally fetch the newly created guest to return it, using last_row_id
      const lastId = meta.last_row_id;
      if (lastId) {
        const stmt = c.env.DB.prepare(
          'SELECT id, name, status, adults, children FROM guests WHERE id = ?'
        );
        const newGuest = await stmt.bind(lastId).first();
        return c.json({ success: true, guest: newGuest }, 201); // 201 Created
      } else {
        // Fallback if last_row_id isn't available (should be rare for inserts)
        return c.json(
          { success: true, message: "Guest added, but couldn't retrieve ID." },
          201
        );
      }
    } else {
      throw new Error('Database insertion failed.');
    }
  } catch (e: any) {
    console.error('Failed to add guest:', e);
    return c.json(
      { success: false, error: 'Failed to add guest', details: e.message },
      500
    );
  }
});

// PATCH /api/guests/:id/status - Update guest status
app.patch('/api/guests/:id/status', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid guest ID.' }, 400);
  }

  try {
    const { status } = await c.req.json<{ status: string }>();
    if (!['pending', 'confirmed', 'declined'].includes(status)) {
      return c.json({ success: false, error: 'Invalid status value.' }, 400);
    }

    const { success, meta } = await c.env.DB.prepare(
      'UPDATE guests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(status, id)
      .run();

    // D1's run() meta often reports changes=0 even on success if no data *changed*
    // Check affected rows might be more reliable if available, otherwise rely on success
    if (success) {
      // Optionally fetch the updated guest
      const stmt = c.env.DB.prepare(
        'SELECT id, name, status, adults, children FROM guests WHERE id = ?'
      );
      const updatedGuest = await stmt.bind(id).first();
      if (updatedGuest) {
        return c.json({ success: true, guest: updatedGuest });
      } else {
        // If success but guest not found, likely ID didn't exist
        return c.json({ success: false, error: 'Guest not found.' }, 404);
      }
    } else {
      throw new Error('Database update failed.');
    }
  } catch (e: any) {
    console.error(`Failed to update status for guest ${id}:`, e);
    return c.json(
      { success: false, error: 'Failed to update status', details: e.message },
      500
    );
  }
});

// DELETE /api/guests/:id - Delete a guest
app.delete('/api/guests/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid guest ID.' }, 400);
  }

  try {
    const { success, meta } = await c.env.DB.prepare(
      'DELETE FROM guests WHERE id = ?'
    )
      .bind(id)
      .run();

    // Check if any rows were actually deleted
    if (success && meta.changes > 0) {
      return c.json({ success: true });
    } else if (success && meta.changes === 0) {
      // Success is true, but no rows changed -> ID didn't exist
      return c.json({ success: false, error: 'Guest not found.' }, 404);
    } else {
      throw new Error('Database deletion failed.');
    }
  } catch (e: any) {
    console.error(`Failed to delete guest ${id}:`, e);
    return c.json(
      { success: false, error: 'Failed to delete guest', details: e.message },
      500
    );
  }
});

// POST /api/guests/import - Use imported Guest type
app.post('/api/guests/import', async (c) => {
  try {
    // Use Omit<Guest, 'id'> as the input doesn't have an ID yet
    const { guests: guestsToImport } = await c.req.json<{
      guests: Omit<Guest, 'id'>[];
    }>();

    if (!Array.isArray(guestsToImport) || guestsToImport.length === 0) {
      return c.json(
        { success: false, error: 'No valid guest data provided for import.' },
        400
      );
    }

    // Prepare insert statements for batching
    const statements = guestsToImport.map((guest) =>
      c.env.DB.prepare(
        'INSERT INTO guests (name, status, adults, children) VALUES (?, ?, ?, ?)'
      ).bind(guest.name, guest.status, guest.adults, guest.children)
    );

    // Execute in a D1 batch (transaction)
    const results = await c.env.DB.batch(statements);

    // Check results - D1 batch returns an array of D1Result objects
    // We'll assume success if there are no errors in the results array
    // Note: More granular error checking per statement is possible if needed
    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      console.error('D1 Batch Import Errors:', errors);
      // Attempt to provide some detail from the first error
      const firstError = errors[0].error || 'Unknown D1 batch error';
      throw new Error(`Database batch import failed: ${firstError}`);
    }

    // If batch succeeded, return success
    return c.json({ success: true, count: guestsToImport.length });
  } catch (e: any) {
    console.error('Failed to import guests:', e);
    return c.json(
      { success: false, error: 'Failed to import guests', details: e.message },
      500
    );
  }
});

// Expenses endpoints
app.get('/api/expenses', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM expenses ORDER BY payment_date DESC'
    ).all();

    // Transformar los resultados a camelCase para el cliente
    const formattedResults = results.map((expense) => ({
      id: expense.id,
      concept: expense.concept,
      amount: expense.amount,
      paymentDate: expense.payment_date,
      isReimbursed:
        expense.is_reimbursed === 1 || expense.is_reimbursed === true,
      paidBy: expense.paid_by,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at,
    }));

    return c.json({ success: true, data: formattedResults });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return c.json({ success: false, error: 'Error al obtener gastos' }, 500);
  }
});

app.post('/api/expenses', async (c) => {
  try {
    const body = await c.req.json();
    const { concept, amount, paymentDate, isReimbursed, paidBy } = body;

    console.log('Recibiendo datos para crear gasto:', body);

    const { success } = await c.env.DB.prepare(
      'INSERT INTO expenses (concept, amount, payment_date, is_reimbursed, paid_by) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(concept, amount, paymentDate, isReimbursed ? 1 : 0, paidBy)
      .run();

    if (success) {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM expenses WHERE id = last_insert_rowid()'
      ).all();

      if (results && results.length > 0) {
        // Transformar el resultado a camelCase para el cliente
        const newExpense = {
          id: results[0].id,
          concept: results[0].concept,
          amount: results[0].amount,
          paymentDate: results[0].payment_date,
          isReimbursed:
            results[0].is_reimbursed === 1 || results[0].is_reimbursed === true,
          paidBy: results[0].paid_by,
          createdAt: results[0].created_at,
          updatedAt: results[0].updated_at,
        };

        return c.json({ success: true, data: newExpense });
      }
    }
    return c.json({ success: false, error: 'Error al crear gasto' }, 500);
  } catch (error) {
    console.error('Error al crear gasto:', error);
    return c.json({ success: false, error: 'Error al crear gasto' }, 500);
  }
});

app.patch('/api/expenses/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { isReimbursed } = body;

    const { success } = await c.env.DB.prepare(
      'UPDATE expenses SET is_reimbursed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(isReimbursed ? 1 : 0, id)
      .run();

    if (success) {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM expenses WHERE id = ?'
      )
        .bind(id)
        .all();

      if (results && results.length > 0) {
        // Transformar el resultado a camelCase para el cliente
        const updatedExpense = {
          id: results[0].id,
          concept: results[0].concept,
          amount: results[0].amount,
          paymentDate: results[0].payment_date,
          isReimbursed:
            results[0].is_reimbursed === 1 || results[0].is_reimbursed === true,
          paidBy: results[0].paid_by,
          createdAt: results[0].created_at,
          updatedAt: results[0].updated_at,
        };

        return c.json({ success: true, data: updatedExpense });
      }
    }
    return c.json({ success: false, error: 'Error al actualizar gasto' }, 500);
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    return c.json({ success: false, error: 'Error al actualizar gasto' }, 500);
  }
});

// ----- Main Fetch Handler -----
export default {
  async fetch(
    request: Request,
    env: CloudflareEnvironment,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Try matching API routes first
    const apiResponse = await app.fetch(request.clone(), env, ctx); // Clone request for Hono
    // Check if Hono produced a response other than 404 (meaning it matched a route)
    if (apiResponse.status !== 404) {
      return apiResponse; // Return the API response
    }

    // If no API route matched, let React Router handle SSR
    try {
      return await ssrHandler(request, {
        cloudflare: { env, ctx },
      });
    } catch (error) {
      console.error('SSR Handler Error:', error);
      return new Response('Internal Server Error during SSR', { status: 500 });
    }
  },
} satisfies ExportedHandler<CloudflareEnvironment>;
