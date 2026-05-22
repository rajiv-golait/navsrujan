"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/useAuth";

export function DangerZone() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSignOutAllDevices = async () => {
    if (confirm("Are you sure you want to sign out from all devices?")) {
      try {
        await signOut();
        router.replace("/login");
      } catch (error) {
        console.error("Failed to sign out:", error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      alert('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setDeleting(true);
    // TODO: Implement actual account deletion API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="p-4 rounded-lg bg-[var(--stitch-error)]/10 border border-[var(--stitch-error)]/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[var(--stitch-error)] mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--stitch-error)]">Danger Zone</h3>
            <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
              These actions are irreversible. Please proceed with caution.
            </p>
          </div>
        </div>
      </div>

      {/* Sign Out All Devices */}
      <div className="vault-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--stitch-on-surface)]">
              Sign Out All Devices
            </h3>
            <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
              This will sign you out from all browsers and devices where you're currently logged in.
            </p>
          </div>
          <Button
            onClick={handleSignOutAllDevices}
            variant="outline"
            size="sm"
            className="border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface)] hover:bg-[var(--stitch-error)]/10 hover:border-[var(--stitch-error)] hover:text-[var(--stitch-error)]"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out All
          </Button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="vault-card p-6 border-2 border-[var(--stitch-error)]/30">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-[var(--stitch-error)] mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--stitch-error)]">
                Delete Account Permanently
              </h3>
              <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
                Once you delete your account, there is no going back. All your data including transactions, insights, and settings will be permanently removed.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              size="sm"
              className="bg-[var(--stitch-error)] hover:bg-[var(--stitch-error)]/90 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-[var(--stitch-outline-variant)]">
              <div className="p-4 rounded-lg bg-[var(--stitch-error)]/10 border border-[var(--stitch-error)]/30">
                <p className="text-xs text-[var(--stitch-on-surface)] font-medium mb-2">
                  ⚠️ This action will:
                </p>
                <ul className="text-xs text-[var(--stitch-on-surface-variant)] space-y-1 ml-4">
                  <li>• Delete all your transactions and financial data</li>
                  <li>• Remove your profile and education information</li>
                  <li>• Erase all ML models and predictions trained on your data</li>
                  <li>• Sign you out from all devices immediately</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteConfirm" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                  Type <span className="font-mono text-[var(--stitch-error)]">DELETE MY ACCOUNT</span> to confirm
                </Label>
                <Input
                  id="deleteConfirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || deleting}
                  variant="destructive"
                  size="sm"
                  className="bg-[var(--stitch-error)] hover:bg-[var(--stitch-error)]/90 text-white"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Permanently Delete
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-[var(--stitch-on-surface-variant)]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Info */}
      <div className="p-4 rounded-lg bg-[var(--stitch-surface-container)] border border-[var(--stitch-outline-variant)]">
        <p className="text-xs text-[var(--stitch-on-surface-variant)]">
          💡 Before deleting, consider exporting your data from the Privacy & Security section.
        </p>
      </div>
    </div>
  );
}
