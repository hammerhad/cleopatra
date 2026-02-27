import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';

const { height: H } = Dimensions.get('window');

const FEATURES = [
  { emoji: '🌙', label: 'Moon Cycle Tracking', desc: 'Phase-aware planning & insights' },
  { emoji: '𓂀', label: 'Ask Cleopatra AI', desc: 'Unlimited AI journal wisdom' },
  { emoji: '👑', label: 'Royal Court', desc: 'Accountability circles & challenges' },
  { emoji: '📊', label: 'Advanced Analytics', desc: 'Deep patterns & habit scores' },
  { emoji: '⚔️', label: 'Unlimited Habits', desc: 'Build your full empire' },
  { emoji: '🔮', label: 'Workout Templates', desc: 'Phase-aligned training plans' },
  { emoji: '🔒', label: 'Privacy Mode', desc: 'Discreet lock for sensitive data' },
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$9.99',
    period: '/month',
    savings: null,
    badge: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$59.99',
    period: '/year',
    savings: 'Save 50%',
    badge: '👑 BEST VALUE',
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    // In production: integrate RevenueCat or Stripe here
    // For now, simulate
    setTimeout(() => {
      setLoading(false);
      router.back();
    }, 1500);
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.OBSIDIAN, '#100C06', Colors.ONYX]}
        style={StyleSheet.absoluteFill}
      />

      {/* Gold shimmer at top */}
      <LinearGradient
        colors={['rgba(201,168,76,0.15)', 'transparent']}
        style={styles.topShimmer}
      />

      {/* Close */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
          <Text style={styles.heroAnkh}>𓋹</Text>
          <Text style={styles.heroTitle}>Unlock Your Full{'\n'}Kingdom</Text>
          <Text style={styles.heroSub}>
            Join thousands of queens who reign with discipline, wisdom, and grace.
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.label}
              entering={FadeInDown.delay(200 + i * 60).duration(400)}
              style={styles.featureRow}
            >
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Text style={styles.featureCheck}>✓</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <GoldenDivider style={{ marginVertical: 20 }} />

        {/* Plan selection */}
        <Text style={styles.planTitle}>Choose Your Reign</Text>
        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
              activeOpacity={0.85}
            >
              {plan.badge && (
                <LinearGradient
                  colors={[Colors.GOLD_DEEP, Colors.GOLD]}
                  style={styles.planBadge}
                >
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </LinearGradient>
              )}
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={[styles.planPrice, selectedPlan === plan.id && styles.planPriceActive]}>
                {plan.price}
              </Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
              <View style={[
                styles.planRadio,
                selectedPlan === plan.id && styles.planRadioActive,
              ]}>
                {selectedPlan === plan.id && <View style={styles.planRadioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <GoldButton
            label={`START MY REIGN — ${PLANS.find((p) => p.id === selectedPlan)?.price}`}
            onPress={handleSubscribe}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 16 }}
          />
          <Text style={styles.trialText}>
            7-day free trial · Cancel anytime · Billed via App Store
          </Text>

          <GoldenDivider style={{ marginTop: 20 }} />

          <Text style={styles.testimonial}>
            "Cleopatra Premium changed how I structure my days. The cycle insights alone
            are worth every penny."
          </Text>
          <Text style={styles.testimonialAuthor}>— Alexandra M., Pharaoh rank</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: 14,
    color: Colors.DUST,
  },
  scroll: { paddingHorizontal: 24, gap: 16 },
  hero: { alignItems: 'center', gap: 10 },
  heroAnkh: {
    fontSize: 56,
    color: Colors.GOLD,
    textShadowColor: Colors.GOLD,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  heroTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 34,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    textAlign: 'center',
    lineHeight: 40,
  },
  heroSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_MD,
    color: Colors.DUST,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.XL,
    padding: 16,
    gap: 0,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: { fontSize: 16 },
  featureText: { flex: 1 },
  featureLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  featureDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 1,
  },
  featureCheck: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 14,
    color: Colors.GOLD,
  },
  planTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    textAlign: 'center',
  },
  plans: { flexDirection: 'row', gap: 12 },
  planCard: {
    flex: 1,
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.STONE,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 160,
  },
  planCardActive: {
    borderColor: Colors.GOLD,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  planBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  planBadgeText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.MICRO,
    color: Colors.OBSIDIAN,
    letterSpacing: 1,
  },
  planLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDER,
    textTransform: 'uppercase',
    marginTop: 28,
  },
  planPrice: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: -1,
  },
  planPriceActive: { color: Colors.GOLD },
  planPeriod: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  savingsBadge: {
    backgroundColor: Colors.SUCCESS_BG,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.PILL,
    marginTop: 4,
  },
  savingsText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.MICRO,
    color: Colors.SUCCESS,
    letterSpacing: 0.5,
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  planRadioActive: { borderColor: Colors.GOLD },
  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.GOLD,
  },
  trialText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    textAlign: 'center',
    marginTop: 10,
  },
  testimonial: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.PARCHMENT,
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  testimonialAuthor: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
