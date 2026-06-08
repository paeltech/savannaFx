import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../shared/constants/colors';
import {
  ChevronLeft,
  Bell,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  Tag,
  Building2,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUnreadNotificationsCount } from '../../hooks/use-unread-notifications';

interface EventDetail {
  id: string;
  title: string;
  organizer: string;
  description: string;
  category: string;
  type: 'Physical' | 'Virtual' | 'Hybrid';
  location: string | null;
  capacity: number;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  registration_start_date: string | null;
  registration_end_date: string | null;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { unreadCount } = useUnreadNotificationsCount();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regCount, setRegCount] = useState<number | null>(null);
  const [userRegistration, setUserRegistration] = useState<{ registration_status: string } | null>(null);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const fetchEventData = useCallback(async () => {
    if (!id) return;

    const { data: { session } } = await supabase.auth.getSession();
    setSessionUserId(session?.user?.id ?? null);

    const { data: evt, error } = await supabase
      .from('events')
      .select(
        [
          'id',
          'title',
          'organizer',
          'description',
          'category',
          'type',
          'location',
          'capacity',
          'cover_image_url',
          'start_date',
          'end_date',
          'status',
          'registration_start_date',
          'registration_end_date',
        ].join(', ')
      )
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !evt) {
      setEvent(null);
      setRegCount(null);
      setUserRegistration(null);
      return;
    }

    setEvent(evt as unknown as EventDetail);

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_event_registration_count', {
      event_uuid: id,
    });
    if (!rpcError && typeof rpcData === 'number') {
      setRegCount(rpcData);
    } else {
      setRegCount(null);
    }

    if (session?.user?.id) {
      const { data: reg } = await supabase
        .from('event_registrations')
        .select('registration_status')
        .eq('event_id', id)
        .eq('user_id', session.user.id)
        .maybeSingle();
      setUserRegistration(reg ?? null);
    } else {
      setUserRegistration(null);
    }
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await fetchEventData();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [fetchEventData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEventData();
    setRefreshing(false);
  };

  const formatDateMedium = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTimeCompact = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const openMaps = (address: string) => {
    const q = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const registrationWindowClosed = (): boolean => {
    if (!event) return false;
    const now = Date.now();
    if (event.registration_start_date) {
      const start = new Date(event.registration_start_date).getTime();
      if (now < start) return true;
    }
    if (event.registration_end_date) {
      const end = new Date(event.registration_end_date).getTime();
      if (now > end) return true;
    }
    return false;
  };

  const isFull = (): boolean => {
    if (regCount == null || event == null) return false;
    return regCount >= event.capacity;
  };

  const activeRegistration = userRegistration
    && ['pending', 'confirmed'].includes(userRegistration.registration_status);

  const handleRegister = async () => {
    if (!event || !id) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please log in to register for this event.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (registrationWindowClosed()) {
      Alert.alert('Registration unavailable', 'Registration for this event is not open right now.');
      return;
    }

    if (isFull()) {
      Alert.alert('Event full', 'This event has reached its capacity.');
      return;
    }

    if (activeRegistration) {
      return;
    }

    setSubmittingReg(true);
    try {
      const { error } = await supabase.from('event_registrations').insert({
        event_id: id,
        user_id: session.user.id,
        registration_status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already registered', 'You are already signed up for this event.');
          await fetchEventData();
        } else {
          console.error('Registration error:', error);
          Alert.alert('Could not register', error.message ?? 'Please try again later.');
        }
      } else {
        Alert.alert('You\'re registered', 'See you there. Check your notifications for reminders.');
        await fetchEventData();
      }
    } finally {
      setSubmittingReg(false);
    }
  };

  const getTypeBadgeStyle = (type: EventDetail['type']) => {
    switch (type) {
      case 'Virtual':
        return styles.typeBadgeVirtual;
      case 'Physical':
        return styles.typeBadgePhysical;
      case 'Hybrid':
        return styles.typeBadgeHybrid;
      default:
        return styles.typeBadgePhysical;
    }
  };

  if (loading || !id) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.notFoundText}>This event is not available.</Text>
          <TouchableOpacity style={styles.primaryButtonGold} onPress={() => router.back()}>
            <Text style={styles.primaryButtonGoldText}>Back to events</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const showLocation = Boolean(event.location) && event.type !== 'Virtual';
  const showVirtualNotice = event.type === 'Virtual' || event.type === 'Hybrid';

  let ctaLabel = 'Reserve your spot';
  let ctaDisabled = submittingReg || registrationWindowClosed() || isFull();
  if (activeRegistration) {
    ctaLabel = 'You\'re registered';
    ctaDisabled = true;
  } else if (isFull()) {
    ctaLabel = 'Event full';
  } else if (registrationWindowClosed()) {
    ctaLabel = 'Registration closed';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />
        }
      >
        <View style={styles.heroWrap}>
          {event.cover_image_url ? (
            <Image source={{ uri: event.cover_image_url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <CalendarIcon size={56} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
          )}
          <View style={[styles.typeBadgeHero, getTypeBadgeStyle(event.type)]}>
            <Text style={styles.typeBadgeHeroText}>{event.type}</Text>
          </View>
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.organizer}>by {event.organizer}</Text>

        <View style={styles.chipRow}>
          <View style={styles.categoryChip}>
            <Tag size={14} color={Colors.gold} strokeWidth={2} />
            <Text style={styles.categoryChipText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>About this event</Text>
          <Text style={styles.bodyText}>{event.description}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <CalendarIcon size={20} color={Colors.gold} strokeWidth={2} />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>When</Text>
              <Text style={styles.infoValue}>{formatDateMedium(event.start_date)}</Text>
              {event.end_date != null && event.end_date !== event.start_date && (
                <Text style={styles.infoSub}>Ends {formatDateTimeCompact(event.end_date)}</Text>
              )}
            </View>
          </View>

          {showLocation && (
            <TouchableOpacity
              style={[styles.infoRow, styles.mapsRow]}
              onPress={() => event.location != null && openMaps(event.location)}
              activeOpacity={0.75}
            >
              <MapPin size={20} color={Colors.gold} strokeWidth={2} />
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{event.location ?? ''}</Text>
                <Text style={styles.mapsHint}>Tap to open in Maps</Text>
              </View>
            </TouchableOpacity>
          )}

          {showVirtualNotice && (
            <View style={styles.infoRow}>
              <Building2 size={20} color={Colors.gold} strokeWidth={2} />
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>Format</Text>
                <Text style={styles.infoValue}>
                  {event.type === 'Hybrid'
                    ? 'Hybrid — venue or online participation as announced'
                    : 'Online — link and details shared with registered attendees'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Users size={20} color={Colors.gold} strokeWidth={2} />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Attendance</Text>
              <Text style={styles.infoValue}>
                {regCount != null
                  ? `${regCount} / ${event.capacity} registered`
                  : `Up to ${event.capacity} spots`}
              </Text>
              {registrationWindowClosed() && (
                <Text style={styles.infoSub}>Registration dates apply — check with organizer if unsure.</Text>
              )}
            </View>
          </View>

          {(event.registration_start_date != null || event.registration_end_date != null) && (
            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <Clock size={20} color={Colors.gold} strokeWidth={2} />
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>Registration window</Text>
                <Text style={styles.infoValue}>
                  {event.registration_start_date
                    ? formatDateTimeCompact(event.registration_start_date)
                    : 'Open'}{' '}
                  —{' '}
                  {event.registration_end_date
                    ? formatDateTimeCompact(event.registration_end_date)
                    : 'Until event'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Organizer</Text>
          <Text style={styles.bodyText}>{event.organizer}</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/help')}>
            <Text style={styles.outlineBtnText}>Contact via Help</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={[styles.ctaFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            ctaDisabled && styles.primaryButtonDisabled,
            activeRegistration && styles.primaryButtonSuccess,
          ]}
          disabled={ctaDisabled || submittingReg}
          onPress={handleRegister}
        >
          {submittingReg ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text
              style={[
                styles.primaryButtonText,
                activeRegistration && styles.primaryButtonTextOnSuccess,
              ]}
            >
              {ctaLabel}
            </Text>
          )}
        </TouchableOpacity>
        {!sessionUserId && (
          <Text style={styles.ctaFootnote}>Log in to reserve your spot for this event.</Text>
        )}
      </View>
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
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroWrap: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 200,
    backgroundColor: '#3A3A3A',
  },
  heroPlaceholder: {
    aspectRatio: 16 / 9,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
  },
  typeBadgeHero: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeHeroText: {
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  typeBadgeVirtual: { backgroundColor: '#3B82F6' },
  typeBadgePhysical: { backgroundColor: '#10B981' },
  typeBadgeHybrid: { backgroundColor: '#8B5CF6' },
  title: {
    fontSize: 26,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 32,
  },
  organizer: {
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: 'Axiforma-SemiBold',
    color: Colors.gold,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    color: Colors.gold,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
  },
  mapsRow: {
    opacity: 1,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    color: '#707070',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  infoSub: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginTop: 4,
  },
  mapsHint: {
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    color: Colors.gold,
    marginTop: 6,
  },
  outlineBtn: {
    marginTop: 14,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    fontFamily: 'Axiforma-Bold',
    color: Colors.gold,
  },
  ctaFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#0A0A0AEE',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonGold: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  primaryButtonGoldText: {
    fontSize: 15,
    fontFamily: 'Axiforma-Bold',
    color: '#000000',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonSuccess: {
    backgroundColor: '#14532d',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: 'Axiforma-Bold',
    color: '#000000',
  },
  primaryButtonTextOnSuccess: {
    color: '#FFFFFF',
  },
  ctaFootnote: {
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
});
