import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { Colors, FontFamily, FontSize, LetterSpacing, Spacing } from '../../src/theme';

const { width: W, height: H } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(30);
  const ornamentScale = useSharedValue(0.5);

  useEffect(() => {
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 900 }));
    logoY.value = withDelay(300, withSpring(0, { damping: 20 }));
    ornamentScale.value = withDelay(600, withSpring(1, { damping: 12, stiffness: 100 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 700 }));
    buttonsOpacity.value = withDelay(1300, withTiming(1, { duration: 600 }));
    buttonsY.value = withDelay(1300, withSpring(0, { damping: 20 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));

  const ornamentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ornamentScale.value }],
    opacity: ornamentScale.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.OBSIDIAN, '#0F0C08', Colors.ONYX]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background geometric ornaments */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Animated.View style={ornamentStyle}>
            <Text style={styles.ankh}>𓂀</Text>
          </Animated.View>

          <Animated.View style={logoStyle}>
            <Text style={styles.logoTitle}>CLEOPATRA</Text>
            <View style={styles.logoDivider} />
            <Text style={styles.logoSubtitle}>REIGN OVER YOUR DAYS</Text>
          </Animated.View>
        </View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineContainer, taglineStyle]}>
          <Text style={styles.tagline}>
            Discipline is the crown{'\n'}
            that queens never remove.
          </Text>
          <GoldenDivider style={{ marginTop: 24 }} />
          <View style={styles.pillars}>
            {['HABITS', 'TASKS', 'BODY', 'MIND'].map((p, i) => (
              <View key={p} style={styles.pillar}>
                <Text style={styles.pillarText}>{p}</Text>
                {i < 3 && <Text style={styles.pillarSep}>·</Text>}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, buttonsStyle]}>
          <GoldButton
            label="BEGIN YOUR REIGN"
            onPress={() => router.push('/(auth)/sign-up')}
            size="lg"
            fullWidth
          />
          <GoldButton
            label="RETURN TO THE THRONE"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="outline"
            size="lg"
            fullWidth
          />
          <Text style={styles.legal}>
            By continuing, you accept our Terms & Privacy Policy.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.OBSIDIAN,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(201,168,76,0.03)',
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(201,168,76,0.02)',
    bottom: 100,
    left: -60,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: H * 0.14,
    gap: 16,
  },
  ankh: {
    fontSize: 52,
    color: Colors.GOLD,
    textShadowColor: Colors.GOLD,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  logoTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 42,
    color: Colors.IVORY,
    letterSpacing: 12,
    textAlign: 'center',
  },
  logoDivider: {
    height: 1.5,
    backgroundColor: Colors.GOLD,
    marginVertical: 10,
    opacity: 0.5,
  },
  logoSubtitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.WIDEST,
    textAlign: 'center',
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H3,
    color: Colors.PARCHMENT,
    textAlign: 'center',
    lineHeight: FontSize.H3 * 1.6,
    letterSpacing: -0.3,
  },
  pillars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillarText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    letterSpacing: 2,
  },
  pillarSep: {
    color: Colors.GOLD_MUTED,
    marginHorizontal: 4,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  legal: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.SHADOW,
    textAlign: 'center',
    marginTop: 4,
  },
});
