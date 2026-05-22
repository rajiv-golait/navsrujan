-- Migration: Add user notification and privacy settings tables
-- Created: 2026-05-22

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

-- Enable RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
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

-- Enable RLS for privacy_settings
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for privacy_settings
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

-- 6. Populate default settings for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM user_profiles
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO privacy_settings (user_id)
SELECT id FROM user_profiles
ON CONFLICT (user_id) DO NOTHING;
