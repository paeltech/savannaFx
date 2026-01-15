import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../shared/constants/colors';
import { 
  ChevronLeft, 
  Bell, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Target,
  Shield,
  FileText,
  DollarSign,
  ShoppingCart
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { TradeAnalysis } from '../../../shared/types/analysis';
import { useUnreadNotificationsCount } from '../../hooks/use-unread-notifications';

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const { unreadCount } = useUnreadNotificationsCount();

  useEffect(() => {
    if (id) {
      fetchAnalysis();
      checkPurchaseStatus();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('trade_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        Alert.alert('Error', 'Failed to load analysis details');
        return;
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      Alert.alert('Error', 'An error occurred while loading the analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingPurchase(false);
        return;
      }

      const { data, error } = await supabase
        .from('trade_analysis_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('trade_analysis_id', id)
        .eq('payment_status', 'completed')
        .single();

      if (!error && data) {
        setIsPurchased(true);
      }
    } catch (error) {
      console.error('Error checking purchase status:', error);
    } finally {
      setCheckingPurchase(false);
    }
  };

  const handlePurchase = () => {
    Alert.alert(
      'Purchase Analysis',
      `Would you like to purchase this analysis for $${analysis?.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purchase', 
          onPress: async () => {
            // TODO: Implement payment flow
            Alert.alert('Coming Soon', 'Payment integration will be available soon!');
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRiskColor = (riskLevel: string | null) => {
    switch (riskLevel) {
      case 'high':
        return '#FF4444';
      case 'medium':
        return '#FFA500';
      case 'low':
        return '#22C55E';
      default:
        return '#A0A0A0';
    }
  };

  const getRiskIcon = (riskLevel: string | null) => {
    const color = getRiskColor(riskLevel);
    return <AlertCircle size={18} color={color} strokeWidth={2} />;
  };

  if (isLoading || checkingPurchase) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!analysis) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Analysis not found</Text>
          <TouchableOpacity style={styles.backToListButton} onPress={() => router.back()}>
            <Text style={styles.backToListText}>Back to Analysis</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={28} color={Colors.gold} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Details</Text>
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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false as boolean}
      >
        {/* Trading Pair Header */}
        <View style={styles.pairHeader}>
          <Text style={styles.tradingPair}>{analysis.trading_pair}</Text>
          {analysis.risk_level != null && (
            <View style={[styles.riskBadge, { borderColor: getRiskColor(analysis.risk_level) }]}>
              {getRiskIcon(analysis.risk_level)}
              <Text style={[styles.riskText, { color: getRiskColor(analysis.risk_level) }]}>
                {analysis.risk_level.toUpperCase()} RISK
              </Text>
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#A0A0A0" strokeWidth={2} />
          <Text style={styles.dateText}>
            Analysis posted on: {formatDate(analysis.analysis_date)}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{analysis.title}</Text>

        {/* Summary */}
        {analysis.summary != null && (
          <View style={styles.summaryCard}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Summary</Text>
            </View>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>
        )}

        {/* Entry Levels */}
        {analysis.entry_levels != null && Object.keys(analysis.entry_levels).length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <ArrowDown size={20} color="#22C55E" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Entry Levels</Text>
            </View>
            <View style={styles.levelsContainer}>
              {Object.entries(analysis.entry_levels).map(([key, value]) => (
                <View key={key} style={styles.levelRow}>
                  <Text style={styles.levelLabel}>{key.replace(/_/g, ' ').toUpperCase()}:</Text>
                  <Text style={styles.levelValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exit Levels */}
        {analysis.exit_levels != null && Object.keys(analysis.exit_levels).length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <ArrowUp size={20} color="#FF4444" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Exit Levels</Text>
            </View>
            <View style={styles.levelsContainer}>
              {Object.entries(analysis.exit_levels).map(([key, value]) => (
                <View key={key} style={styles.levelRow}>
                  <Text style={styles.levelLabel}>{key.replace(/_/g, ' ').toUpperCase()}:</Text>
                  <Text style={styles.levelValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Technical Analysis */}
        {analysis.technical_analysis != null && Object.keys(analysis.technical_analysis).length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Technical Analysis</Text>
            </View>
            {isPurchased ? (
              <View style={styles.contentContainer}>
                {Object.entries(analysis.technical_analysis).map(([key, value]) => (
                  <View key={key} style={styles.analysisItem}>
                    <Text style={styles.analysisKey}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.analysisValue}>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.lockedContent}>
                <Shield size={32} color="#3A3A3A" strokeWidth={2} />
                <Text style={styles.lockedText}>Purchase to unlock full analysis</Text>
              </View>
            )}
          </View>
        )}

        {/* Fundamental Analysis */}
        {analysis.fundamental_analysis != null && Object.keys(analysis.fundamental_analysis).length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Target size={20} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Fundamental Analysis</Text>
            </View>
            {isPurchased ? (
              <View style={styles.contentContainer}>
                {Object.entries(analysis.fundamental_analysis).map(([key, value]) => (
                  <View key={key} style={styles.analysisItem}>
                    <Text style={styles.analysisKey}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.analysisValue}>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.lockedContent}>
                <Shield size={32} color="#3A3A3A" strokeWidth={2} />
                <Text style={styles.lockedText}>Purchase to unlock full analysis</Text>
              </View>
            )}
          </View>
        )}

        {/* Full Content */}
        {isPurchased ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Detailed Analysis</Text>
            </View>
            <Text style={styles.contentText}>{analysis.content}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.lockedContent}>
              <Shield size={48} color="#3A3A3A" strokeWidth={2} />
              <Text style={styles.lockedTitle}>Full Analysis Locked</Text>
              <Text style={styles.lockedSubtext}>
                Purchase this analysis to access complete technical and fundamental insights
              </Text>
            </View>
          </View>
        )}

        {/* Purchase Button */}
        {!isPurchased && (
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
            <ShoppingCart size={20} color="#000000" strokeWidth={2} />
            <Text style={styles.purchaseButtonText}>
              Purchase Analysis - ${String(analysis.price)}
            </Text>
          </TouchableOpacity>
        )}

        {isPurchased && (
          <View style={styles.purchasedBanner}>
            <Shield size={20} color="#22C55E" strokeWidth={2} />
            <Text style={styles.purchasedText}>You own this analysis</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 16,
  },
  backToListButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.gold,
    borderRadius: 12,
  },
  backToListText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
  },
  pairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradingPair: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  riskText: {
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    marginLeft: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    lineHeight: 32,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginLeft: 10,
  },
  summaryText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 24,
  },
  levelsContainer: {
    gap: 12,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
  },
  levelLabel: {
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Medium',
  },
  levelValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-Bold',
  },
  contentContainer: {
    gap: 16,
  },
  analysisItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  analysisKey: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    marginBottom: 6,
  },
  analysisValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
  },
  contentText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 24,
  },
  lockedContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  lockedText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
    marginTop: 12,
  },
  lockedTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  lockedSubtext: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  purchaseButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  purchaseButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    marginLeft: 10,
  },
  purchasedBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginTop: 8,
  },
  purchasedText: {
    color: '#22C55E',
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
    marginLeft: 8,
  },
});
