import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../shared/constants/colors';
import { ChevronLeft, Bell, Calendar, TrendingUp, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { TradeAnalysis } from '../../../shared/types/analysis';
import { useUnreadNotificationsCount } from '../../hooks/use-unread-notifications';

export default function AnalysisScreen() {
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useUnreadNotificationsCount();

  useEffect(() => {
    fetchAnalyses();

    // Subscribe to real-time updates for analyses
    const channel = supabase
      .channel('analyses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_analyses'
        },
        (payload) => {
          console.log('Analysis update received:', payload);
          fetchAnalyses(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalyses = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      const { data, error } = await supabase
        .from('trade_analyses')
        .select('*')
        .order('analysis_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching analyses:', error);
        return;
      }

      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyses(true);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    return date >= weekAgo && date <= today && !isToday(dateString);
  };

  const todayAnalyses = analyses.filter(analysis => isToday(analysis.analysis_date));
  const thisWeekAnalyses = analyses.filter(analysis => isThisWeek(analysis.analysis_date));
  const olderAnalyses = analyses.filter(analysis => !isToday(analysis.analysis_date) && !isThisWeek(analysis.analysis_date));

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
    switch (riskLevel) {
      case 'high':
        return <AlertCircle size={16} color="#FF4444" strokeWidth={2} />;
      case 'medium':
        return <AlertCircle size={16} color="#FFA500" strokeWidth={2} />;
      case 'low':
        return <AlertCircle size={16} color="#22C55E" strokeWidth={2} />;
      default:
        return null;
    }
  };

  const renderAnalysisCard = (analysis: TradeAnalysis) => (
    <TouchableOpacity 
      key={analysis.id} 
      style={styles.analysisCard}
      onPress={() => router.push(`/analysis/${analysis.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.pairContainer}>
          <Text style={styles.tradingPair}>{analysis.trading_pair}</Text>
          {analysis.risk_level != null && (
            <View style={[styles.riskBadge, { borderColor: getRiskColor(analysis.risk_level) }]}>
              {getRiskIcon(analysis.risk_level)}
              <Text style={[styles.riskText, { color: getRiskColor(analysis.risk_level) }]}>
                {analysis.risk_level.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>${String(analysis.price)}</Text>
        </View>
      </View>

      <Text style={styles.analysisTitle} numberOfLines={2}>
        {analysis.title}
      </Text>

      {analysis.summary != null && (
        <Text style={styles.analysisSummary} numberOfLines={3}>
          {analysis.summary}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Calendar size={14} color="#A0A0A0" strokeWidth={2} />
          <Text style={styles.dateText}>{formatDate(analysis.analysis_date)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => router.push(`/analysis/${analysis.id}`)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Analysis</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Trade Analysis</Text>
        <Text style={styles.pageSubtitle}>
          Daily trading pair analysis with technical and fundamental insights
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : (
          <>
            {/* Today's Analyses */}
            {todayAnalyses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TODAY'S ANALYSIS</Text>
                {todayAnalyses.map(renderAnalysisCard)}
              </View>
            )}

            {/* This Week's Analyses */}
            {thisWeekAnalyses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>THIS WEEK</Text>
                {thisWeekAnalyses.map(renderAnalysisCard)}
              </View>
            )}

            {/* Older Analyses */}
            {olderAnalyses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PREVIOUS ANALYSES</Text>
                {olderAnalyses.map(renderAnalysisCard)}
              </View>
            )}

            {analyses.length === 0 && (
              <View style={styles.emptyContainer}>
                <TrendingUp size={48} color="#3A3A3A" strokeWidth={2} />
                <Text style={styles.emptyText}>No analyses available yet</Text>
                <Text style={styles.emptySubtext}>Check back soon for daily trading insights</Text>
              </View>
            )}
          </>
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
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  pageSubtitle: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pairContainer: {
    flex: 1,
    marginRight: 12,
  },
  tradingPair: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  riskText: {
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 4,
  },
  priceValue: {
    color: Colors.gold,
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
  },
  analysisTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
    lineHeight: 22,
    marginBottom: 12,
  },
  analysisSummary: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    marginLeft: 6,
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
  },
  viewButtonText: {
    color: '#000000',
    fontSize: 13,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
  },
});
