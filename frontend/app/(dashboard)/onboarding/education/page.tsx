"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { useSetupEducationProfile } from "@/lib/hooks/useEducation";

const educationSchema = z.object({
  education_type: z.string().min(1, "Education type is required"),
  university: z.string().min(1, "University is required"),
  current_semester: z.coerce.number().min(1).max(12),
  degree_start_date: z.string().min(1, "Start date is required"),
  expected_graduation: z.string().min(1, "Graduation date is required"),
  location_type: z.string().min(1, "Location type is required"),
  accommodation_type: z.string().min(1, "Accommodation type is required"),
});

type EducationFormValues = z.input<typeof educationSchema>;

export default function EducationOnboardingPage() {
  const router = useRouter();
  const setupProfile = useSetupEducationProfile();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      current_semester: 1,
      education_type: "BTech",
      location_type: "metro",
      accommodation_type: "hostel",
    },
  });

  const onSubmit = async (data: EducationFormValues) => {
    try {
      const parsed = educationSchema.parse(data);
      await setupProfile.mutateAsync(parsed);
      toast.success("Education profile saved!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--stitch-on-surface)]">
          Set up your Education Profile
        </h1>
        <p className="text-[var(--stitch-on-surface-variant)] mt-2">
          We need this to provide accurate peer comparisons, academic expense tracking, and long-term planning.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-[var(--stitch-surface-container-low)] p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Education Type</label>
            <select
              {...register("education_type")}
              className="w-full p-3 rounded-xl border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]"
            >
              <option value="BTech">B.Tech / B.E.</option>
              <option value="MBA">MBA</option>
              <option value="Design">Design (B.Des)</option>
              <option value="Medical">Medical (MBBS)</option>
              <option value="BBA">BBA</option>
              <option value="Law">Law (LLB)</option>
              <option value="Architecture">Architecture (B.Arch)</option>
            </select>
            {errors.education_type && <p className="text-xs text-red-500">{errors.education_type.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">University / College</label>
            <input
              {...register("university")}
              type="text"
              placeholder="e.g. IIT Bombay"
              className="w-full p-3 rounded-xl border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]"
            />
            {errors.university && <p className="text-xs text-red-500">{errors.university.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Semester</label>
            <input
              {...register("current_semester")}
              type="number"
              min="1"
              max="12"
              className="w-full p-3 rounded-xl border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]"
            />
            {errors.current_semester && <p className="text-xs text-red-500">{errors.current_semester.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location Type</label>
            <select
              {...register("location_type")}
              className="w-full p-3 rounded-xl border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]"
            >
              <option value="metro">Metro City</option>
              <option value="tier2">Tier 2 City</option>
              <option value="tier3">Tier 3 City / Town</option>
            </select>
            {errors.location_type && <p className="text-xs text-red-500">{errors.location_type.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Accommodation Type</label>
            <select
              {...register("accommodation_type")}
              className="w-full p-3 rounded-xl border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]"
            >
              <option value="hostel">College Hostel</option>
              <option value="pg">Paying Guest (PG)</option>
              <option value="rented">Rented Flat</option>
              <option value="home">Living at Home</option>
            </select>
            {errors.accommodation_type && <p className="text-xs text-red-500">{errors.accommodation_type.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Degree Start Date</label>
            <input
              {...register("degree_start_date")}
              type="date"
              className="w-full p-3 rounded-xl border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]"
            />
            {errors.degree_start_date && <p className="text-xs text-red-500">{errors.degree_start_date.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Graduation</label>
            <input
              {...register("expected_graduation")}
              type="date"
              className="w-full p-3 rounded-xl border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]"
            />
            {errors.expected_graduation && <p className="text-xs text-red-500">{errors.expected_graduation.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-[var(--stitch-primary)] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Profile & Continue"}
        </button>
      </form>
    </div>
  );
}
