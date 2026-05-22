# Database Updates for Profile Settings Feature

## Overview
Added database tables and triggers to support user notification preferences and privacy settings for the profile management feature.

## New Tables Created

### 1. `notification_preferences`
Stores user preferences for various notification types.

**Columns:**
- `user_id` (UUID, PRIMARY KEY) - References auth.users(id)
- `survival_alerts` (BOOLEAN, DEFAULT TRUE) - Survival risk notifications
- `overspending_warnings` (BOOLEAN, DEFAULT TRUE) - Budget overspending alerts
- `anomaly_detection` (BOOLEAN, DEFAULT TRUE) - Unusual spending pattern alerts
- `budget_milestones` (BOOLEAN, DEFAULT TRUE) - Savings goal achievements
- `savings_opportunities` (BOOLEAN, DEFAULT TRUE) - Cost-cutting recommendations
- `monthly_insights` (BOOLEAN, DEFAULT TRUE) - Monthly financial summaries
- `weekly_reports` (BOOLEAN, DEFAULT FALSE) - Weekly spending reports
- `academic_reminders` (BOOLEAN, DEFAULT FALSE) - Academic calendar-based tips
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Row-Level Security:**
- Users can view, update, and insert their own notification preferences
- DELETE operations not explicitly allowed (use defaults instead)

### 2. `privacy_settings`
Stores user privacy and data sharing preferences.

**Columns:**
- `user_id` (UUID, PRIMARY KEY) - References auth.users(id)
- `data_sharing_for_insights` (BOOLEAN, DEFAULT TRUE) - Share anonymized data for ML
- `anonymous_peer_comparison` (BOOLEAN, DEFAULT TRUE) - Participate in peer averages
- `store_transaction_history` (BOOLEAN, DEFAULT TRUE) - Retain historical data
- `two_factor_enabled` (BOOLEAN, DEFAULT FALSE) - 2FA status (future feature)
- `login_notifications` (BOOLEAN, DEFAULT TRUE) - Alert on new logins
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Row-Level Security:**
- Users can view, update, and insert their own privacy settings
- DELETE operations not explicitly allowed

## Database Functions & Triggers

### Function: `create_default_user_settings()`
Auto-creates default notification and privacy settings when a new user profile is created.

**Behavior:**
- Triggered after INSERT on `user_profiles` table
- Creates entries in both `notification_preferences` and `privacy_settings`
- Uses `ON CONFLICT DO NOTHING` to prevent duplicates

### Trigger: `on_user_profile_created`
Executes `create_default_user_settings()` function after each new user profile insertion.

## Indexes
- `idx_notification_preferences_user_id` on `notification_preferences(user_id)`
- `idx_privacy_settings_user_id` on `privacy_settings(user_id)`

## Migration Files

### 1. `supabase/migrations/add_user_settings.sql`
Standalone migration file for applying these changes to an existing database.

### 2. `supabase/schema.sql` (Updated)
Main schema file updated with new tables at the end.

## How to Apply

### For New Setup:
Run the complete `schema.sql` file in Supabase SQL editor.

### For Existing Database:
Run the `migrations/add_user_settings.sql` file in Supabase SQL editor.

## Frontend Integration

### New Hooks Created:
1. **`useNotificationSettings()`** - Fetch notification preferences
2. **`useUpdateNotificationSettings()`** - Update notification preferences
3. **`usePrivacySettings()`** - Fetch privacy settings
4. **`useUpdatePrivacySettings()`** - Update privacy settings

### Updated Components:
- `NotificationSettings.tsx` - Now saves to database
- `PrivacySecurity.tsx` - Now saves to database

### Data Flow:
1. User opens Settings page (`/profile`)
2. Hooks fetch settings from Supabase via RLS-protected queries
3. User toggles preferences in UI
4. Changes detected and "Save" button appears
5. User clicks Save → Data synced to Supabase
6. React Query cache updated automatically

## Testing Checklist

- [ ] Run migration SQL in Supabase SQL editor
- [ ] Create new user account to test auto-creation of default settings
- [ ] Verify RLS policies work (users can only see/edit their own settings)
- [ ] Test notification preferences save/load
- [ ] Test privacy settings save/load
- [ ] Verify trigger creates default settings for new users
- [ ] Test that existing users get default settings populated

## Security Notes

- All tables use Row-Level Security (RLS)
- Users can only access their own settings via `auth.uid()`
- No public access to settings tables
- DELETE operations not exposed (users can disable instead)
- Password changes handled separately via Supabase Auth API

## Future Enhancements

1. Add email/SMS notification delivery system
2. Implement actual 2FA toggle functionality
3. Add notification history/logs table
4. Export user data functionality
5. Granular notification timing preferences
