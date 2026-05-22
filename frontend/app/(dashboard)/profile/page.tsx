"use client";

import { useState } from "react";
import { VaultPageShell } from "@/components/vault/VaultPageShell";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { EducationSection } from "@/components/profile/EducationSection";
import { FinancialPreferences } from "@/components/profile/FinancialPreferences";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { PrivacySecurity } from "@/components/profile/PrivacySecurity";
import { DangerZone } from "@/components/profile/DangerZone";
import { useProfile } from "@/lib/hooks/useProfile";
import { Settings, User, GraduationCap, Wallet, Bell, Shield, AlertTriangle } from "lucide-react";

const sections = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "financial", label: "Financial", icon: Wallet },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "danger", label: "Account", icon: AlertTriangle },
];

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("personal");
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <VaultPageShell
        label="SETTINGS"
        title="Settings"
        description="Manage your profile and preferences"
      >
        <div className="vault-card p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--vault-accent)]/30 animate-pulse-soft" />
            <p className="text-sm text-[var(--stitch-on-surface-variant)]">Loading settings...</p>
          </div>
        </div>
      </VaultPageShell>
    );
  }

  if (error) {
    return (
      <VaultPageShell
        label="SETTINGS"
        title="Settings"
        description="Manage your profile and preferences"
      >
        <div className="vault-card p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="h-10 w-10 text-[var(--stitch-error)]" />
            <p className="text-sm text-[var(--stitch-on-surface-variant)]">
              Failed to load profile. Please try again.
            </p>
          </div>
        </div>
      </VaultPageShell>
    );
  }

  return (
    <VaultPageShell
      label="SETTINGS"
      title="Settings"
      description="Manage your profile and preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <div className="vault-card p-2 sticky top-24">
            <nav className="space-y-1">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      activeSection === id
                        ? "bg-[var(--vault-accent)] text-white shadow-lg shadow-[var(--vault-accent)]/20"
                        : "text-[var(--stitch-on-surface-variant)] hover:bg-[var(--stitch-surface-container-high)] hover:text-[var(--stitch-on-surface)]"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === "personal" && <PersonalInfoSection profile={profile} />}
          {activeSection === "education" && <EducationSection profile={profile} />}
          {activeSection === "financial" && <FinancialPreferences profile={profile} />}
          {activeSection === "notifications" && <NotificationSettings />}
          {activeSection === "privacy" && <PrivacySecurity />}
          {activeSection === "danger" && <DangerZone />}
        </div>
      </div>
    </VaultPageShell>
  );
}
