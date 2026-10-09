import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../shared/constants/colors';
import { supabase } from '../lib/supabase';
import type { SignalPricing } from '../../shared/types/signal';
import {
  SIGNAL_DURATIONS,
  SIGNAL_PROVIDERS,
  formatTzs,
  normalizeTzPhone,
  phoneMatchesProvider,
  providerForPhone,
  type SignalDuration,
  type SignalProviderId,
} from '../../shared/utils/signal-payment';

async function readInvokeError(error: unknown): Promise<{ payment_id?: string; error?: string } | null> {
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;
  if (!context?.json) return null;
  try {
    return (await context.json()) as { payment_id?: string; error?: string };
  } catch {
    return null;
  }
}

export default function SignalPaywall({ onPaid }: { onPaid: () => void }) {
  const [plans, setPlans] = useState<SignalPricing[]>([]);
  const [duration, setDuration] = useState<SignalDuration>('monthly');
  const [provider, setProvider] = useState<SignalProviderId>('mpesa');
  const [phone, setPhone] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const [{ data: pricing }, { data: profile }, { data: pending }] = await Promise.all([
        supabase.from('signal_pricing').select('*').eq('is_active', true).order('price'),
        supabase.from('user_profiles').select('phone_number').eq('id', userId).maybeSingle(),
        supabase
          .from('signal_payments')
          .select('id, phone_number, provider')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setPlans((pricing as SignalPricing[]) ?? []);
      const defaultPhone = profile?.phone_number || '';
      setPhone(defaultPhone);
      const detected = providerForPhone(defaultPhone);
      if (detected) setProvider(detected);
      if (pending?.id) {
        setPaymentId(pending.id);
        setWaiting(true);
        if (pending.phone_number) setPhone(pending.phone_number);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!waiting || !paymentId) return;
    let stopped = false;
    const check = async () => {
      const { data } = await supabase
        .from('signal_payments')
        .select('status, failure_reason')
        .eq('id', paymentId)
        .maybeSingle();
      if (stopped || !data) return;
      if (data.status === 'completed') {
        onPaidRef.current();
        return;
      }
      if (data.status === 'failed' || data.status === 'expired' || data.status === 'voided') {
        setWaiting(false);
        setPaymentId(null);
        setMessage(data.failure_reason || 'The payment was not completed. You can try again.');
      }
    };
    check();
    const timer = setInterval(check, 3000);
    const channel = supabase
      .channel(`signal-payment-${paymentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'signal_payments', filter: `id=eq.${paymentId}` },
        () => { check(); },
      )
      .subscribe();
    return () => {
      stopped = true;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [waiting, paymentId]);

  const confirm = async () => {
    setMessage(null);
    if (!normalizeTzPhone(phone)) {
      setMessage('Enter a valid Tanzanian phone number.');
      return;
    }
    if (!phoneMatchesProvider(phone, provider)) {
      setMessage('That number does not match the selected provider.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('create-signal-payment', {
      body: { subscription_type: duration, provider, phone_number: phone },
    });
    setSubmitting(false);
    if (error) {
      const payload = await readInvokeError(error);
      if (payload?.payment_id) {
        setPaymentId(payload.payment_id);
        setWaiting(true);
        return;
      }
      setMessage(payload?.error || 'Could not start the payment. Try again.');
      return;
    }
    if (data?.payment_id) {
      setPaymentId(data.payment_id);
      setWaiting(true);
      return;
    }
    setMessage(data?.error || 'Could not start the payment. Try again.');
  };

  if (waiting) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Approve the USSD prompt on your phone</Text>
        <Text style={styles.hint}>Enter your mobile money PIN to finish. This screen updates when the payment is confirmed.</Text>
        <ActivityIndicator color={Colors.gold} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const selectedPlan = plans.find((plan) => plan.pricing_type === duration);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pay for signals</Text>
      <Text style={styles.hint}>Choose a duration and confirm the number that should receive the USSD prompt.</Text>

      {SIGNAL_DURATIONS.map((option) => {
        const plan = plans.find((item) => item.pricing_type === option.id);
        const active = duration === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => setDuration(option.id)}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionPrice}>{plan ? formatTzs(Number(plan.price)) : '—'}</Text>
          </TouchableOpacity>
        );
      })}

      <Text style={styles.fieldLabel}>Provider</Text>
      <View style={styles.providerGrid}>
        {SIGNAL_PROVIDERS.map((option) => {
          const active = provider === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.provider, active && styles.optionActive]}
              onPress={() => setProvider(option.id)}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Phone number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="0712345678"
        placeholderTextColor="#666666"
        keyboardType="phone-pad"
        selectionColor={Colors.gold}
      />

      {message ? <Text style={styles.error}>{message}</Text> : null}

      <TouchableOpacity
        style={[styles.confirm, (!selectedPlan || submitting) && { opacity: 0.6 }]}
        onPress={confirm}
        disabled={!selectedPlan || submitting}
      >
        <Text style={styles.confirmText}>
          {submitting ? 'Sending prompt…' : 'Confirm payment'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  hint: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  option: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(244, 196, 100, 0.08)',
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-Bold',
  },
  optionPrice: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Axiforma-Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  provider: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '48%',
  },
  input: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Axiforma-Regular',
    fontSize: 16,
  },
  error: {
    color: '#F87171',
    marginTop: 12,
    fontFamily: 'Axiforma-Regular',
  },
  confirm: {
    marginTop: 16,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#111111',
    fontFamily: 'Axiforma-Bold',
    fontSize: 16,
  },
});
