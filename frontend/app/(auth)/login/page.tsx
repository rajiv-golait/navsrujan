"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("No session returned. Check your email confirmation.");
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid credentials",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--stitch-primary)]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--stitch-secondary-container)]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md stitch-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-headline-lg text-[var(--stitch-primary)] mb-1">StriveBudget</h1>
          <h2 className="text-headline-mobile text-[var(--stitch-on-surface)]">Welcome back</h2>
          <p className="text-sm text-[var(--stitch-on-surface-variant)] mt-1">
            Log in to your student finance account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[var(--stitch-surface-container-low)] border-[var(--stitch-outline-variant)]/30 rounded-xl h-12 text-base focus:border-[var(--stitch-primary)] focus:ring-[var(--stitch-primary)]/30"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white font-semibold h-12 rounded-xl shadow-md active:scale-[0.97] transition-all"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--stitch-on-surface-variant)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--stitch-primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
