import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Lightbulb, Quote, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { pickDailyTip, type TradingTipRow } from '../../shared/utils/trading-tips';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

type FilterKind = 'all' | 'tip' | 'quote';

export default function TipsScreen() {
  const [tips, setTips] = useState<TradingTipRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKind>('all');
  const { unreadCount } = useUnreadNotificationsCount();

  const fetchTips = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    const { data, error } = await supabase
      .from('trading_tips')
      .select('id, title, body, content_kind, sort_order, active')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (!error && data) {
      setTips(data as TradingTipRow[]);
    }
    if (!isRefresh) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTips(false);
  }, [fetchTips]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTips(true);
    setRefreshing(false);
  };

  const dailyPick = useMemo(() => pickDailyTip(tips, new Date()), [tips]);

  const filtered = useMemo(() => {
    if (filter === 'all') return tips;
    return tips.filter((t) => t.content_kind === filter);
  }, [tips, filter]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tips & Quotes</Text>
        <TouchableOpacity style={styles.bellWrap} onPress={() => router.push('/notifications')}>
          <Bell size={22} color={Colors.gold} strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : (
          <>
            {dailyPick && (
              <View style={styles.hero}>
                <View style={styles.heroBadgeRow}>
                  <Lightbulb size={18} color={Colors.gold} strokeWidth={2} />
                  <Text style={styles.heroBadge}>Tip of the day</Text>
                </View>
                <Text style={styles.heroTitle}>{dailyPick.title}</Text>
                <Text style={styles.heroBody}>{dailyPick.body}</Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>Browse</Text>
            <View style={styles.chips}>
              {(['all', 'tip', 'quote'] as const).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.chip, filter === k && styles.chipActive]}
                  onPress={() => setFilter(k)}
                >
                  <Text style={[styles.chipText, filter === k && styles.chipTextActive]}>
                    {k === 'all' ? 'All' : k === 'tip' ? 'Tips' : 'Quotes'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filtered.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  {item.content_kind === 'quote' ? (
                    <Quote size={18} color={Colors.gold} strokeWidth={2} />
                  ) : (
                    <Lightbulb size={18} color={Colors.gold} strokeWidth={2} />
                  )}
                  <Text style={styles.cardKind}>{item.content_kind === 'quote' ? 'Quote' : 'Tip'}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: { padding: 8 },
  headerTitle: {
    color: Colors.foreground,
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
  },
  bellWrap: { width: 44, alignItems: 'flex-end', padding: 8 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#C45C26',
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontFamily: 'Axiforma-Bold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: { paddingVertical: 48, alignItems: 'center' },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  heroBadge: {
    color: Colors.gold,
    fontFamily: 'Axiforma-SemiBold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: Colors.foreground,
    fontFamily: 'Axiforma-Bold',
    fontSize: 20,
    marginBottom: 10,
  },
  heroBody: {
    color: Colors.rainyGrey,
    fontFamily: 'Axiforma-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    color: Colors.foreground,
    fontFamily: 'Axiforma-Bold',
    fontSize: 16,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: { backgroundColor: '#2A2418', borderColor: Colors.gold },
  chipText: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Medium', fontSize: 13 },
  chipTextActive: { color: Colors.gold },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardKind: {
    color: Colors.steelWool,
    fontFamily: 'Axiforma-Medium',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  cardTitle: {
    color: Colors.foreground,
    fontFamily: 'Axiforma-SemiBold',
    fontSize: 16,
    marginBottom: 6,
  },
  cardBody: {
    color: Colors.rainyGrey,
    fontFamily: 'Axiforma-Regular',
    fontSize: 14,
    lineHeight: 21,
  },
});
