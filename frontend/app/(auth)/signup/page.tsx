"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { AuthResponse } from "@/types/transaction";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Education Details
  const [college, setCollege] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [educationType, setEducationType] = useState("");
  const [currentSemester, setCurrentSemester] = useState("1");
  const [degreeDuration, setDegreeDuration] = useState("4");

  // Step 3: Personal Details
  const [locationType, setLocationType] = useState("");
  const [accommodationType, setAccommodationType] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create the auth account
      const { data } = await api.post<AuthResponse>("/auth/signup", {
        email,
        password,
        full_name: fullName,
      });

      if (data.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (sessionError) throw sessionError;

        // Upsert the user profile with all the additional info
        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert({
            id: data.user.id,
            full_name: fullName,
            college: college || null,
            university: university || null,
            course: course || null,
            education_type: educationType || null,
            current_semester: currentSemester ? parseInt(currentSemester) : null,
            degree_duration: degreeDuration ? parseInt(degreeDuration) : null,
            location_type: locationType || null,
            accommodation_type: accommodationType || null,
            monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error("Profile upsert error:", profileError);
        }

        toast.success("Account created successfully!");
        router.push("/chat");
        return;
      }

      toast.success(
        "Account created! Check your email to confirm, then log in.",
      );
      router.push("/login");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.detail as string) ||
          "Signup failed. Please try again."
        : error instanceof Error
          ? error.message
          : "Signup failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!fullName || !email || !password || password.length < 6)) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step === 2 && (!college || !course || !educationType)) {
      toast.error("Please fill in all required education details");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle="Three quick steps — then you’re in Vault"
      footer={
        <p className="text-[var(--stitch-on-surface-variant)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--vault-accent)] hover:underline">
            Log in
          </Link>
        </p>
      }
    >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? "bg-[var(--vault-accent)]" : "bg-[var(--stitch-outline-variant)]"}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? "bg-[var(--vault-accent)]" : "bg-[var(--stitch-outline-variant)]"}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 3 ? "bg-[var(--vault-accent)]" : "bg-[var(--stitch-outline-variant)]"}`} />
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-semibold text-[var(--stitch-on-surface)] mb-4">Account Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                />
              </div>

              <Button
                type="button"
                onClick={nextStep}
                className="w-full bg-[var(--vault-accent)] hover:bg-[var(--vault-accent)]/90 text-white font-semibold h-12 rounded-xl"
              >
                Next: Education Details
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 2: Education Details */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-semibold text-[var(--stitch-on-surface)] mb-4">Education Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="college" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    College/Institute *
                  </Label>
                  <Input
                    id="college"
                    placeholder="e.g., IIT Delhi, BITS Pilani"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                    className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    University
                  </Label>
                  <Input
                    id="university"
                    placeholder="e.g., Delhi University"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    Course/Degree *
                  </Label>
                  <Input
                    id="course"
                    placeholder="e.g., B.Tech CSE, MBA"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                    className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educationType" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    Education Type *
                  </Label>
                  <select
                    id="educationType"
                    value={educationType}
                    onChange={(e) => setEducationType(e.target.value)}
                    required
                    className="w-full px-3 h-12 rounded-xl bg-[var(--stitch-surface-container-low)] border border-[var(--stitch-outline-variant)]/30 text-[var(--stitch-on-surface)]"
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
                <div className="space-y-2">
                  <Label htmlFor="currentSemester" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    Current Semester/Year
                  </Label>
                  <Input
                    id="currentSemester"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="1"
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degreeDuration" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    Total Duration (years)
                  </Label>
                  <Input
                    id="degreeDuration"
                    type="number"
                    min="1"
                    max="8"
                    placeholder="4"
                    value={degreeDuration}
                    onChange={(e) => setDegreeDuration(e.target.value)}
                    className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-[var(--stitch-outline-variant)]"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-[var(--vault-accent)] hover:bg-[var(--vault-accent)]/90 text-white h-12 rounded-xl"
                >
                  Next: Personal Details
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Personal & Budget Details */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-semibold text-[var(--stitch-on-surface)] mb-4">Personal & Budget Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationType" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    Location Type
                  </Label>
                  <select
                    id="locationType"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full px-3 h-12 rounded-xl bg-[var(--stitch-surface-container-low)] border border-[var(--stitch-outline-variant)]/30 text-[var(--stitch-on-surface)]"
                  >
                    <option value="">Select location</option>
                    <option value="metro">Metro City</option>
                    <option value="tier1">Tier 1 City</option>
                    <option value="tier2">Tier 2 City</option>
                    <option value="tier3">Tier 3 City</option>
                    <option value="town">Town/Rural</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accommodationType" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                    Accommodation
                  </Label>
                  <select
                    id="accommodationType"
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value)}
                    className="w-full px-3 h-12 rounded-xl bg-[var(--stitch-surface-container-low)] border border-[var(--stitch-outline-variant)]/30 text-[var(--stitch-on-surface)]"
                  >
                    <option value="">Select type</option>
                    <option value="hostel">Hostel/Dorm</option>
                    <option value="pg">PG/Shared</option>
                    <option value="rented">Rented Apartment</option>
                    <option value="home">Living at Home</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyBudget" className="text-sm font-medium text-[var(--stitch-on-surface)]">
                  Monthly Budget (₹)
                </Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g., 10000"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12"
                />
                <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                  Helps us provide personalized financial insights and recommendations
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--vault-accent)]/10 border border-[var(--vault-accent)]/20">
                <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                  💡 All this information helps our AI provide accurate predictions, peer comparisons, and personalized financial tips tailored to your student life.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-[var(--stitch-outline-variant)]"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--vault-accent)] hover:bg-[var(--vault-accent)]/90 text-white font-semibold h-12 rounded-xl shadow-md"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </div>
          )}
        </form>
    </AuthShell>
  );
}
