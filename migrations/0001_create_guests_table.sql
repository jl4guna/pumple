-- Migration number: 0001 	 2025-04-01_22-06-30.sql

-- Drop table if exists (optional, useful for development)
DROP TABLE IF EXISTS guests;

-- Create the guests table
CREATE TABLE guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incrementing ID
    name TEXT NOT NULL,                   -- Guest name (required)
    status TEXT CHECK(status IN ('pending', 'confirmed', 'declined')) NOT NULL DEFAULT 'pending', -- Status with default and check constraint
    adults INTEGER NOT NULL DEFAULT 1 CHECK(adults >= 0), -- Adults (non-negative, default 1)
    children INTEGER NOT NULL DEFAULT 0 CHECK(children >= 0), -- Children (non-negative, default 0)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp when added
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Timestamp when last updated (we can manage this via triggers or application logic later if needed)
    -- Add constraint to ensure at least one adult if children are present
    -- CHECK (children = 0 OR adults > 0)
    -- Add constraint to ensure at least one person total
    -- CHECK (adults + children > 0)
    -- Note: D1's SQLite version might have limitations on complex CHECK constraints.
    -- We'll handle these validations primarily in the application/API logic for better feedback.
);

-- Optional: Create an index on status for faster filtering
CREATE INDEX idx_guests_status ON guests (status);
