"use client";

import { useState } from "react";
import { UserProfile, useUpdateProfile } from "@/lib/hooks/useProfile";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Save, Loader2, CheckCircle } from "lucide-react";

interface PersonalInfoSectionProps {
  profile: UserProfile | undefined;
}

export function PersonalInfoSection({ profile }: PersonalInfoSectionProps) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const hasChanges = fullName !== (profile?.full_name || "");

  return (
    <div className="vault-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--vault-accent)]/20 flex items-center justify-center">
          <User className="h-5 w-5 text-[var(--vault-accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--stitch-on-surface)]">
            Personal Information
          </h2>
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">
            Manage your personal details
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[var(--stitch-on-surface)]">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--stitch-on-surface-variant)]" />
            <Input
              type="email"
              value={user?.email || ""}
              disabled
              className="pl-10 bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface-variant)] cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-[var(--stitch-on-surface-variant)]">
            Your email is managed by authentication provider
          </p>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-[var(--stitch-on-surface)]">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface)] placeholder:text-[var(--stitch-on-surface-variant)]"
          />
        </div>

        {/* Member Since */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[var(--stitch-on-surface)]">
            Member Since
          </Label>
          <div className="px-4 py-3 rounded-lg bg-[var(--stitch-surface-container)] border border-[var(--stitch-outline-variant)]">
            <p className="text-sm text-[var(--stitch-on-surface)]">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--stitch-outline-variant)]">
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || saved}
              className="bg-[var(--vault-accent)] hover:bg-[var(--vault-accent)]/90 text-white"
            >
              {updateProfile.isPending ? (
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
                  Save Changes
                </>
              )}
            </Button>
            {saved && (
              <span className="text-sm text-green-500">Changes saved successfully</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
