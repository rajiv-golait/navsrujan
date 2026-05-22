-- Migration: Add transaction_type column to transactions table
-- Created: 2026-05-22
-- Fixes: Credit transactions require transaction type column error

-- Add transaction_type column if it doesn't exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(10) NOT NULL DEFAULT 'debit';

-- Add constraint to ensure only valid transaction types
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_transaction_type'
    ) THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT valid_transaction_type 
        CHECK (transaction_type IN ('debit', 'credit'));
    END IF;
END $$;

-- Update any existing NULL values to 'debit' (shouldn't be any, but safety first)
UPDATE transactions 
SET transaction_type = 'debit' 
WHERE transaction_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN transactions.transaction_type IS 'Type of transaction: debit (expense) or credit (income)';
