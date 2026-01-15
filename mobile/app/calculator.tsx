import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, Calculator as CalculatorIcon, TrendingUp, DollarSign, AlertTriangle, Info } from 'lucide-react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

const currencyPairs = [
  { value: 'EUR/USD', label: 'EUR/USD' },
  { value: 'GBP/USD', label: 'GBP/USD' },
  { value: 'USD/JPY', label: 'USD/JPY' },
  { value: 'AUD/USD', label: 'AUD/USD' },
  { value: 'USD/CAD', label: 'USD/CAD' },
  { value: 'XAU/USD', label: 'XAU/USD (Gold)' },
];

export default function CalculatorScreen() {
  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPercentage, setRiskPercentage] = useState('2');
  const [stopLossPips, setStopLossPips] = useState('50');
  const [currencyPair, setCurrencyPair] = useState('EUR/USD');
  const { unreadCount } = useUnreadNotificationsCount();

  const calculation = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercentage) || 0;
    const stopLoss = parseFloat(stopLossPips) || 0;

    if (balance <= 0 || risk <= 0 || stopLoss <= 0) {
      return null;
    }

    const riskAmount = (balance * risk) / 100;
    const pipValuePerStandardLot = 10;
    const standardLots = riskAmount / (stopLoss * pipValuePerStandardLot);
    const miniLots = standardLots * 10;
    const microLots = standardLots * 100;
    const positionValue = standardLots * 100000;

    return {
      riskAmount,
      standardLots,
      miniLots,
      microLots,
      positionValue,
    };
  }, [accountBalance, riskPercentage, stopLossPips]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calculator</Text>
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={Colors.gold} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Info size={20} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.infoText}>
            Calculate your optimal lot size based on your account balance and risk tolerance
          </Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Trading Parameters</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Balance ($)</Text>
            <TextInput
              style={styles.input}
              value={accountBalance}
              onChangeText={setAccountBalance}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor="#A0A0A0"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Risk Percentage (%)</Text>
            <TextInput
              style={styles.input}
              value={riskPercentage}
              onChangeText={setRiskPercentage}
              keyboardType="numeric"
              placeholder="2"
              placeholderTextColor="#A0A0A0"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Stop Loss (Pips)</Text>
            <TextInput
              style={styles.input}
              value={stopLossPips}
              onChangeText={setStopLossPips}
              keyboardType="numeric"
              placeholder="50"
              placeholderTextColor="#A0A0A0"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Currency Pair</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={currencyPair}
                onValueChange={(itemValue) => setCurrencyPair(itemValue)}
                style={styles.picker}
                dropdownIconColor={Colors.gold}
              >
                {currencyPairs.map((pair) => (
                  <Picker.Item key={pair.value} label={pair.label} value={pair.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Results Section */}
        {calculation != null ? (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Calculation Results</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <DollarSign size={20} color={Colors.gold} strokeWidth={2} />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultLabel}>Risk Amount</Text>
                  <Text style={styles.resultValue}>${formatNumber(calculation.riskAmount)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <TrendingUp size={20} color={Colors.gold} strokeWidth={2} />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultLabel}>Standard Lots</Text>
                  <Text style={styles.resultValue}>{formatNumber(calculation.standardLots, 3)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <CalculatorIcon size={20} color={Colors.gold} strokeWidth={2} />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultLabel}>Mini Lots</Text>
                  <Text style={styles.resultValue}>{formatNumber(calculation.miniLots, 2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <CalculatorIcon size={20} color={Colors.gold} strokeWidth={2} />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultLabel}>Micro Lots</Text>
                  <Text style={styles.resultValue}>{formatNumber(calculation.microLots, 1)}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.resultCard, styles.highlightCard]}>
              <View style={styles.resultRow}>
                <DollarSign size={20} color={'#000000'} strokeWidth={2} />
                <View style={styles.resultTextContainer}>
                  <Text style={[styles.resultLabel, { color: '#000000' }]}>Position Value</Text>
                  <Text style={[styles.resultValue, { color: '#000000' }]}>
                    ${formatNumber(calculation.positionValue, 0)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.warningCard}>
              <AlertTriangle size={18} color="#FF4444" strokeWidth={2} />
              <Text style={styles.warningText}>
                Always use proper risk management. Never risk more than you can afford to lose.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <CalculatorIcon size={48} color={Colors.rainyGrey} />
            <Text style={styles.emptyStateText}>Enter parameters to calculate</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Axiforma-Bold',
    lineHeight: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    marginLeft: 12,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
    color: '#A0A0A0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  pickerContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
    backgroundColor: '#2A2A2A',
  },
  resultsSection: {
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  highlightCard: {
    backgroundColor: Colors.gold,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 15,
    fontFamily: 'Axiforma-Medium',
    color: '#A0A0A0',
  },
  resultValue: {
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#FF4444',
    marginLeft: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: Colors.rainyGrey,
    marginTop: 16,
  },
});
