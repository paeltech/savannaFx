import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, Calendar as CalendarIcon, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

export default function CalendarScreen() {
  const [showWebView, setShowWebView] = React.useState(true);
  const { unreadCount } = useUnreadNotificationsCount();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Economic Calendar</Text>
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
          <CalendarIcon size={20} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.infoBannerText}>
            Stay updated with upcoming economic events that impact the markets
          </Text>
        </View>

        {/* WebView for Forex Factory Calendar */}
        {showWebView ? (
          <View style={styles.webViewContainer}>
            <WebView
              source={{ uri: 'https://www.forexfactory.com/calendar' }}
              style={styles.webView}
              onError={() => setShowWebView(false)}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        ) : (
          <ScrollView style={styles.fallbackContainer}>
            <View style={styles.fallbackCard}>
              <ExternalLink size={48} color={Colors.rainyGrey} />
              <Text style={styles.fallbackTitle}>Economic Calendar</Text>
              <Text style={styles.fallbackDescription}>
                Unable to load the calendar widget. Please visit Forex Factory directly for live economic calendar updates.
              </Text>
              <TouchableOpacity 
                style={styles.fallbackButton}
                onPress={() => {
                  // In a real app, use Linking.openURL
                  alert('Opening Forex Factory...');
                }}
              >
                <ExternalLink size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.fallbackButtonText}>Visit Forex Factory</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Guide */}
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>How to Use the Calendar</Text>
              <View style={styles.guideItem}>
                <View style={styles.guideBullet} />
                <Text style={styles.guideText}>
                  <Text style={styles.guideBold}>Red</Text> events have high market impact
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={styles.guideBullet} />
                <Text style={styles.guideText}>
                  <Text style={styles.guideBold}>Orange</Text> events have medium impact
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={styles.guideBullet} />
                <Text style={styles.guideText}>
                  <Text style={styles.guideBold}>Yellow</Text> events have low impact
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={styles.guideBullet} />
                <Text style={styles.guideText}>
                  Avoid trading 15-30 minutes before and after high-impact events
                </Text>
              </View>
            </View>
          </ScrollView>
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
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    marginLeft: 12,
  },
  webViewContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    padding: 16,
  },
  fallbackCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 22,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackDescription: {
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fallbackButtonText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  guideCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
  },
  guideTitle: {
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  guideBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
    marginTop: 7,
    marginRight: 12,
  },
  guideText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    lineHeight: 20,
  },
  guideBold: {
    fontFamily: 'Axiforma-Bold',
    color: Colors.gold,
  },
});
