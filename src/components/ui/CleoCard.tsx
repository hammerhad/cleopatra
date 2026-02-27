import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows } from '../../theme';

type CardVariant = 'default' | 'gold' | 'dark' | 'phase';

interface CleoCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
  gradientColors?: string[];
  noPadding?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function CleoCard({
  children,
  variant = 'default',
  style,
  pressable = false,
  onPress,
  gradientColors,
  noPadding = false,
}: CleoCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (variant === 'gold' || gradientColors) {
    const colors = gradientColors ?? [Colors.GOLD_DEEP, Colors.GOLD, Colors.GOLD_LIGHT];
    return (
      <AnimatedView style={[animStyle, style]}>
        <LinearGradient
          colors={colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            noPadding && styles.noPadding,
            Shadows.GOLD_GLOW,
          ]}
        >
          {children}
        </LinearGradient>
      </AnimatedView>
    );
  }

  const bgColors: Record<Exclude<CardVariant, 'gold' | 'phase'>, string> = {
    default: Colors.ANTHRACITE,
    dark: Colors.ONYX,
  };

  return (
    <AnimatedView
      style={[
        animStyle,
        styles.base,
        !noPadding && styles.padding,
        { backgroundColor: bgColors[variant as Exclude<CardVariant, 'gold' | 'phase'>] ?? Colors.ANTHRACITE },
        styles.border,
        Shadows.CARD,
        style,
      ]}
    >
      {children}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.LG,
    overflow: 'hidden',
  },
  padding: {
    padding: 16,
  },
  noPadding: {
    padding: 0,
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
  },
});
