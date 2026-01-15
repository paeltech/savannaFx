import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, Calendar as CalendarIcon, MapPin, Users, Clock, DollarSign } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  category: string;
  type: 'Physical' | 'Virtual' | 'Hybrid';
  price_type: 'Free' | 'Paid';
  price: number;
  location: string | null;
  capacity: number;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  registration_count?: number;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    
    if (showLoading) setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents(false);
    setRefreshing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/events/${eventId}`);
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
          <Text style={styles.headerTitle}>Events</Text>
          <TouchableOpacity style={styles.notificationIcon}>
            <Bell size={20} color={Colors.gold} strokeWidth={2} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarIcon size={48} color={Colors.rainyGrey} />
            <Text style={styles.emptyStateText}>No upcoming events</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => handleEventPress(event.id)}
              >
                {event.cover_image_url ? (
                  <Image
                    source={{ uri: event.cover_image_url }}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.eventImagePlaceholder}>
                    <CalendarIcon size={48} color={Colors.rainyGrey} strokeWidth={2} />
                  </View>
                )}
                <View style={styles.eventBadges}>
                  <View style={[
                    styles.typeBadge,
                    event.type === 'Virtual' && styles.typeBadgeVirtual,
                    event.type === 'Physical' && styles.typeBadgePhysical,
                    event.type === 'Hybrid' && styles.typeBadgeHybrid,
                  ]}>
                    <Text style={styles.typeBadgeText}>{event.type}</Text>
                  </View>
                  <View style={[
                    styles.priceBadge,
                    event.price_type === 'Free' ? styles.priceBadgeFree : styles.priceBadgePaid,
                  ]}>
                    <Text style={styles.priceBadgeText}>{event.price_type}</Text>
                  </View>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventOrganizer}>by {event.organizer}</Text>
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
                  <View style={styles.eventMeta}>
                    <View style={styles.eventMetaRow}>
                      <CalendarIcon size={14} color="#A0A0A0" strokeWidth={1.5} />
                      <Text style={styles.eventMetaText}>{formatDate(event.start_date)}</Text>
                    </View>
                    {event.location != null && (
                      <View style={styles.eventMetaRow}>
                        <MapPin size={14} color="#A0A0A0" strokeWidth={1.5} />
                        <Text style={styles.eventMetaText} numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                    )}
                    <View style={styles.eventMetaRow}>
                      <Users size={14} color="#A0A0A0" strokeWidth={1.5} />
                      <Text style={styles.eventMetaText}>
                        {event.registration_count || 0}/{event.capacity}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
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
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  eventsList: {
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#3A3A3A',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBadges: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  typeBadgeVirtual: {
    backgroundColor: '#3B82F6',
  },
  typeBadgePhysical: {
    backgroundColor: '#10B981',
  },
  typeBadgeHybrid: {
    backgroundColor: '#8B5CF6',
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  priceBadgeFree: {
    backgroundColor: '#22C55E',
  },
  priceBadgePaid: {
    backgroundColor: Colors.gold,
  },
  priceBadgeText: {
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventOrganizer: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventMeta: {
    marginTop: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventMetaText: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginLeft: 8,
    flex: 1,
  },
});
