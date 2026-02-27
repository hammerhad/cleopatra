import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, FontSize } from '../../theme';

interface GoldenDividerProps {
  label?: string;
  style?: object;
}

export function GoldenDivider({ label, style }: GoldenDividerProps) {
  if (label) {
    return (
      <View style={[styles.labelContainer, style]}>
        <LinearGradient
          colors={['transparent', Colors.GOLD_MUTED]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.line}
        />
        <Text style={styles.label}>{label}</Text>
        <LinearGradient
          colors={[Colors.GOLD_MUTED, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.line}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['transparent', Colors.GOLD_MUTED, 'transparent']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.divider, style]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
