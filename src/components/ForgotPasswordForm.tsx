"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import supabase from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  open,
  onOpenChange,
  onSwitchToLogin,
}) => {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      // Get the current origin for the redirect URL
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess(
        "Password reset email sent! Please check your inbox and follow the instructions to reset your password."
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      showError("An error occurred. Please try again.");
      console.error("Forgot password error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-nero border-steel-wool text-white p-0 sm:rounded-lg [&>button]:text-rainy-grey [&>button]:hover:text-gold mx-4 sm:mx-auto">
        <div className="p-5 sm:p-6 md:p-8">
          <DialogHeader className="text-left mb-5 sm:mb-6">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white mb-1 font-heading">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-rainy-grey">
              Enter your email address and we'll send you a link to reset your password
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-white">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold h-11 sm:h-12 text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black h-12 sm:h-14 rounded-md font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 text-sm sm:text-base"
              >
                Send Reset Link
              </Button>
            </form>
          </Form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-rainy-grey">
              Remember your password?{" "}
              <button
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToLogin?.();
                }}
                className="text-gold hover:underline font-medium transition-colors min-h-[32px] inline-flex items-center"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordForm;
