"use client";

import { useState } from "react";
import { UserProfile, useUpdateProfile } from "@/lib/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Save, Loader2, CheckCircle } from "lucide-react";

interface EducationSectionProps {
  profile: UserProfile | undefined;
}

export function EducationSection({ profile }: EducationSectionProps) {
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    college: profile?.college || "",
    university: profile?.university || "",
    course: profile?.course || "",
    education_type: profile?.education_type || "",
    current_semester: profile?.current_semester || 1,
    degree_duration: profile?.degree_duration || 4,
    location_type: profile?.location_type || "",
    accommodation_type: profile?.accommodation_type || "",
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update education info:", error);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    college: profile?.college || "",
    university: profile?.university || "",
    course: profile?.course || "",
    education_type: profile?.education_type || "",
    current_semester: profile?.current_semester || 1,
    degree_duration: profile?.degree_duration || 4,
    location_type: profile?.location_type || "",
    accommodation_type: profile?.accommodation_type || "",
  });

  return (
    <div className="vault-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--vault-accent)]/20 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-[var(--vault-accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--stitch-on-surface)]">
            Education Details
          </h2>
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">
            Your academic information for personalized insights
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* College */}
          <div className="space-y-2">
            <Label htmlFor="college" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              College/Institute
            </Label>
            <Input
              id="college"
              type="text"
              value={formData.college}
              onChange={(e) => handleChange("college", e.target.value)}
              placeholder="e.g., IIT Delhi, BITS Pilani"
              className="bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
            />
          </div>

          {/* University */}
          <div className="space-y-2">
            <Label htmlFor="university" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              University
            </Label>
            <Input
              id="university"
              type="text"
              value={formData.university}
              onChange={(e) => handleChange("university", e.target.value)}
              placeholder="e.g., Delhi University"
              className="bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course */}
          <div className="space-y-2">
            <Label htmlFor="course" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Course/Degree
            </Label>
            <Input
              id="course"
              type="text"
              value={formData.course}
              onChange={(e) => handleChange("course", e.target.value)}
              placeholder="e.g., B.Tech CSE, MBA"
              className="bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
            />
          </div>

          {/* Education Type */}
          <div className="space-y-2">
            <Label htmlFor="education_type" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Education Type
            </Label>
            <select
              id="education_type"
              value={formData.education_type}
              onChange={(e) => handleChange("education_type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--stitch-surface-container)] border border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface)]"
            >
              <option value="">Select type</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="diploma">Diploma</option>
              <option value="certification">Certification</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Semester */}
          <div className="space-y-2">
            <Label htmlFor="current_semester" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Current Semester/Year
            </Label>
            <Input
              id="current_semester"
              type="number"
              min="1"
              max="12"
              value={formData.current_semester}
              onChange={(e) => handleChange("current_semester", parseInt(e.target.value))}
              className="bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
            />
          </div>

          {/* Degree Duration */}
          <div className="space-y-2">
            <Label htmlFor="degree_duration" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Total Duration (years)
            </Label>
            <Input
              id="degree_duration"
              type="number"
              min="1"
              max="8"
              value={formData.degree_duration}
              onChange={(e) => handleChange("degree_duration", parseInt(e.target.value))}
              className="bg-[var(--stitch-surface-container)] border-[var(--stitch-outline-variant)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location Type */}
          <div className="space-y-2">
            <Label htmlFor="location_type" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Location Type
            </Label>
            <select
              id="location_type"
              value={formData.location_type}
              onChange={(e) => handleChange("location_type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--stitch-surface-container)] border border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface)]"
            >
              <option value="">Select location</option>
              <option value="metro">Metro City</option>
              <option value="tier1">Tier 1 City</option>
              <option value="tier2">Tier 2 City</option>
              <option value="tier3">Tier 3 City</option>
              <option value="town">Town/Rural</option>
            </select>
          </div>

          {/* Accommodation Type */}
          <div className="space-y-2">
            <Label htmlFor="accommodation_type" className="text-sm font-medium text-[var(--stitch-on-surface)]">
              Accommodation
            </Label>
            <select
              id="accommodation_type"
              value={formData.accommodation_type}
              onChange={(e) => handleChange("accommodation_type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--stitch-surface-container)] border border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface)]"
            >
              <option value="">Select type</option>
              <option value="hostel">Hostel/Dorm</option>
              <option value="pg">PG/Shared</option>
              <option value="rented">Rented Apartment</option>
              <option value="home">Living at Home</option>
            </select>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-[var(--vault-accent)]/10 border border-[var(--vault-accent)]/20">
          <p className="text-xs text-[var(--stitch-on-surface-variant)]">
            💡 These details help us provide more accurate peer comparisons and personalized financial recommendations tailored to your student life.
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
              <span className="text-sm text-green-500">Changes saved successfully</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
