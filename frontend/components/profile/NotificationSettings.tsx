"use client";

import { useState, useEffect } from "react";
import { Bell, Save, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/lib/hooks/useNotificationSettings";

export function NotificationSettings() {
  const { settings: dbSettings, loading, error } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const [saved, setSaved] = useState(false);
  
  const [settings, setSettings] = useState({
    survival_alerts: true,
    overspending_warnings: true,
    budget_milestones: true,
    weekly_reports: false,
    monthly_insights: true,
    savings_opportunities: true,
    anomaly_detection: true,
    academic_reminders: false,
  });

  useEffect(() => {
    if (dbSettings) {
      setSettings({
        survival_alerts: dbSettings.survival_alerts,
        overspending_warnings: dbSettings.overspending_warnings,
        budget_milestones: dbSettings.budget_milestones,
        weekly_reports: dbSettings.weekly_reports,
        monthly_insights: dbSettings.monthly_insights,
        savings_opportunities: dbSettings.savings_opportunities,
        anomaly_detection: dbSettings.anomaly_detection,
        academic_reminders: dbSettings.academic_reminders,
      });
    }
  }, [dbSettings]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  if (loading) {
    return (
      <div className="vault-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--vault-accent)]" />
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vault-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-[var(--stitch-error)]" />
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">
            Failed to load notification settings
          </p>
        </div>
      </div>
    );
  }

  const hasChanges = dbSettings && JSON.stringify(settings) !== JSON.stringify({
    survival_alerts: dbSettings.survival_alerts,
    overspending_warnings: dbSettings.overspending_warnings,
    budget_milestones: dbSettings.budget_milestones,
    weekly_reports: dbSettings.weekly_reports,
    monthly_insights: dbSettings.monthly_insights,
    savings_opportunities: dbSettings.savings_opportunities,
    anomaly_detection: dbSettings.anomaly_detection,
    academic_reminders: dbSettings.academic_reminders,
  });

  return (
    <div className="vault-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--vault-accent)]/20 flex items-center justify-center">
          <Bell className="h-5 w-5 text-[var(--vault-accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--stitch-on-surface)]">
            Notification Preferences
          </h2>
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">
            Choose what updates you want to receive
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Critical Alerts */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-[var(--stitch-on-surface)]">
            Critical Alerts
          </Label>
          
          <NotificationToggle
            label="Survival Alerts"
            description="Get notified when you're at risk of running out of money"
            checked={settings.survival_alerts}
            onChange={() => handleToggle("survival_alerts")}
          />
          
          <NotificationToggle
            label="Overspending Warnings"
            description="Alert when you exceed category budgets"
            checked={settings.overspending_warnings}
            onChange={() => handleToggle("overspending_warnings")}
          />
          
          <NotificationToggle
            label="Anomaly Detection"
            description="Notify about unusual spending patterns"
            checked={settings.anomaly_detection}
            onChange={() => handleToggle("anomaly_detection")}
          />
        </div>

        {/* Insights & Recommendations */}
        <div className="space-y-3 pt-4 border-t border-[var(--stitch-outline-variant)]">
          <Label className="text-sm font-semibold text-[var(--stitch-on-surface)]">
            Insights & Recommendations
          </Label>
          
          <NotificationToggle
            label="Budget Milestones"
            description="Celebrate when you hit savings goals"
            checked={settings.budget_milestones}
            onChange={() => handleToggle("budget_milestones")}
          />
          
          <NotificationToggle
            label="Savings Opportunities"
            description="Tips on where you can cut spending"
            checked={settings.savings_opportunities}
            onChange={() => handleToggle("savings_opportunities")}
          />
          
          <NotificationToggle
            label="Monthly Insights"
            description="End-of-month financial summary and trends"
            checked={settings.monthly_insights}
            onChange={() => handleToggle("monthly_insights")}
          />
        </div>

        {/* Periodic Reports */}
        <div className="space-y-3 pt-4 border-t border-[var(--stitch-outline-variant)]">
          <Label className="text-sm font-semibold text-[var(--stitch-on-surface)]">
            Periodic Reports
          </Label>
          
          <NotificationToggle
            label="Weekly Reports"
            description="Summary of your spending every Sunday"
            checked={settings.weekly_reports}
            onChange={() => handleToggle("weekly_reports")}
          />
          
          <NotificationToggle
            label="Academic Reminders"
            description="Financial tips based on academic calendar"
            checked={settings.academic_reminders}
            onChange={() => handleToggle("academic_reminders")}
          />
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-[var(--vault-accent)]/10 border border-[var(--vault-accent)]/20">
          <p className="text-xs text-[var(--stitch-on-surface-variant)]">
            💡 We recommend keeping critical alerts enabled to stay on top of your finances.
          </p>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--stitch-outline-variant)]">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending || saved}
              className="bg-[var(--vault-accent)] hover:bg-[var(--vault-accent)]/90 text-white"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
            {saved && (
              <span className="text-sm text-green-500">Preferences saved</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function NotificationToggle({ label, description, checked, onChange }: NotificationToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-[var(--stitch-surface-container)] border border-[var(--stitch-outline-variant)]">
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--stitch-on-surface)]">{label}</p>
        <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--vault-accent)] focus:ring-offset-2
          ${checked ? "bg-[var(--vault-accent)]" : "bg-[var(--stitch-outline-variant)]"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}
