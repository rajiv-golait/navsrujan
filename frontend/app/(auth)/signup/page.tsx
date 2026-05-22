"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { AuthResponse } from "@/types/transaction";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post<AuthResponse>("/auth/signup", {
        email,
        password,
        full_name: fullName,
      });

      if (data.session) {
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (error) throw error;

        toast.success("Account created!");
        router.push("/dashboard");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[var(--stitch-primary)]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[var(--stitch-secondary-container)]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md stitch-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-headline-lg text-[var(--stitch-primary)] mb-1">StriveBudget</h1>
          <h2 className="text-headline-mobile text-[var(--stitch-on-surface)]">Create your account</h2>
          <p className="text-sm text-[var(--stitch-on-surface-variant)] mt-1">
            Start tracking your student finances today
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-[var(--stitch-on-surface)]">Full name</Label>
            <Input
              id="fullName"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12 text-base focus:border-[var(--stitch-primary)] focus:ring-[var(--stitch-primary)]/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-[var(--stitch-on-surface)]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12 text-base focus:border-[var(--stitch-primary)] focus:ring-[var(--stitch-primary)]/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-[var(--stitch-on-surface)]">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12 text-base focus:border-[var(--stitch-primary)] focus:ring-[var(--stitch-primary)]/30"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white font-semibold h-12 rounded-xl shadow-md active:scale-[0.97] transition-all"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--stitch-on-surface-variant)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--stitch-primary)] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
