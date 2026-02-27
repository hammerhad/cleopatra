import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, FontSize, BorderRadius } from '../../theme';
import type { UserRank } from '../../types/user';

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface RankConfig {
  emoji: string;
  colors: [string, string];
  textColor: string;
}

const RANK_CONFIGS: Record<UserRank, RankConfig> = {
  Initiate:      { emoji: '🌱', colors: ['#1A3020', '#2A5030'], textColor: '#5A9A6A' },
  Scholar:       { emoji: '📜', colors: ['#1A2535', '#2A3A55'], textColor: '#6A8AB0' },
  Warrior:       { emoji: '⚔️', colors: ['#3A1010', '#5A2020'], textColor: '#C05050' },
  Strategist:    { emoji: '♟',  colors: ['#1A1A3A', '#2A2A5A'], textColor: '#6A6AB0' },
  Commander:     { emoji: '🦅', colors: ['#301A10', '#502E20'], textColor: '#C08050' },
  'High Priestess': { emoji: '🔮', colors: ['#2A0A35', '#4A1855'], textColor: '#9A50C0' },
  Pharaoh:       { emoji: '𓂀', colors: [Colors.GOLD_DEEP, '#8A6010'], textColor: Colors.GOLD },
};

const SIZE_STYLES: Record<BadgeSize, {
  container: ViewStyle;
  emoji: number;
  fontSize: number;
  padding: [number, number];
}> = {
  xs: { container: {}, emoji: 10, fontSize: 9,  padding: [4, 8]  },
  sm: { container: {}, emoji: 12, fontSize: 10, padding: [5, 10] },
  md: { container: {}, emoji: 16, fontSize: 12, padding: [7, 14] },
  lg: { container: {}, emoji: 22, fontSize: 15, padding: [10, 20] },
};

interface RankBadgeProps {
  rank: UserRank;
  size?: BadgeSize;
  showEmoji?: boolean;
  style?: ViewStyle;
}

export function RankBadge({ rank, size = 'sm', showEmoji = true, style }: RankBadgeProps) {
  const config = RANK_CONFIGS[rank] ?? RANK_CONFIGS.Initiate;
  const sizeConfig = SIZE_STYLES[size];

  return (
    <LinearGradient
      colors={config.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.badge,
        {
          paddingVertical: sizeConfig.padding[0],
          paddingHorizontal: sizeConfig.padding[1],
          borderRadius: BorderRadius.PILL,
        },
        style,
      ]}
    >
      <Text style={[styles.emoji, { fontSize: sizeConfig.emoji }]}>
        {showEmoji ? config.emoji : null}
      </Text>
      <Text style={[styles.label, { fontSize: sizeConfig.fontSize, color: config.textColor }]}>
        {rank.toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

/**
 * Stacked version — circular icon + rank name underneath.
 */
export function RankBadgeStacked({ rank, size = 'md', style }: Omit<RankBadgeProps, 'showEmoji'>) {
  const config = RANK_CONFIGS[rank] ?? RANK_CONFIGS.Initiate;
  const iconSize = size === 'lg' ? 56 : size === 'md' ? 44 : 32;
  const emojiSize = size === 'lg' ? 26 : size === 'md' ? 20 : 15;
  const labelSize = size === 'lg' ? FontSize.BODY_SM : FontSize.CAPTION;

  return (
    <View style={[styles.stackedContainer, style]}>
      <LinearGradient
        colors={config.colors}
        style={[styles.stackedIcon, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}
      >
        <Text style={{ fontSize: emojiSize }}>{config.emoji}</Text>
      </LinearGradient>
      <Text style={[styles.stackedLabel, { fontSize: labelSize, color: config.textColor }]}>
        {rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    alignSelf: 'flex-start',
  },
  emoji: {
    lineHeight: undefined,
  },
  label: {
    fontFamily: FontFamily.BODY_BOLD,
    letterSpacing: 0.8,
  },

  stackedContainer: {
    alignItems: 'center',
    gap: 6,
  },
  stackedIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  stackedLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    letterSpacing: 0.5,
  },
});
