import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, BorderRadius } from '../../theme';

type ChipVariant = 'gold' | 'dark' | 'success' | 'error' | 'phase' | 'outline';

interface BadgeChipProps {
  label: string;
  variant?: ChipVariant;
  size?: 'sm' | 'md';
  emoji?: string;
  style?: ViewStyle;
  color?: string;
}

export function BadgeChip({
  label,
  variant = 'dark',
  size = 'md',
  emoji,
  style,
  color,
}: BadgeChipProps) {
  const bgColors: Record<ChipVariant, string> = {
    gold: 'rgba(201,168,76,0.15)',
    dark: Colors.ASH,
    success: Colors.SUCCESS_BG,
    error: Colors.ERROR_BG,
    phase: 'transparent',
    outline: 'transparent',
  };

  const textColors: Record<ChipVariant, string> = {
    gold: Colors.GOLD,
    dark: Colors.PARCHMENT,
    success: Colors.SUCCESS,
    error: Colors.ERROR,
    phase: Colors.IVORY,
    outline: Colors.GOLD,
  };

  const borderColors: Record<ChipVariant, string> = {
    gold: 'rgba(201,168,76,0.3)',
    dark: 'transparent',
    success: Colors.SUCCESS,
    error: Colors.ERROR,
    phase: Colors.DUST,
    outline: Colors.GOLD_MUTED,
  };

  const heights = { sm: 22, md: 28 };
  const fontSizes = { sm: FontSize.MICRO, md: FontSize.CAPTION };

  return (
    <View
      style={[
        styles.base,
        {
          height: heights[size],
          backgroundColor: color ? `${color}20` : bgColors[variant],
          borderColor: color ? `${color}40` : borderColors[variant],
        },
        style,
      ]}
    >
      {emoji && <Text style={{ fontSize: fontSizes[size] }}>{emoji}</Text>}
      <Text
        style={[
          styles.label,
          { fontSize: fontSizes[size], color: color ?? textColors[variant] },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.PILL,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    letterSpacing: 0.5,
  },
});
