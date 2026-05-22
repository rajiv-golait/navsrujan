-- Migration: Fix transactions table schema - Add all missing columns
-- Created: 2026-05-22
-- Description: Ensures transactions table has all required columns for credit/debit tracking

-- 1. Add transaction_type column (required for credit/debit)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(10) NOT NULL DEFAULT 'debit';

-- 2. Add entry_method column (tracks how transaction was added)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS entry_method VARCHAR(20) DEFAULT 'manual';

-- 3. Add source_text column (for PDF/SMS parsing)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS source_text TEXT;

-- 4. Add confidence_score column (ML confidence for auto-categorization)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3, 2);

-- 5. Add semester_number column (academic tracking)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS semester_number INTEGER;

-- 6. Add is_academic column (flags academic expenses)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_academic BOOLEAN DEFAULT FALSE;

-- 7. Add constraint for valid transaction types
DO $$ 
BEGIN
    -- Drop existing constraint if it exists with different definition
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_transaction_type'
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT valid_transaction_type;
    END IF;
    
    -- Add the constraint
    ALTER TABLE transactions 
    ADD CONSTRAINT valid_transaction_type 
    CHECK (transaction_type IN ('debit', 'credit'));
END $$;

-- 8. Add constraint for valid categories (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_category'
    ) THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT valid_category 
        CHECK (
            category IN (
                'Food', 'Transport', 'Entertainment', 'Shopping',
                'Bills', 'Education', 'Health', 'Other', 'Academic'
            )
        );
    END IF;
END $$;

-- 9. Update any existing NULL values
UPDATE transactions 
SET transaction_type = 'debit' 
WHERE transaction_type IS NULL;

UPDATE transactions 
SET entry_method = 'manual' 
WHERE entry_method IS NULL;

UPDATE transactions 
SET is_academic = FALSE 
WHERE is_academic IS NULL;

-- 10. Add comments for documentation
COMMENT ON COLUMN transactions.transaction_type IS 'Type: debit (expense) or credit (income). Default is debit.';
COMMENT ON COLUMN transactions.entry_method IS 'How transaction was added: manual, pdf, sms, whatsapp, voice, etc.';
COMMENT ON COLUMN transactions.source_text IS 'Original text from PDF/SMS used for extraction';
COMMENT ON COLUMN transactions.confidence_score IS 'ML confidence score for auto-categorization (0.00 to 1.00)';
COMMENT ON COLUMN transactions.semester_number IS 'Academic semester when expense occurred';
COMMENT ON COLUMN transactions.is_academic IS 'Whether this is an academic-related expense';

-- 11. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
    ON transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category 
    ON transactions(user_id, category);

CREATE INDEX IF NOT EXISTS idx_transactions_type 
    ON transactions(user_id, transaction_type);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Transactions table schema updated successfully. All required columns added.';
END $$;
