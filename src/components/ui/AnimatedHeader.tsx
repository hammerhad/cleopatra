import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors, FontFamily, FontSize, LetterSpacing } from '../../theme';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: Animated.SharedValue<number>;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  collapsedTitle?: string;
}

export function AnimatedHeader({
  title,
  subtitle,
  scrollY,
  rightAction,
  leftAction,
  collapsedTitle,
}: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [0, 1], 'clamp'),
  }));

  const collapsedTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [40, 80], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(scrollY.value, [40, 80], [10, 0], 'clamp') },
    ],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[StyleSheet.absoluteFill, blurStyle]}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.blurOverlay]} />
      </Animated.View>

      <View style={styles.row}>
        {leftAction && <View style={styles.side}>{leftAction}</View>}

        <View style={styles.titleContainer}>
          <Animated.Text style={[styles.collapsedTitle, collapsedTitleStyle]}>
            {collapsedTitle ?? title}
          </Animated.Text>
        </View>

        {rightAction && <View style={[styles.side, styles.right]}>{rightAction}</View>}
      </View>
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
  leftAction,
}: Omit<AnimatedHeaderProps, 'scrollY'>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.staticContainer, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {leftAction && <View style={styles.side}>{leftAction}</View>}
        <View style={styles.staticTitleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction && <View style={[styles.side, styles.right]}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.1)',
  },
  staticContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  staticTitleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H1,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  subtitle: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    marginTop: 2,
  },
  collapsedTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  blurOverlay: {
    backgroundColor: 'rgba(10,9,8,0.6)',
  },
  side: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
});
