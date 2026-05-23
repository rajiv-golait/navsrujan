-- Smart Budget Management — Phase 1-3 schema
-- Run this in the Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. user_profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    college TEXT,
    course TEXT,
    year INTEGER,
    monthly_budget DECIMAL(10, 2),

    -- Education context (for later phases)
    education_type VARCHAR(50),
    university VARCHAR(200),
    degree_duration INTEGER DEFAULT 4,
    current_semester INTEGER,
    semester_system VARCHAR(20) DEFAULT 'semester',
    degree_start_date DATE,
    expected_graduation DATE,
    location_type VARCHAR(50),
    accommodation_type VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. transactions (personal expenses)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    merchant TEXT,
    description TEXT,

    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    entry_method VARCHAR(20) DEFAULT 'manual',
    transaction_type VARCHAR(10) NOT NULL DEFAULT 'debit',
    source_text TEXT,
    confidence_score DECIMAL(3, 2),

    semester_number INTEGER,
    is_academic BOOLEAN DEFAULT FALSE,

    CONSTRAINT valid_category CHECK (
        category IN (
            'Food', 'Transport', 'Entertainment', 'Shopping',
            'Bills', 'Education', 'Health', 'Other', 'Academic'
        )
    ),
    CONSTRAINT valid_transaction_type CHECK (
        transaction_type IN ('debit', 'credit')
    )
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
    ON transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category
    ON transactions(user_id, category);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Balance anchor on profile
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS starting_balance DECIMAL(12, 2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS balance_as_of_date DATE;

-- Chat
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent VARCHAR(50),
    analytics_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
CREATE POLICY "Users can view own conversations" ON chat_conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own conversations" ON chat_conversations;
CREATE POLICY "Users can insert own conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
CREATE POLICY "Users can update own conversations" ON chat_conversations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own conversations" ON chat_conversations;
CREATE POLICY "Users can delete own conversations" ON chat_conversations FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scheduled future expenses (e.g. laptop in 5 days)
CREATE TABLE IF NOT EXISTS scheduled_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    expected_date DATE NOT NULL,
    category VARCHAR(50) DEFAULT 'Other',
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'cancelled')),
    confidence DECIMAL(3, 2),
    source VARCHAR(20) NOT NULL DEFAULT 'chat' CHECK (source IN ('chat', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_expenses_user_date
    ON scheduled_expenses(user_id, expected_date);

ALTER TABLE scheduled_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own scheduled expenses" ON scheduled_expenses;
CREATE POLICY "Users can view own scheduled expenses" ON scheduled_expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own scheduled expenses" ON scheduled_expenses;
CREATE POLICY "Users can insert own scheduled expenses" ON scheduled_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own scheduled expenses" ON scheduled_expenses;
CREATE POLICY "Users can update own scheduled expenses" ON scheduled_expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own scheduled expenses" ON scheduled_expenses;
CREATE POLICY "Users can delete own scheduled expenses" ON scheduled_expenses FOR DELETE USING (auth.uid() = user_id);

-- Academic expenses (tuition, fees, books)
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

ALTER TABLE academic_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own academic expenses" ON academic_expenses;
CREATE POLICY "Users can view own academic expenses"
    ON academic_expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own academic expenses" ON academic_expenses;
CREATE POLICY "Users can insert own academic expenses"
    ON academic_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own academic expenses" ON academic_expenses;
CREATE POLICY "Users can update own academic expenses"
    ON academic_expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own academic expenses" ON academic_expenses;
CREATE POLICY "Users can delete own academic expenses"
    ON academic_expenses FOR DELETE USING (auth.uid() = user_id);

-- Recurring obligations (petrol, rent, subscriptions)
CREATE TABLE IF NOT EXISTS recurring_obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) DEFAULT 'Other',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    next_due_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(20) NOT NULL DEFAULT 'chat' CHECK (source IN ('chat', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_obligations_user ON recurring_obligations(user_id, is_active);

ALTER TABLE recurring_obligations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recurring" ON recurring_obligations;
CREATE POLICY "Users can view own recurring" ON recurring_obligations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own recurring" ON recurring_obligations;
CREATE POLICY "Users can insert own recurring" ON recurring_obligations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own recurring" ON recurring_obligations;
CREATE POLICY "Users can update own recurring" ON recurring_obligations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own recurring" ON recurring_obligations;
CREATE POLICY "Users can delete own recurring" ON recurring_obligations FOR DELETE USING (auth.uid() = user_id);

-- Assistant memory facts (personal context)
CREATE TABLE IF NOT EXISTS assistant_memory_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fact_key VARCHAR(120) NOT NULL,
    fact_value TEXT NOT NULL,
    source_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_memory_facts_user ON assistant_memory_facts(user_id);

ALTER TABLE assistant_memory_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memory" ON assistant_memory_facts;
CREATE POLICY "Users can view own memory" ON assistant_memory_facts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own memory" ON assistant_memory_facts;
CREATE POLICY "Users can insert own memory" ON assistant_memory_facts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own memory" ON assistant_memory_facts;
CREATE POLICY "Users can update own memory" ON assistant_memory_facts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own memory" ON assistant_memory_facts;
CREATE POLICY "Users can delete own memory" ON assistant_memory_facts FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at on user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS academic_expenses_updated_at ON academic_expenses;
CREATE TRIGGER academic_expenses_updated_at
    BEFORE UPDATE ON academic_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. education_templates (seeded reference data)
CREATE TABLE IF NOT EXISTS education_templates (
    template_id VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(120) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    education_type VARCHAR(50) NOT NULL,
    total_duration_years INTEGER NOT NULL CHECK (total_duration_years > 0),
    semester_system VARCHAR(20) NOT NULL,
    semesters_per_year INTEGER NOT NULL CHECK (semesters_per_year > 0),
    total_semesters INTEGER NOT NULL CHECK (total_semesters > 0),
    typical_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS education_templates_updated_at ON education_templates;
CREATE TRIGGER education_templates_updated_at
    BEFORE UPDATE ON education_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. expense_templates (seeded reference data)
CREATE TABLE IF NOT EXISTS expense_templates (
    template_id VARCHAR(50) NOT NULL,
    semester_number INTEGER NOT NULL CHECK (semester_number >= 0),
    expense_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    typical_amount_min DECIMAL(12, 2) NOT NULL CHECK (typical_amount_min >= 0),
    typical_amount_max DECIMAL(12, 2) NOT NULL CHECK (typical_amount_max >= 0),
    typical_amount_avg DECIMAL(12, 2) NOT NULL CHECK (typical_amount_avg >= 0),
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    frequency VARCHAR(50) NOT NULL,
    typical_occurrence_week INTEGER NOT NULL DEFAULT 1,
    location_dependent BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT expense_templates_pk PRIMARY KEY (template_id, semester_number, expense_name),
    CONSTRAINT expense_templates_template_fk
        FOREIGN KEY (template_id) REFERENCES education_templates(template_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_templates_template
    ON expense_templates(template_id, semester_number);

DROP TRIGGER IF EXISTS expense_templates_updated_at ON expense_templates;
CREATE TRIGGER expense_templates_updated_at
    BEFORE UPDATE ON expense_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Seed education_templates
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_001', 'btech_engineering', 'B.Tech / B.E. Engineering', 'BTech', 4, 'semester', 2, 8, '["Semester Registration Fee", "Examination Fee", "Lab Fee", "Project Materials", "Textbooks & References", "Coding Certifications", "Industrial Visit", "Placement Preparation", "Software Licenses (MATLAB/CAD)", "Final Year Project (FYP)", "Stationery & Printing", "Hostel Academic Maintenance"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_002', 'mba_management', 'MBA — Master of Business Administration', 'MBA', 2, 'trimester', 3, 6, '["Semester Registration Fee", "Case Study Materials", "Networking Events", "Business Conferences", "Certification Courses (CFA/CMA)", "Business Attire", "Industry Visits", "LinkedIn Premium", "Placement Preparation", "Resume & Interview Coaching", "Stationery & Printing", "Examination Fee"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_003', 'bdes_design', 'B.Des — Bachelor of Design', 'Design', 4, 'semester', 2, 8, '["Art Supplies & Materials", "Adobe Creative Cloud", "Figma / UX Tools", "Portfolio Printing", "Exhibition & Showcase Fees", "Prototype & Model Costs", "Semester Registration Fee", "Examination Fee", "Field Visit / Research Trips", "Workshop & Masterclass Fees", "Stationery & Sketchbooks", "Software Plugins & Assets"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_004', 'mbbs_medical', 'MBBS — Bachelor of Medicine and Surgery', 'Medical', 5, 'semester', 2, 9, '["Semester Registration Fee", "University Examination Fee", "Clinical Instruments Kit", "Medical Reference Books", "Lab Coat & Practical Uniform", "Practical / OSPE Exam Fee", "Anatomy Models & Dissection Kit", "PG Entrance Preparation", "Hospital Practical Fees", "Medical Journal Subscriptions", "Stationery & Printing", "Lab & Consumables Fee"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_005', 'bba_commerce', 'BBA — Bachelor of Business Administration', 'BBA', 3, 'semester', 2, 6, '["Semester Registration Fee", "Examination Fee", "Textbooks & Case Materials", "Internship Preparation", "Digital Marketing Tools", "Aptitude Training", "Placement Preparation", "Stationery & Printing", "Networking Events", "Business Attire", "Online Courses (Coursera/Udemy)", "Hostel Academic Maintenance"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_006', 'llb_law_integrated', 'B.A./B.Com. LLB — Integrated Law', 'Law', 5, 'semester', 2, 10, '["Semester Registration Fee", "Examination Fee", "Legal Database Subscriptions (SCC/Manupatra)", "Law Textbooks & Bare Acts", "Moot Court Competition Fees", "Internship (Law Firm / Court)", "Stationery & Printing", "Mooting Travel Expenses", "Bar Council Enrollment Fee", "Legal Research Workshop", "Seminar & Conference Fees", "Library Fine & Replacement"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_007', 'barch_architecture', 'B.Arch — Bachelor of Architecture', 'Architecture', 5, 'semester', 2, 10, '["Semester Registration Fee", "Examination Fee", "Model Making Materials", "Drafting & Drawing Equipment", "AutoCAD / Revit License", "Large-Format Printing", "Site Visit & Documentation", "Thesis / Final Project Materials", "Architecture Books & Journals", "Studio Supplies", "Photography Equipment Rental", "Workshop & Fabrication Fees"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_008', 'msc_data_science', 'M.Sc. Data Science & AI', 'Data Science', 2, 'semester', 2, 4, '["Semester Registration Fee", "Examination Fee", "Cloud Credits (AWS/GCP/Azure)", "Kaggle / DataCamp Pro", "Deep Learning Certifications", "Research Paper Access (IEEE/Springer)", "GPU Compute Costs", "GitHub Copilot / AI Tools", "Data Visualization Software", "Thesis Research Materials", "Conference Submission Fee", "Stationery & Lab Printing"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_009', 'bvoc_animation', 'B.Voc / B.A. Animation & Multimedia', 'Animation', 3, 'semester', 2, 6, '["Semester Registration Fee", "Examination Fee", "Adobe Creative Cloud", "Maya / Blender Plugins", "Render Farm Credits", "Portfolio Reel Production", "Sound Design Software", "Storyboard Materials", "3D Printing (Models/Props)", "Online Masterclasses", "Hard Drive & Storage", "Festival / Screening Submission"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_010', 'bcom_commerce', 'B.Com — Bachelor of Commerce', 'Commerce', 3, 'semester', 2, 6, '["Semester Registration Fee", "Examination Fee", "Commerce Textbooks", "Tally / Accounting Software", "CA Foundation / Inter Prep", "Online Finance Courses", "Stationery & Printing", "Internship at CA Firm", "Seminar Fees", "Business Newspaper Subscription", "Aptitude Training", "Bank Exam Preparation"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_011', 'mca_computer_applications', 'MCA — Master of Computer Applications', 'MCA', 2, 'semester', 2, 4, '["Semester Registration Fee", "Examination Fee", "Cloud Certification (AWS/Azure)", "LeetCode / Codeforces Premium", "DevOps / Docker Tools", "Placement Preparation Program", "Mock Interview Platform", "GitHub Pro", "Textbooks & References", "Internship Preparation", "Final Year Project Materials", "Stationery & Printing"]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('EDU_TPL_012', 'bpharm_pharmacy', 'B.Pharm — Bachelor of Pharmacy', 'Pharmacy', 4, 'semester', 2, 8, '["Semester Registration Fee", "Examination Fee", "Lab Practical Fee", "Pharmacopoeia & Reference Books", "Lab Coat & Safety Equipment", "Lab Reagents & Consumables", "GPAT / PG Entrance Prep", "Industrial Training Fee", "Drug Analysis Software", "Stationery & Lab Journal", "Project Research Materials", "Internship at Pharmacy/Hospital"]', True) ON CONFLICT (template_id) DO NOTHING;

-- Compatibility aliases so expense_templates(TMPL_*) FK resolves cleanly
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_ARCH', 'tmpl_architecture', 'Architecture Template Alias', 'Architecture', 5, 'semester', 2, 10, '[]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_BBA', 'tmpl_bba', 'BBA Template Alias', 'BBA', 3, 'semester', 2, 6, '[]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_BTECH', 'tmpl_btech', 'BTech Template Alias', 'BTech', 4, 'semester', 2, 8, '[]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_DATA', 'tmpl_data_science', 'Data Science Template Alias', 'Data Science', 2, 'semester', 2, 4, '[]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_DES', 'tmpl_design', 'Design Template Alias', 'Design', 4, 'semester', 2, 8, '[]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_LAW', 'tmpl_law', 'Law Template Alias', 'Law', 5, 'semester', 2, 10, '[]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_MBA', 'tmpl_mba', 'MBA Template Alias', 'MBA', 2, 'trimester', 3, 6, '[]', True) ON CONFLICT (template_id) DO NOTHING;
INSERT INTO education_templates (template_id, template_name, display_name, education_type, total_duration_years, semester_system, semesters_per_year, total_semesters, typical_categories, is_active) VALUES ('TMPL_MED', 'tmpl_medical', 'Medical Template Alias', 'Medical', 5, 'semester', 2, 9, '[]', True) ON CONFLICT (template_id) DO NOTHING;

-- Seed expense_templates
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_ARCH', 0, 'Semester Registration Fee', 'Examination', 2568.02, 8520.41, 4652.77, True, True, 'once_per_semester', 1, False, 'Paid at start of each architecture semester; non-negotiable; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_ARCH', 0, 'Large-Format Printing', 'Materials', 818.48, 3816.13, 2230.81, True, True, 'once_per_semester', 14, True, 'A0/A1 architectural drawings; metro print shops charge a premium; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_ARCH', 1, 'Drafting Instruments Set', 'Materials', 1533.0, 5170.11, 2902.56, True, False, 'once', 1, False, 'Scales, set squares, parallel board — one-time purchase in Sem 1') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_ARCH', 2, 'AutoCAD / Revit Student License', 'Software', 0.0, 2100.94, 492.28, True, True, 'once_per_semester', 2, False, 'Often free via Autodesk Education program; institutional fees may apply; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_ARCH', 3, 'Model Making Materials', 'Project', 1478.98, 5674.36, 3210.16, True, True, 'once_per_semester', 8, False, 'Foam board, balsa wood, acrylic sheets, adhesives for studio models; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_ARCH', 5, 'Site Visit & Documentation', 'Travel', 930.18, 4867.37, 2543.08, True, False, 'once_per_semester', 6, True, 'Field visits for measured drawing and site analysis exercises; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_ARCH', 9, 'Thesis Project Materials & Printing', 'Project', 6207.94, 19068.61, 12341.85, True, False, 'once', 10, True, 'Final thesis boards, model, booklet printing; highest single academic cost; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BBA', 0, 'Semester Registration Fee', 'Examination', 1488.26, 5752.45, 3279.54, True, True, 'once_per_semester', 1, False, 'Mandatory fee at each semester start; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BBA', 0, 'Commerce & Management Textbooks', 'Academic', 826.76, 2986.57, 1705.28, True, True, 'once_per_semester', 1, False, 'Core books change each year as per BBA syllabus; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BBA', 3, 'Digital Marketing Tools Subscription', 'Software', 508.39, 2546.09, 1437.11, False, True, 'monthly', 3, False, 'SEMrush, Canva Pro, or HubSpot for digital marketing coursework; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BBA', 4, 'Internship Preparation', 'Placement', 1556.48, 5748.24, 3046.6, False, False, 'once', 5, False, 'Summer internship prep; GD/PI training + aptitude coaching') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BBA', 5, 'CA Foundation / CMA Study Materials', 'Certification', 1889.44, 7784.4, 4536.23, False, False, 'once', 4, False, 'Many BBA students pursue CA Foundation alongside degree') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BBA', 6, 'Business Attire for Placements', 'Placement', 2129.12, 6918.44, 3750.31, False, False, 'once', 2, True, 'Professional clothing for campus interview rounds; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 0, 'Semester Registration Fee', 'Examination', 2466.39, 9101.1, 5323.34, True, True, 'once_per_semester', 1, False, 'Paid at semester start; amount varies by institution tier; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 0, 'End-Semester Examination Fee', 'Examination', 1157.74, 4663.72, 2437.79, True, True, 'once_per_semester', 12, False, 'Exam registration deadline typically 3 weeks before exams; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 0, 'Lab Fee', 'Lab', 786.9, 3077.41, 1606.18, True, True, 'once_per_semester', 2, False, 'Covers lab consumables, equipment access, and safety materials; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 0, 'Semester Textbooks', 'Academic', 1273.65, 4493.24, 2381.19, True, True, 'once_per_semester', 1, False, 'Core textbooks for enrolled subjects; varies by branch; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 0, 'Stationery & Printing', 'Academic', 203.17, 672.24, 395.28, True, True, 'monthly', 1, False, 'Notebooks, pens, assignment printing; monthly recurring') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 1, 'Engineering Drawing Kit', 'Materials', 589.41, 1968.67, 1120.06, True, False, 'once', 1, False, 'One-time purchase in Sem 1; includes drafter, scales, compass set') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 1, 'C/C++ Programming Course (Beginner)', 'Software', 474.71, 2556.2, 1242.0, False, False, 'once', 3, False, 'Optional but highly recommended for CS/IT branches in Sem 1') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 2, 'Reference Books (Core Subjects)', 'Academic', 586.46, 2337.63, 1303.73, False, False, 'once_per_semester', 2, False, 'Supplementary references; used for competitive exam prep too') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 3, 'Mini Project Materials', 'Project', 830.74, 3982.66, 2178.58, True, False, 'once', 6, False, 'Hardware/components for semester mini project; amount varies by domain') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 4, 'NPTEL Online Certification', 'Certification', 967.72, 2793.2, 1746.68, False, False, 'once_per_semester', 4, False, 'IIT-backed courses with proctored exams; adds academic credit') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 5, 'Cloud Certification (AWS/GCP Foundational)', 'Certification', 6411.24, 14067.25, 9463.98, False, False, 'once', 8, True, 'Metro students often access training centers; higher cost in cities') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 5, 'Industrial Visit Fee', 'Travel', 844.83, 3551.7, 1885.81, False, False, 'once', 7, True, 'Department-organized industry exposure; cost varies by distance; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 5, 'Internship Preparation Course', 'Placement', 2450.13, 9602.15, 5731.42, False, False, 'once', 10, True, 'Domain-specific prep before summer internship applications; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 6, 'Aptitude & Reasoning Training', 'Placement', 1428.77, 6245.14, 3230.53, False, False, 'once', 5, False, 'Quantitative aptitude + logical reasoning prep for campus drives') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 7, 'Final Year Project (FYP) Materials', 'Project', 5223.77, 18827.25, 9925.42, True, False, 'once', 3, False, 'Hardware, cloud, or research costs for FYP; mandatory for graduation') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 7, 'Placement Training Program', 'Placement', 5338.02, 21242.95, 11176.33, False, False, 'once', 2, True, 'Institute or third-party placement prep; required for competitive companies; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 7, 'Mock Interview Coaching', 'Placement', 1870.38, 7466.1, 4488.18, False, False, 'once', 6, True, '1-on-1 or group sessions; metro coaching centers charge premium') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_BTECH', 8, 'Research Paper Submission Fee', 'Academic', 942.04, 4866.86, 2376.42, False, False, 'once', 4, False, 'Conference/journal processing fee for FYP publication') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DATA', 0, 'Semester Registration Fee', 'Examination', 2016.02, 7439.35, 4035.2, True, True, 'once_per_semester', 1, False, 'Paid each semester; amount varies by institution type; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DATA', 0, 'Cloud Credits (AWS / GCP / Azure)', 'Software', 971.32, 5179.66, 2937.71, True, True, 'once_per_semester', 2, False, 'Essential for ML experiments, model training, and deployment labs; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DATA', 1, 'Kaggle / DataCamp Pro Subscription', 'Software', 1561.66, 3943.13, 2418.06, False, True, 'quarterly', 1, False, 'Hands-on platform subscription; highly recommended from Sem 1; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DATA', 2, 'Deep Learning / ML Certification', 'Certification', 2983.55, 11375.83, 6259.93, False, False, 'once', 5, False, 'Coursera/deeplearning.ai specializations for portfolio building') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DATA', 3, 'Research Paper Access (IEEE / Springer)', 'Academic', 496.26, 3147.09, 1530.28, False, True, 'once_per_semester', 3, False, 'Institutional access may not cover all journals; personal access needed; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DATA', 4, 'Thesis Research & GPU Compute', 'Project', 2965.63, 15954.1, 6775.18, True, False, 'once', 4, False, 'Colab Pro+ or runpod.io GPU costs for thesis model training') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 0, 'Adobe Creative Cloud', 'Software', 1518.0, 3278.36, 2331.92, True, True, 'once_per_semester', 1, False, 'Recurring design software; mandatory for coursework deliverables') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 0, 'Art Supplies & Studio Materials', 'Materials', 591.52, 3135.39, 1583.91, True, True, 'once_per_semester', 1, False, 'Sketchbooks, markers, watercolors, cutting mats; replenished each sem; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 0, 'Semester Registration Fee', 'Examination', 1975.94, 7855.49, 4316.7, True, True, 'once_per_semester', 1, False, 'Paid at term start; NID and premium design schools charge higher; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 1, 'Figma Pro Subscription', 'Software', 842.51, 1588.84, 1124.38, False, True, 'monthly', 2, False, 'UI/UX design tool; widely used from Sem 1 in design programs; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 3, 'Prototype & Model Making Costs', 'Project', 1478.7, 5952.94, 3139.65, True, False, 'once_per_semester', 8, False, 'Physical prototyping for product/industrial design projects') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 4, 'Portfolio Printing (Mid-Program)', 'Materials', 2043.21, 6128.83, 3433.73, False, False, 'once', 13, True, 'High-quality print for review juries; metro print shops cost more') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 5, 'Design Workshop / Masterclass', 'Certification', 2104.78, 8247.21, 3887.44, False, False, 'once', 6, True, 'Industry masterclasses; city-based workshops cost more; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 7, 'Final Portfolio Production', 'Project', 4173.19, 12292.82, 6824.8, True, False, 'once', 10, True, 'Graduation portfolio printing; premium large-format printing; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_DES', 7, 'Exhibition Setup & Display Costs', 'Project', 1942.99, 8281.69, 4311.06, True, False, 'once', 14, True, 'Final year graduation exhibition; venue and display material costs; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_LAW', 0, 'Semester Registration Fee', 'Examination', 1930.05, 6778.11, 3827.61, True, True, 'once_per_semester', 1, False, 'Paid at each semester start; NLU fees higher than private colleges; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_LAW', 0, 'Legal Database Subscription (SCC / Manupatra)', 'Software', 1581.85, 4917.86, 3098.0, True, True, 'once_per_semester', 2, False, 'Access to case laws and statutes; essential research tool; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_LAW', 0, 'Law Textbooks & Bare Acts', 'Academic', 1061.17, 3988.34, 2286.44, True, True, 'once_per_semester', 1, False, 'Subject-specific bare acts and commentaries; changes every semester; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_LAW', 3, 'Moot Court Competition Fee', 'Networking', 1054.5, 4983.45, 2417.37, False, False, 'once', 8, True, 'Registration + travel for inter-college moot courts; city-dependent cost; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_LAW', 5, 'Law Firm Internship Travel', 'Travel', 1880.93, 7708.32, 4481.94, False, False, 'once', 2, True, 'Travel and accommodation costs for vacation internships at law firms; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_LAW', 9, 'Bar Council Enrollment Fee', 'Examination', 2796.47, 7809.32, 4997.06, True, False, 'once', 14, False, 'State Bar Council enrollment fee upon completing LLB — mandatory') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 0, 'Term Registration Fee', 'Examination', 2928.47, 10032.76, 5820.48, True, True, 'once_per_semester', 1, False, 'Paid each trimester; higher at top-tier B-schools; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 0, 'Case Study Materials (HBR / IVEY)', 'Academic', 520.11, 1875.51, 1068.26, True, True, 'once_per_semester', 1, False, 'Harvard/IVEY case packs; mandatory for most MBA programs; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 0, 'Notion Pro / Productivity Suite', 'Software', 289.82, 887.91, 564.51, False, True, 'monthly', 1, False, 'Widely used for MBA project management and note-taking; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 1, 'Networking Event Registration', 'Networking', 979.53, 5136.5, 2605.55, False, False, 'once_per_semester', 5, True, 'Industry alumni meets, B-school conclaves; metro events pricier') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 1, 'Business Conference Fee', 'Networking', 1896.66, 8407.6, 4241.86, False, False, 'once', 7, True, 'Optional but adds to professional profile; metro events cost more') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 2, 'LinkedIn Premium Subscription', 'Placement', 1241.53, 2537.81, 1783.49, False, True, 'monthly', 1, False, 'Recommended from Term 2 for recruiter visibility and job search; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 2, 'CFA / CMA Study Materials', 'Certification', 7548.06, 19002.25, 12576.38, False, False, 'once', 4, False, 'Optional but high ROI for finance-track MBA students') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 3, 'Summer Internship Preparation', 'Placement', 1909.74, 7602.97, 4368.41, False, False, 'once', 3, True, 'Pre-internship skill building; case interview and GD/PI prep; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 4, 'Business Formal Attire', 'Placement', 3025.61, 10378.79, 6178.78, False, False, 'once', 2, True, 'Required for campus placement dress code; metro tailors charge more') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 5, 'MBA Thesis / Capstone Project', 'Project', 1912.07, 7521.08, 3915.09, True, False, 'once', 4, False, 'Research, printing, and binding costs for final MBA capstone') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MBA', 5, 'Final Placement Coaching', 'Placement', 5242.29, 17035.38, 10322.35, False, False, 'once', 1, True, 'Intensive coaching for final campus recruitment season; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 0, 'University Examination Fee', 'Examination', 1982.59, 6389.6, 3414.67, True, True, 'once_per_semester', 12, False, 'Mandatory for all theory + practical exams; university-regulated; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 0, 'Medical Reference Books', 'Academic', 2000.88, 6342.05, 3942.35, True, False, 'once_per_semester', 1, False, 'Subject-specific textbooks change each year of MBBS curriculum') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 0, 'Practical Lab Fee', 'Lab', 1040.35, 4018.62, 2294.56, True, True, 'once_per_semester', 2, False, 'Lab consumables, reagent access, specimen handling costs; recurring each semester') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 1, 'Clinical Instruments Kit', 'Lab', 2897.87, 8427.37, 4954.67, True, False, 'once', 1, False, 'Stethoscope, BP cuff, reflex hammer, ophthalmoscope — one-time purchase') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 1, 'Lab Coat & Clinical Uniform', 'Materials', 613.29, 2031.08, 1076.05, True, False, 'once', 1, False, 'Mandatory for hospital rotations from Sem 1') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 3, 'Anatomy Dissection Atlas', 'Academic', 1229.94, 3551.1, 2307.2, True, False, 'once', 2, False, 'Specialized atlas for gross anatomy practical sessions') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 7, 'NEET-PG / USMLE Preparation', 'Certification', 5116.75, 17848.93, 9879.82, False, False, 'once', 4, True, 'PG entrance coaching; major investment in final years; metro city pricing significantly higher') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;
INSERT INTO expense_templates (template_id, semester_number, expense_name, category, typical_amount_min, typical_amount_max, typical_amount_avg, is_mandatory, is_recurring, frequency, typical_occurrence_week, location_dependent, notes) VALUES ('TMPL_MED', 8, 'Hospital Practical / OSCE Fee', 'Examination', 1581.37, 4891.77, 3050.12, True, False, 'once_per_semester', 13, False, 'Objective Structured Clinical Examination fee; mandatory for MBBS completion') ON CONFLICT (template_id, semester_number, expense_name) DO NOTHING;

-- ===============================================
-- USER SETTINGS TABLES (Added 2026-05-22)
-- ===============================================

-- 1. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Critical Alerts
    survival_alerts BOOLEAN DEFAULT TRUE,
    overspending_warnings BOOLEAN DEFAULT TRUE,
    anomaly_detection BOOLEAN DEFAULT TRUE,
    
    -- Insights & Recommendations
    budget_milestones BOOLEAN DEFAULT TRUE,
    savings_opportunities BOOLEAN DEFAULT TRUE,
    monthly_insights BOOLEAN DEFAULT TRUE,
    
    -- Periodic Reports
    weekly_reports BOOLEAN DEFAULT FALSE,
    academic_reminders BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Privacy Settings Table
CREATE TABLE IF NOT EXISTS privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Data Sharing Preferences
    data_sharing_for_insights BOOLEAN DEFAULT TRUE,
    anonymous_peer_comparison BOOLEAN DEFAULT TRUE,
    store_transaction_history BOOLEAN DEFAULT TRUE,
    
    -- Security Settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    login_notifications BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own privacy settings" ON privacy_settings;
CREATE POLICY "Users can view own privacy settings"
    ON privacy_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own privacy settings" ON privacy_settings;
CREATE POLICY "Users can update own privacy settings"
    ON privacy_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own privacy settings" ON privacy_settings;
CREATE POLICY "Users can insert own privacy settings"
    ON privacy_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Create function to auto-create default settings when user signs up
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default notification preferences
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default privacy settings
    INSERT INTO privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to auto-create settings on user profile creation
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON privacy_settings(user_id);
