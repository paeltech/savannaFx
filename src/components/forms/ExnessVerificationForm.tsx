"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  exness_account_id: z.string().min(3, "Account ID is too short").optional().or(z.literal("")),
  telegram_username: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const ExnessVerificationForm: React.FC<{ onSubmitted?: () => void }> = ({ onSubmitted }) => {
  const { session } = useSupabaseSession();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      exness_account_id: "",
      telegram_username: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!session?.user?.id) {
      showError("You must be signed in to submit verification");
      throw new Error("Not authenticated");
    }
    const payload = {
      user_id: session.user.id,
      email: values.email,
      exness_account_id: values.exness_account_id || null,
      telegram_username: values.telegram_username || null,
      status: "pending",
    };
    const { error } = await supabase.from("exness_verifications").insert(payload);
    if (error) {
      showError(error.message);
      throw error;
    }
    showSuccess("Verification submitted. We'll review and contact you shortly.");
    form.reset();
    onSubmitted?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" className="bg-nero border-steel-wool text-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="exness_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exness Account ID (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 12345678" className="bg-slate-900/60 border-slate-800 text-slate-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telegram_username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telegram Username (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="@yourhandle" className="bg-slate-900/60 border-slate-800 text-slate-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 font-semibold">
            Submit Verification
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExnessVerificationForm;