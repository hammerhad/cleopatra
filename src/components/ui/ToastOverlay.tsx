import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUIStore } from '../../stores/uiStore';
import { Colors, FontFamily, FontSize, BorderRadius } from '../../theme';

const TOAST_CONFIGS = {
  success: {
    colors: ['#0A2A1A', '#0E3520'] as [string, string],
    border: Colors.SUCCESS,
    icon: '✓',
    iconColor: Colors.SUCCESS,
  },
  error: {
    colors: ['#2A0A10', '#3A0E18'] as [string, string],
    border: Colors.ERROR,
    icon: '✕',
    iconColor: '#E05070',
  },
  warning: {
    colors: ['#2A1A04', '#3A2208'] as [string, string],
    border: Colors.WARNING,
    icon: '⚠',
    iconColor: Colors.WARNING,
  },
  info: {
    colors: ['#1A1204', '#231808'] as [string, string],
    border: Colors.GOLD_MUTED,
    icon: '𓂀',
    iconColor: Colors.GOLD,
  },
};

function ToastItem({ message, type, onHide }: { message: string; type: keyof typeof TOAST_CONFIGS; onHide: () => void }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIGS[type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onHide());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toastWrapper, { opacity, transform: [{ translateY }] }]}>
      <LinearGradient colors={config.colors} style={[styles.toastInner, { borderColor: config.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${config.border}20` }]}>
          <Text style={[styles.icon, { color: config.iconColor }]}>{config.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export function ToastOverlay() {
  const insets = useSafeAreaInsets();
  const { toasts, hideToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="none">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          message={t.message}
          type={t.type}
          onHide={() => hideToast(t.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    gap: 8,
  },
  toastWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
    fontFamily: FontFamily.BODY_BOLD,
  },
  message: {
    flex: 1,
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
    lineHeight: 20,
  },
});
