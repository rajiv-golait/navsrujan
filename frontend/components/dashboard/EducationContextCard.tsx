"use client";

import { memo } from "react";

import { useEducationContext } from "@/lib/hooks/useEducation";

export const EducationContextCard = memo(function EducationContextCard() {
  const { data: context, isLoading } = useEducationContext();

  if (isLoading) {
    return <div className="bg-[var(--stitch-primary-container)] p-6 rounded-[1.5rem] shadow-lg h-40 animate-pulse"></div>;
  }

  if (!context?.education_type) {
    return (
      <div className="bg-[var(--stitch-primary-container)] text-[var(--stitch-on-primary-container)] p-6 rounded-[1.5rem] shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-headline-mobile mb-2">Welcome to Smart Budget</h3>
          <p className="opacity-80 text-base mb-4">Set up your education profile to unlock peer comparisons, academic tracking, and long-term planning.</p>
          <a href="/onboarding/education" className="inline-block px-4 py-2 bg-white text-[var(--stitch-primary)] rounded-lg font-bold text-sm">
            Set up Profile
          </a>
        </div>
      </div>
    );
  }

  const progress = Math.min(((context.current_semester || 1) / ((context.degree_duration || 4) * 2)) * 100, 100);

  return (
    <div className="bg-[var(--stitch-primary-container)] text-[var(--stitch-on-primary-container)] p-6 rounded-[1.5rem] shadow-lg relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-headline-mobile">{context.university || "University"}</h3>
            <p className="opacity-80 text-base">Semester {context.current_semester} • {context.education_type}</p>
          </div>
          <svg
            className="w-10 h-10 opacity-50"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-label-caps">
            <span>Academic Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      {/* Abstract decoration */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -left-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
    </div>
  );
});

EducationContextCard.displayName = "EducationContextCard";
