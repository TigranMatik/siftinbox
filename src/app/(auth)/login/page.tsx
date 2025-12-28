"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
          scopes: "email profile https://www.googleapis.com/auth/gmail.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login with Google");
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
          },
        });
        if (error) throw error;
        toast.success("Check your email for confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF3D5] border-8 border-[#C4A484] p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Card */}
        <div className="bg-[#F5E6C3] rounded-3xl p-8 border border-[#C4A484]/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-[#C4A484] rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-[#FFF3D5]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#5C4A32] animate-fade-in-up stagger-1">Welcome to Fast Action</h1>
            <p className="text-[#8B7355] mt-2 animate-fade-in-up stagger-2">
              Turn your inbox into actionable clarity
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {!isEmailMode ? (
              <div className="space-y-4 animate-fade-in">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-[#5C4A32] font-medium rounded-xl flex items-center justify-center border border-[#C4A484]/30 transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#C4A484]/30" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#F5E6C3] px-2 text-[#8B7355]">Or</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEmailMode(true)}
                  className="w-full h-12 border border-[#C4A484] text-[#5C4A32] font-medium rounded-xl hover:bg-[#FFF3D5] transition-all duration-150 flex items-center justify-center active:scale-[0.98]"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Continue with Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4 animate-fade-in">
                <div className="space-y-2 animate-fade-in-up stagger-1">
                  <label htmlFor="email" className="text-sm font-medium text-[#5C4A32]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 px-4 bg-[#FFF3D5] border border-[#C4A484]/30 rounded-xl text-[#5C4A32] placeholder-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#C4A484] transition-colors duration-150"
                  />
                </div>
                <div className="space-y-2 animate-fade-in-up stagger-2">
                  <label htmlFor="password" className="text-sm font-medium text-[#5C4A32]">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-12 px-4 bg-[#FFF3D5] border border-[#C4A484]/30 rounded-xl text-[#5C4A32] placeholder-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#C4A484] transition-colors duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#C4A484] text-white font-medium rounded-xl hover:bg-[#A68B6A] transition-all duration-150 disabled:opacity-50 flex items-center justify-center active:scale-[0.98] animate-fade-in-up stagger-3"
                >
                  {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {isSignUp ? "Sign Up" : "Sign In"}
                </button>

                <div className="flex items-center justify-between text-sm animate-fade-in-up stagger-4">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#C4A484] hover:underline"
                  >
                    {isSignUp ? "Already have an account?" : "Need an account?"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEmailMode(false)}
                    className="text-[#8B7355] hover:underline"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-[#8B7355] pt-2 animate-fade-in">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
