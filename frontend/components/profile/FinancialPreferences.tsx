"use client";

import { useState } from "react";
import { UserProfile, useUpdateProfile } from "@/lib/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Save, Loader2, CheckCircle, IndianRupee } from "lucide-react";

interface FinancialPreferencesProps {
  profile: UserProfile | undefined;
}

export function FinancialPreferences({ profile }: FinancialPreferencesProps) {
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(profile?.monthly_budget?.toString() || "");

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update financial preferences:", error);
    }
  };

  const hasChanges = monthlyBudget !== (profile?.monthly_budget?.toString() || "");

  return (
    <div className="vault-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--vault-accent)]/20 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-[var(--vault-accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--stitch-on-surface)]">
            Financial Preferences
          </h2>
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">
            Set your budget targets and spending goals
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Monthly Budget */}
        <div className="space-y-2">
          <Label htmlFor="monthlyBudget" className="text-sm font-medium text-[var(--stitch-on-surface)]">
            Monthly Budget Target
          </Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--stitch-on-surface-variant)]" />
            <Input
              id="monthlyBudget"
              type="number"
              min="0"
              step="100"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="Enter your monthly budget"
              className="pl-10 bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
            />
          </div>
          <p className="text-xs text-[var(--stitch-on-surface-variant)]">
            Set a realistic monthly spending limit. We'll alert you when you're close to exceeding it.
          </p>
        </div>

        {/* Budget Categories Info */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-[var(--stitch-on-surface)]">
            Budget Allocation Guide (50/30/20 Rule)
          </Label>
          
          {monthlyBudget && parseFloat(monthlyBudget) > 0 && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--stitch-on-surface)]">Needs (50%)</span>
                  <span className="text-sm font-semibold text-[var(--stitch-on-surface)]">
                    ₹{(parseFloat(monthlyBudget) * 0.5).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
                  Food, transport, bills, education essentials
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--stitch-on-surface)]">Wants (30%)</span>
                  <span className="text-sm font-semibold text-[var(--stitch-on-surface)]">
                    ₹{(parseFloat(monthlyBudget) * 0.3).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
                  Entertainment, shopping, dining out
                </p>
              </div>

              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--stitch-on-surface)]">Savings (20%)</span>
                  <span className="text-sm font-semibold text-[var(--stitch-on-surface)]">
                    ₹{(parseFloat(monthlyBudget) * 0.2).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
                  Emergency fund, future goals
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Currency Preference */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[var(--stitch-on-surface)]">
            Currency
          </Label>
          <div className="px-4 py-3 rounded-lg bg-[var(--stitch-surface-container)] border border-[var(--stitch-outline-variant)]">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-[var(--stitch-on-surface-variant)]" />
              <span className="text-sm text-[var(--stitch-on-surface)]">Indian Rupee (₹)</span>
            </div>
          </div>
          <p className="text-xs text-[var(--stitch-on-surface-variant)]">
            Currently only INR is supported. More currencies coming soon.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-[var(--vault-accent)]/10 border border-[var(--vault-accent)]/20">
          <p className="text-xs text-[var(--stitch-on-surface-variant)]">
            💡 Tip: Your budget helps our AI predict when you might run short and suggest ways to optimize spending. Be honest with yourself!
          </p>
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
              <span className="text-sm text-green-500">Budget updated successfully</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
