import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

type SentimentType = 'bullish' | 'bearish' | 'neutral';
type CurrencyPair = 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'AUD/USD' | 'USD/CAD' | 'EUR/GBP' | 'XAU/USD';

interface PairStats {
  pair: CurrencyPair;
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  userVote: SentimentType | null;
}

const CURRENCY_PAIRS: CurrencyPair[] = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
  'EUR/GBP',
  'XAU/USD',
];

export default function SentimentScreen() {
  const [pairStats, setPairStats] = useState<PairStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { unreadCount } = useUnreadNotificationsCount();

  useEffect(() => {
    fetchUserAndSentiment();
  }, []);

  const fetchUserAndSentiment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/auth/login');
      return;
    }
    setUserId(session.user.id);
    await fetchSentimentData(session.user.id);
  };

  const fetchSentimentData = async (currentUserId: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);

    const { data: votes, error } = await supabase
      .from('sentiment_votes')
      .select('*');

    if (error) {
      console.error('Error fetching sentiment data:', error);
      setPairStats([]);
    } else {
      const stats: PairStats[] = CURRENCY_PAIRS.map((pair) => {
        const pairVotes = votes?.filter((v) => v.currency_pair === pair) || [];
        const bullishCount = pairVotes.filter((v) => v.sentiment === 'bullish').length;
        const bearishCount = pairVotes.filter((v) => v.sentiment === 'bearish').length;
        const neutralCount = pairVotes.filter((v) => v.sentiment === 'neutral').length;
        const total = bullishCount + bearishCount + neutralCount;

        const userVoteData = pairVotes.find((v) => v.user_id === currentUserId)?.sentiment || null;

        return {
          pair,
          bullish: bullishCount,
          bearish: bearishCount,
          neutral: neutralCount,
          total,
          userVote: userVoteData,
        };
      });

      setPairStats(stats);
    }

    if (showLoading) setIsLoading(false);
  };

  const onRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await fetchSentimentData(userId, false);
    setRefreshing(false);
  };

  const handleVote = async (pair: CurrencyPair, sentiment: SentimentType) => {
    if (!userId) return;

    // Check if user already voted for this pair
    const { data: existingVote } = await supabase
      .from('sentiment_votes')
      .select('*')
      .eq('user_id', userId)
      .eq('currency_pair', pair)
      .single();

    if (existingVote) {
      // Update existing vote
      const { error } = await supabase
        .from('sentiment_votes')
        .update({ sentiment })
        .eq('id', existingVote.id);

      if (error) {
        console.error('Error updating vote:', error);
        alert('Failed to update vote');
      } else {
        alert('Vote updated!');
        await fetchSentimentData(userId, false);
      }
    } else {
      // Insert new vote
      const { error } = await supabase
        .from('sentiment_votes')
        .insert({
          user_id: userId,
          currency_pair: pair,
          sentiment,
        });

      if (error) {
        console.error('Error submitting vote:', error);
        alert('Failed to submit vote');
      } else {
        alert('Vote submitted!');
        await fetchSentimentData(userId, false);
      }
    }
  };

  const getPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sentiment</Text>
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

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Vote on market sentiment and see what the community thinks
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : (
          <View style={styles.pairsList}>
            {pairStats.map((stat) => (
              <View key={stat.pair} style={styles.pairCard}>
                <View style={styles.pairHeader}>
                  <Text style={styles.pairName}>{stat.pair}</Text>
                  <Text style={styles.pairVotes}>{stat.total} votes</Text>
                </View>

                {/* Vote Bars */}
                <View style={styles.voteBarContainer}>
                  <View style={styles.voteBarRow}>
                    <View style={[styles.voteBar, { width: `${getPercentage(stat.bullish, stat.total)}%`, backgroundColor: '#22C55E' }]} />
                  </View>
                  <View style={styles.voteBarRow}>
                    <View style={[styles.voteBar, { width: `${getPercentage(stat.bearish, stat.total)}%`, backgroundColor: '#FF4444' }]} />
                  </View>
                  <View style={styles.voteBarRow}>
                    <View style={[styles.voteBar, { width: `${getPercentage(stat.neutral, stat.total)}%`, backgroundColor: '#9A9A9A' }]} />
                  </View>
                </View>

                {/* Vote Stats */}
                <View style={styles.voteStats}>
                  <View style={styles.voteStat}>
                    <Text style={styles.voteStatLabel}>Bullish</Text>
                    <Text style={styles.voteStatValue}>{getPercentage(stat.bullish, stat.total)}%</Text>
                  </View>
                  <View style={styles.voteStat}>
                    <Text style={styles.voteStatLabel}>Bearish</Text>
                    <Text style={styles.voteStatValue}>{getPercentage(stat.bearish, stat.total)}%</Text>
                  </View>
                  <View style={styles.voteStat}>
                    <Text style={styles.voteStatLabel}>Neutral</Text>
                    <Text style={styles.voteStatValue}>{getPercentage(stat.neutral, stat.total)}%</Text>
                  </View>
                </View>

                {/* Vote Buttons */}
                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteButtonBullish,
                      stat.userVote === 'bullish' && styles.voteButtonActive,
                    ]}
                    onPress={() => handleVote(stat.pair, 'bullish')}
                  >
                    <TrendingUp size={18} color={stat.userVote === 'bullish' ? '#FFFFFF' : '#22C55E'} strokeWidth={2.5} />
                    <Text style={[styles.voteButtonText, stat.userVote === 'bullish' && styles.voteButtonTextActive]}>
                      Bullish
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteButtonBearish,
                      stat.userVote === 'bearish' && styles.voteButtonActive,
                    ]}
                    onPress={() => handleVote(stat.pair, 'bearish')}
                  >
                    <TrendingDown size={18} color={stat.userVote === 'bearish' ? '#FFFFFF' : '#FF4444'} strokeWidth={2.5} />
                    <Text style={[styles.voteButtonText, stat.userVote === 'bearish' && styles.voteButtonTextActive]}>
                      Bearish
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteButtonNeutral,
                      stat.userVote === 'neutral' && styles.voteButtonActive,
                    ]}
                    onPress={() => handleVote(stat.pair, 'neutral')}
                  >
                    <Minus size={18} color={stat.userVote === 'neutral' ? '#FFFFFF' : '#9A9A9A'} strokeWidth={2.5} />
                    <Text style={[styles.voteButtonText, stat.userVote === 'neutral' && styles.voteButtonTextActive]}>
                      Neutral
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  infoBanner: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  infoBannerText: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  pairsList: {
    marginTop: 8,
  },
  pairCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  pairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pairName: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
  pairVotes: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
  },
  voteBarContainer: {
    marginBottom: 16,
  },
  voteBarRow: {
    height: 8,
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  voteBar: {
    height: '100%',
    borderRadius: 4,
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  voteStat: {
    alignItems: 'center',
  },
  voteStatLabel: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginBottom: 4,
  },
  voteStatValue: {
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
  voteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  voteButtonBullish: {
    borderColor: '#22C55E',
    backgroundColor: 'transparent',
  },
  voteButtonBearish: {
    borderColor: '#FF4444',
    backgroundColor: 'transparent',
  },
  voteButtonNeutral: {
    borderColor: '#9A9A9A',
    backgroundColor: 'transparent',
  },
  voteButtonActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  voteButtonText: {
    fontSize: 13,
    fontFamily: 'Axiforma-Bold',
    color: '#D0D0D0',
    marginLeft: 6,
  },
  voteButtonTextActive: {
    color: '#FFFFFF',
  },
});
