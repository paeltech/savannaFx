import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, Users, CheckCircle2, Calendar, Video, MessageSquare, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';

interface MentorshipFeature {
  icon: typeof Users;
  title: string;
  description: string;
}

const features: MentorshipFeature[] = [
  {
    icon: Users,
    title: 'Group Sessions',
    description: 'Interactive group mentorship sessions',
  },
  {
    icon: Video,
    title: 'Live Trading',
    description: 'Watch pro traders in action',
  },
  {
    icon: MessageSquare,
    title: 'Community Support',
    description: '24/7 access to trading community',
  },
  {
    icon: TrendingUp,
    title: 'Strategy Breakdown',
    description: 'Detailed analysis of winning strategies',
  },
  {
    icon: Calendar,
    title: 'Weekly Webinars',
    description: 'Regular educational webinars',
  },
  {
    icon: CheckCircle2,
    title: 'Progress Tracking',
    description: 'Monitor your trading journey',
  },
];

const benefits = [
  'Access to experienced trading mentors',
  'Personalized feedback on your trades',
  'Exclusive market insights and analysis',
  'Community of like-minded traders',
  'Ongoing support and accountability',
  'Real-time trade alerts and signals',
];

export default function MentorshipScreen() {
  const handleJoin = () => {
    alert('Redirecting to mentorship registration...');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mentorship</Text>
          <TouchableOpacity style={styles.notificationIcon}>
            <Bell size={20} color={Colors.gold} strokeWidth={2} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Users size={32} color={Colors.gold} strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>Join Our Mentorship Program</Text>
          <Text style={styles.heroDescription}>
            Accelerate your trading journey with guidance from experienced professionals
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
                    <Icon size={24} color={Colors.gold} strokeWidth={2} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Program Benefits</Text>
          <View style={styles.benefitsCard}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <CheckCircle2 size={18} color={Colors.gold} strokeWidth={2.5} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to Level Up?</Text>
          <Text style={styles.ctaDescription}>
            Join hundreds of traders who have transformed their trading with our mentorship program
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleJoin}>
            <Users size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.ctaButtonText}>Join Mentorship Program</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>Limited spots available</Text>
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
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  heroCard: {
    backgroundColor: Colors.gold,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000000',
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
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    lineHeight: 18,
  },
  benefitsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    color: '#D0D0D0',
    marginLeft: 12,
  },
  ctaCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  ctaNote: {
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    color: Colors.gold,
    marginTop: 12,
    textAlign: 'center',
  },
});
