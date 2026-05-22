"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, Eye, EyeOff, Key, Download, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/lib/hooks/usePrivacySettings";

export function PrivacySecurity() {
  const { settings: dbSettings, loading, error } = usePrivacySettings();
  const updateSettings = useUpdatePrivacySettings();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [privacySettings, setPrivacySettings] = useState({
    data_sharing_for_insights: true,
    anonymous_peer_comparison: true,
    store_transaction_history: true,
  });

  useEffect(() => {
    if (dbSettings) {
      setPrivacySettings({
        data_sharing_for_insights: dbSettings.data_sharing_for_insights,
        anonymous_peer_comparison: dbSettings.anonymous_peer_comparison,
        store_transaction_history: dbSettings.store_transaction_history,
      });
    }
  }, [dbSettings]);

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert("New passwords don't match!");
      return;
    }
    
    setChangingPassword(true);
    // TODO: Implement actual password change API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setChangingPassword(false);
    setPasswordChanged(true);
    setPasswordForm({ current: "", new: "", confirm: "" });
    setTimeout(() => setPasswordChanged(false), 3000);
  };

  const handleExportData = async () => {
    setExportingData(true);
    // TODO: Implement data export functionality
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setExportingData(false);
    alert("Your data has been exported successfully!");
  };

  const togglePrivacySetting = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrivacySettings = async () => {
    try {
      await updateSettings.mutateAsync(privacySettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
    }
  };

  const hasChanges = dbSettings && JSON.stringify(privacySettings) !== JSON.stringify({
    data_sharing_for_insights: dbSettings.data_sharing_for_insights,
    anonymous_peer_comparison: dbSettings.anonymous_peer_comparison,
    store_transaction_history: dbSettings.store_transaction_history,
  });

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="vault-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[var(--vault-accent)]/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-[var(--vault-accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--stitch-on-surface)]">
              Change Password
            </h2>
            <p className="text-sm text-[var(--stitch-on-surface-variant)]">
              Update your account password
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="pr-10 bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stitch-on-surface-variant)]"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="pr-10 bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stitch-on-surface-variant)]"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="pr-10 bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--stitch-on-surface-variant)]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm || changingPassword || passwordChanged}
            className="bg-[var(--vault-accent)] hover:bg-[var(--vault-accent)]/90 text-white"
          >
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : passwordChanged ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Password Changed!
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="vault-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[var(--vault-accent)]/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-[var(--vault-accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--stitch-on-surface)]">
              Privacy Settings
            </h2>
            <p className="text-sm text-[var(--stitch-on-surface-variant)]">
              Control how your data is used
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--vault-accent)]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-[var(--stitch-error)]" />
              <p className="text-sm text-[var(--stitch-on-surface-variant)]">
                Failed to load privacy settings
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <PrivacyToggle
                label="Data Sharing for ML Insights"
                description="Allow anonymized data to improve ML predictions"
                checked={privacySettings.data_sharing_for_insights}
                onChange={() => togglePrivacySetting("data_sharing_for_insights")}
              />
              
              <PrivacyToggle
                label="Anonymous Peer Comparison"
                description="Include your data in anonymous peer averages"
                checked={privacySettings.anonymous_peer_comparison}
                onChange={() => togglePrivacySetting("anonymous_peer_comparison")}
              />
              
              <PrivacyToggle
                label="Store Transaction History"
                description="Keep historical transaction data for better insights"
                checked={privacySettings.store_transaction_history}
                onChange={() => togglePrivacySetting("store_transaction_history")}
              />
            </div>

            {hasChanges && (
              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[var(--stitch-outline-variant)]">
                <Button
                  onClick={handleSavePrivacySettings}
                  disabled={updateSettings.isPending || settingsSaved}
                  className="bg-[var(--vault-accent)] hover:bg-[var(--vault-accent)]/90 text-white"
                >
                  {updateSettings.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : settingsSaved ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Save Privacy Settings
                    </>
                  )}
                </Button>
                {settingsSaved && (
                  <span className="text-sm text-green-500">Settings saved</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Export */}
      <div className="vault-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--stitch-on-surface)]">Export Your Data</h3>
            <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
              Download all your financial data in JSON format
            </p>
          </div>
          <Button
            onClick={handleExportData}
            disabled={exportingData}
            variant="outline"
            size="sm"
            className="border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface)]"
          >
            {exportingData ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PrivacyToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function PrivacyToggle({ label, description, checked, onChange }: PrivacyToggleProps) {
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
