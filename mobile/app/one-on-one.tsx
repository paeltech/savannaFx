import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { 
  ChevronLeft, 
  Bell, 
  UserRound, 
  Target, 
  Wrench, 
  BarChart3, 
  Brain,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

interface Feature {
  icon: typeof UserRound;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Target,
    title: 'Personalized Goals',
    description: 'Set and achieve your trading objectives',
  },
  {
    icon: Wrench,
    title: 'Custom Strategy',
    description: 'Tailored to your risk profile',
  },
  {
    icon: BarChart3,
    title: 'Performance Review',
    description: 'Regular analysis of your progress',
  },
  {
    icon: Brain,
    title: 'Mindset Coaching',
    description: 'Master trading psychology',
  },
  {
    icon: ClipboardList,
    title: 'Trade Journal Review',
    description: 'Learn from every trade',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Management',
    description: 'Protect your capital effectively',
  },
];

const packages = [
  {
    name: 'Starter',
    price: 299,
    sessions: 4,
    duration: '1 month',
    features: [
      '4 one-hour sessions',
      'Strategy development',
      'Basic trade review',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: 799,
    sessions: 12,
    duration: '3 months',
    features: [
      '12 one-hour sessions',
      'Advanced strategy development',
      'Comprehensive trade review',
      'Priority support',
      'Custom trading plan',
      'Weekly check-ins',
    ],
    popular: true,
  },
  {
    name: 'Elite',
    price: 1499,
    sessions: 24,
    duration: '6 months',
    features: [
      '24 one-hour sessions',
      'Full strategy optimization',
      'Daily trade review',
      '24/7 priority support',
      'Custom indicators & tools',
      'Bi-weekly check-ins',
      'Lifetime access to materials',
    ],
  },
];

export default function OneOnOneScreen() {
  const { unreadCount } = useUnreadNotificationsCount();
  
  const handleBooking = (packageName: string) => {
    alert(`Booking ${packageName} package...`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>One-on-One</Text>
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

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <UserRound size={32} color={'#000000'} strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>Personal Trading Coaching</Text>
          <Text style={styles.heroDescription}>
            Get personalized guidance from experienced traders to accelerate your growth
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Icon size={22} color={Colors.gold} strokeWidth={2} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Packages Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Package</Text>
          {packages.map((pkg, index) => (
            <View 
              key={index} 
              style={[
                styles.packageCard,
                pkg.popular && styles.packageCardPopular,
              ]}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              <Text style={styles.packageName}>{pkg.name}</Text>
              <View style={styles.packagePriceRow}>
                <Text style={styles.packagePrice}>${pkg.price}</Text>
                <Text style={styles.packageDuration}>/ {pkg.duration}</Text>
              </View>
              <Text style={styles.packageSessions}>{pkg.sessions} sessions</Text>
              <View style={styles.packageDivider} />
              {pkg.features.map((feature, idx) => (
                <View key={idx} style={styles.packageFeatureRow}>
                  <CheckCircle2 size={16} color={Colors.gold} strokeWidth={2.5} />
                  <Text style={styles.packageFeatureText}>{feature}</Text>
                </View>
              ))}
              <TouchableOpacity 
                style={[
                  styles.bookButton,
                  pkg.popular && styles.bookButtonPopular,
                ]}
                onPress={() => handleBooking(pkg.name)}
              >
                <Text style={styles.bookButtonText}>Book {pkg.name}</Text>
              </TouchableOpacity>
            </View>
          ))}
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
  heroCard: {
    backgroundColor: '#EBEBEB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 16,
  },
  packageCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  packageCardPopular: {
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontFamily: 'Axiforma-Bold',
    color: '#000000',
  },
  packageName: {
    fontSize: 22,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 32,
    fontFamily: 'Axiforma-Bold',
    color: Colors.gold,
  },
  packageDuration: {
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginLeft: 4,
  },
  packageSessions: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    marginBottom: 16,
  },
  packageDivider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 16,
  },
  packageFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageFeatureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    marginLeft: 12,
  },
  bookButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonPopular: {
    backgroundColor: Colors.gold,
  },
  bookButtonText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
});
