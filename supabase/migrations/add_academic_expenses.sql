-- Academic expenses (tuition, fees, books) — separate from daily transactions
-- Run in Supabase SQL editor if academic page add/list fails.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS academic_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_name VARCHAR(200) NOT NULL,
    semester_number INTEGER NOT NULL CHECK (semester_number >= 1),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('paid', 'pending', 'partial', 'overdue')),
    is_planned BOOLEAN NOT NULL DEFAULT TRUE,
    category VARCHAR(50) DEFAULT 'Academic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_expenses_user_semester
    ON academic_expenses(user_id, semester_number);

CREATE INDEX IF NOT EXISTS idx_academic_expenses_due_date
    ON academic_expenses(user_id, due_date)
    WHERE due_date IS NOT NULL;

ALTER TABLE academic_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own academic expenses" ON academic_expenses;
CREATE POLICY "Users can view own academic expenses"
    ON academic_expenses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own academic expenses" ON academic_expenses;
CREATE POLICY "Users can insert own academic expenses"
    ON academic_expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own academic expenses" ON academic_expenses;
CREATE POLICY "Users can update own academic expenses"
    ON academic_expenses FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own academic expenses" ON academic_expenses;
CREATE POLICY "Users can delete own academic expenses"
    ON academic_expenses FOR DELETE
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS academic_expenses_updated_at ON academic_expenses;
CREATE TRIGGER academic_expenses_updated_at
    BEFORE UPDATE ON academic_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
