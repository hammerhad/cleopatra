import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, BorderRadius, Shadows, Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;

interface MotivationCardProps {
  quote: string;
  author?: string;
  gradientColors?: string[];
  onNext?: () => void;
}

export function MotivationCard({
  quote,
  author,
  gradientColors = [Colors.OBSIDIAN, Colors.ANTHRACITE],
  onNext,
}: MotivationCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    await Haptics.selectionAsync();
    scale.value = withSequence(
      withSpring(0.97, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onNext?.();
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
      <Animated.View style={[animStyle, Shadows.DEEP, { width: CARD_WIDTH }]}>
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Gold corner ornament */}
          <View style={styles.topLeft}>
            <Text style={styles.ornament}>◆</Text>
          </View>
          <View style={styles.bottomRight}>
            <Text style={styles.ornament}>◆</Text>
          </View>

          {/* Gold border line */}
          <View style={styles.topBorder} />
          <View style={styles.bottomBorder} />

          <View style={styles.content}>
            <Text style={styles.openQuote}>"</Text>
            <Text style={styles.quote}>{quote}</Text>
            <Text style={styles.closeQuote}>"</Text>
            {author && <Text style={styles.author}>— {author}</Text>}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.XL,
    padding: Spacing.XXL,
    minHeight: 160,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    overflow: 'hidden',
  },
  content: {
    gap: 8,
  },
  openQuote: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 64,
    color: Colors.GOLD,
    lineHeight: 40,
    opacity: 0.6,
  },
  quote: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
    lineHeight: FontSize.H3 * 1.5,
    letterSpacing: -0.3,
  },
  closeQuote: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 64,
    color: Colors.GOLD,
    lineHeight: 32,
    textAlign: 'right',
    opacity: 0.6,
  },
  author: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  topLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  bottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  ornament: {
    color: Colors.GOLD,
    fontSize: 8,
    opacity: 0.5,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1.5,
    backgroundColor: Colors.GOLD,
    opacity: 0.3,
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 40,
    height: 1.5,
    backgroundColor: Colors.GOLD,
    opacity: 0.3,
  },
});
