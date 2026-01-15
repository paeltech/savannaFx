import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { 
  User, 
  Bell, 
  TrendingUp, 
  BarChart3, 
  GraduationCap, 
  Users, 
  UserRound,
  Calendar as CalendarIcon,
  Calculator,
  TrendingDown,
  FolderOpen
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Signal } from '../../shared/types/signal';

export default function HomeScreen() {
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchLatestSignal();

    // Subscribe to real-time updates for signals
    const channel = supabase
      .channel('signals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals'
        },
        (payload) => {
          console.log('Signal update received:', payload);
          // Refetch the latest signal when any change occurs
          fetchLatestSignal();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/auth/login');
    }
  };

  const fetchLatestSignal = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching signal:', error);
        return;
      }

      setLatestSignal(data);
    } catch (error) {
      console.error('Error fetching signal:', error);
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLatestSignal(true);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileIcon}>
              <User size={24} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>Paul</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.notificationIcon}>
              <Bell size={20} color={Colors.gold} strokeWidth={2} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trading Signal Card */}
        {isLoading ? (
          <View style={styles.signalCard}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : latestSignal ? (
          <View style={styles.signalCard}>
            <View style={styles.signalHeader}>
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <Text style={styles.signalPair}>{latestSignal.trading_pair}</Text>
                 {latestSignal.entry_price != null && (
                   <Text style={{ 
                     marginLeft: 8,
                     color: '#A0A0A0',
                     fontSize: 14,
                     fontFamily: 'Axiforma-Regular'
                   }}>
                     Entry: {String(latestSignal.entry_price)}
                   </Text>
                 )}
               </View>
              <TouchableOpacity style={[
                styles.sellButton,
                latestSignal.signal_type === 'buy' && styles.buyButton
              ]}>
                <Text style={styles.sellButtonText}>
                  {latestSignal.signal_type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.signalInfo}>
              <View style={styles.signalInfoItem}>
                <Text style={styles.signalInfoLabel}>SL:</Text>
                <Text style={styles.signalInfoValue}>{String(latestSignal.stop_loss)}</Text>
              </View>
              {latestSignal.take_profit_1 != null && (
                <View style={styles.signalInfoItem}>
                  <Text style={styles.signalInfoLabel}>TP1:</Text>
                  <Text style={styles.signalInfoValue}>{String(latestSignal.take_profit_1)}</Text>
                </View>
              )}
              {latestSignal.take_profit_2 != null && (
                <View style={styles.signalInfoItem}>
                  <Text style={styles.signalInfoLabel}>TP2:</Text>
                  <Text style={styles.signalInfoValue}>{String(latestSignal.take_profit_2)}</Text>
                </View>
              )}
            </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
               <Text style={styles.signalTimestamp}>
                 {new Date(latestSignal.created_at).toLocaleString('en-US', {
                   month: 'short',
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit',
                   hour12: false,
                 }).replace(',', '').replace(/(\d{2}):(\d{2})/, (_, h, m) => `${h}${m}hrs`)}
               </Text>
               {latestSignal.confidence_level && (
                 <View style={{ 
                   backgroundColor: '#222A2A', 
                   borderRadius: 8, 
                   paddingVertical: 4, 
                   paddingHorizontal: 10,
                   marginLeft: 8
                 }}>
                   <Text style={{ 
                     color: '#9d9d9d', 
                     fontFamily: 'Axiforma-Bold', 
                     fontSize: 12, 
                     letterSpacing: 0.5
                   }}>
                     Confidence: {latestSignal.confidence_level.toUpperCase()}
                   </Text>
                 </View>
               )}
             </View>
          </View>
        ) : (
          <View style={styles.signalCard}>
            <Text style={styles.noSignalText}>No active signals at the moment</Text>
          </View>
        )}

        {/* Trade with Savanna Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trade with Savanna</Text>
          <Text style={styles.sectionSubtitle}>PIPS HUNTING</Text>
          <View style={styles.cardRow}>
            <TouchableOpacity 
              style={[styles.featureCard, { marginRight: 6 }]}
              onPress={() => router.push('/signals')}
            >
              <View style={styles.featureIcon}>
                <TrendingUp size={16} color={Colors.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureTitle}>Signals</Text>
              <Text style={styles.featureDescription}>Premium trade signals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.featureCard, { marginLeft: 6 }]}
              onPress={() => router.push('/analysis')}
            >
              <View style={styles.featureIcon}>
                <BarChart3 size={16} color={Colors.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureTitle}>Analysis</Text>
              <Text style={styles.featureDescription}>Daily trade pair analysis</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Learn the Craft Section */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>LEARN THE CRAFT</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.learnIcon} onPress={() => router.push('/academy')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <GraduationCap size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>Academy</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.learnIcon, { marginLeft: 8 }]} onPress={() => router.push('/mentorship')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <Users size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>Mentorship</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.learnIcon, { marginLeft: 8 }]} onPress={() => router.push('/events')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <CalendarIcon size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>Events</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.learnIcon, { marginLeft: 8 }]} onPress={() => router.push('/one-on-one')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <UserRound size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>1 on 1</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tools of the game Section */}
        <View style={styles.toolsSection}>
          <Text style={styles.toolsTitle}>Tools of the game</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.toolIcon} onPress={() => router.push('/calculator')}>
              <View style={styles.toolIconCircle}>
                <Calculator size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Calculator</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolIcon, { marginLeft: 8 }]} onPress={() => router.push('/calendar')}>
              <View style={styles.toolIconCircle}>
                <CalendarIcon size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolIcon, { marginLeft: 8 }]} onPress={() => router.push('/sentiment')}>
              <View style={styles.toolIconCircle}>
                <TrendingDown size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Sentiment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolIcon, { marginLeft: 8 }]} onPress={() => router.push('/help')}>
              <View style={styles.toolIconCircle}>
                <FolderOpen size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  welcomeText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
  },
  userName: {
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
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  signalCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 48,
    marginTop: 24,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  signalPair: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  sellButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  buyButton: {
    backgroundColor: '#22C55E',
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 1,
  },
  noSignalText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  signalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingRight: 8,
  },
  signalInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  signalInfoLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    marginRight: 2,
  },
  signalInfoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
  },
  signalTimestamp: {
    color: '#9A9A9A',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    marginTop: 0,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 4,
  },
  cardRow: {
    flexDirection: 'row',
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#A0A0A0',
    fontSize: 10,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    lineHeight: 15,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 0,
  },
  learnIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  learnIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnIconLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    textAlign: 'center',
  },
  toolsSection: {
    backgroundColor: '#EBEBEB',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
  },
  toolsTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  toolIcon: {
    alignItems: 'center',
    flex: 1,
  },
  toolIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A2A',
    borderWidth: 0,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolIconLabel: {
    color: '#1A1A1A',
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    textAlign: 'center',
  },
});
