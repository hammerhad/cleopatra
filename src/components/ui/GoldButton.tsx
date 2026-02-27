import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, BorderRadius, LetterSpacing, Shadows } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function GoldButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: GoldButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 60 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  }

  async function handlePress() {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const isDisabled = disabled || loading;
  const heights: Record<Size, number> = { sm: 40, md: 52, lg: 60 };
  const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 16 };
  const h = heights[size];
  const fs = fontSizes[size];

  if (variant === 'primary') {
    return (
      <AnimatedTouchable
        style={[
          animStyle,
          fullWidth && { width: '100%' },
          style,
        ]}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled}
      >
        <LinearGradient
          colors={isDisabled
            ? [Colors.GOLD_MUTED, Colors.GOLD_MUTED]
            : [Colors.GOLD_DEEP, Colors.GOLD, Colors.GOLD_LIGHT, Colors.GOLD]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { height: h, borderRadius: BorderRadius.MD }, Shadows.GOLD_SUBTLE]}
        >
          {icon && <>{icon}</>}
          {loading ? (
            <ActivityIndicator color={Colors.OBSIDIAN} size="small" />
          ) : (
            <Text style={[styles.primaryText, { fontSize: fs }, textStyle]}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  const variantStyles: Record<Exclude<Variant, 'primary'>, ViewStyle> = {
    secondary: {
      backgroundColor: Colors.CHARCOAL,
      borderWidth: 1,
      borderColor: Colors.GOLD_MUTED,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: Colors.GOLD,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: Colors.ERROR_BG,
      borderWidth: 1,
      borderColor: Colors.ERROR,
    },
  };

  const variantTextColors: Record<Exclude<Variant, 'primary'>, string> = {
    secondary: Colors.IVORY,
    outline: Colors.GOLD,
    ghost: Colors.GOLD,
    danger: Colors.ERROR,
  };

  return (
    <AnimatedTouchable
      style={[
        animStyle,
        styles.base,
        { height: h, borderRadius: BorderRadius.MD },
        variantStyles[variant as Exclude<Variant, 'primary'>],
        isDisabled && styles.disabled,
        fullWidth && { width: '100%' },
        style,
      ]}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {icon && <>{icon}</>}
      {loading ? (
        <ActivityIndicator
          color={variantTextColors[variant as Exclude<Variant, 'primary'>]}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: fs, color: variantTextColors[variant as Exclude<Variant, 'primary'>] },
            isDisabled && styles.disabledText,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  primaryText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    color: Colors.OBSIDIAN,
    letterSpacing: LetterSpacing.WIDER,
  },
  text: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    letterSpacing: LetterSpacing.WIDER,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.DUST,
  },
});
