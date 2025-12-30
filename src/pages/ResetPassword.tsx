"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import supabase from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import SiteHeader from "@/components/SiteHeader";
import PageFooter from "@/components/PageFooter";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if we have a valid session or token
    const checkToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check for token in URL hash (Supabase redirects with hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");

        if (type === "recovery" && accessToken) {
          // We have a recovery token, set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });

          if (sessionError) {
            showError("Invalid or expired reset link. Please request a new one.");
            setIsValidToken(false);
            setLoading(false);
            setTimeout(() => navigate("/"), 3000);
            return;
          }

          setIsValidToken(true);
        } else if (session) {
          // Already have a session (user might be logged in)
          setIsValidToken(true);
        } else {
          // No valid token or session
          showError("Invalid or expired reset link. Please request a new one.");
          setIsValidToken(false);
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (error) {
        console.error("Token check error:", error);
        showError("An error occurred while validating the reset link.");
        setIsValidToken(false);
        setTimeout(() => navigate("/"), 3000);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [navigate]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess("Password reset successfully! You can now sign in with your new password.");
      form.reset();
      
      // Sign out the user after password reset (they'll need to sign in again)
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      showError("An error occurred. Please try again.");
      console.error("Reset password error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-rainy-grey">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-black">
        <SiteHeader 
          onOpenMenu={() => {}}
          onOpenSignup={() => navigate("/")}
          onOpenLogin={() => navigate("/")}
        />
        <main className="pt-14 sm:pt-16 min-h-[calc(100vh-56px)] flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-heading">
              Invalid Reset Link
            </h1>
            <p className="text-rainy-grey mb-6">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20"
            >
              Go to Home
            </Button>
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <SiteHeader 
        onOpenMenu={() => {}}
        onOpenSignup={() => navigate("/")}
        onOpenLogin={() => navigate("/")}
      />
      <main className="pt-14 sm:pt-16 min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-nero border border-steel-wool rounded-lg p-5 sm:p-6 md:p-8">
            <div className="mb-5 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 font-heading">
                Reset Your Password
              </h1>
              <p className="text-xs sm:text-sm text-rainy-grey">
                Enter your new password below
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium text-white">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold pr-12 h-11 sm:h-12 text-sm sm:text-base"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-rainy-grey hover:text-gold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium text-white">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold pr-12 h-11 sm:h-12 text-sm sm:text-base"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-rainy-grey hover:text-gold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black h-12 sm:h-14 rounded-md font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 text-sm sm:text-base"
                >
                  Reset Password
                </Button>
              </form>
            </Form>

            <div className="mt-5 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-rainy-grey">
                Remember your password?{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-gold hover:underline font-medium transition-colors min-h-[32px] inline-flex items-center"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
};

export default ResetPassword;
