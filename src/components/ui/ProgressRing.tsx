import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;   // 0-1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  color?: string;
  trackColor?: string;
  animated?: boolean;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  label,
  sublabel,
  showPercentage = true,
  color = Colors.GOLD,
  trackColor = 'rgba(201,168,76,0.1)',
  animated = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(clampedProgress, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [clampedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.GOLD_DEEP} />
            <Stop offset="0.5" stopColor={Colors.GOLD} />
            <Stop offset="1" stopColor={Colors.GOLD_SHIMMER} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={styles.center}>
        {label ? (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        ) : showPercentage ? (
          <Text style={styles.percentage}>
            {Math.round(clampedProgress * 100)}%
          </Text>
        ) : null}
        {sublabel && (
          <Text style={styles.sublabel} numberOfLines={1}>
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.GOLD,
  },
  label: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
    textAlign: 'center',
  },
  sublabel: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    textAlign: 'center',
  },
});
