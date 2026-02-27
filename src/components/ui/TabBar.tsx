import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors, FontFamily, FontSize } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 5;
const INDICATOR_WIDTH = 36;

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: '⚜️', inactive: '⚜' },
  habits: { active: '🔥', inactive: '○' },
  tasks: { active: '⚔️', inactive: '◇' },
  court: { active: '👑', inactive: '◯' },
  profile: { active: '◉', inactive: '○' },
};

const TAB_LABELS: Record<string, string> = {
  index: 'Kingdom',
  habits: 'Rituals',
  tasks: 'Decrees',
  court: 'Court',
  profile: 'Queen',
};

export function CleoTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabWidth = SCREEN_WIDTH / TAB_COUNT;
  const indicatorX = useSharedValue(state.index * tabWidth + tabWidth / 2 - INDICATOR_WIDTH / 2);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['transparent', 'rgba(201,168,76,0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />

      {/* Fluid gold indicator */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = TAB_LABELS[route.name] ?? route.name;
        const icon = TAB_ICONS[route.name];

        const scale = useSharedValue(1);
        const tabAnimStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scale.value }],
        }));

        function onPress() {
          Haptics.selectionAsync();
          indicatorX.value = withSpring(
            index * tabWidth + tabWidth / 2 - INDICATOR_WIDTH / 2,
            { damping: 20, stiffness: 250 }
          );
          scale.value = withSpring(0.9, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 10 });
          });

          if (!isFocused) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tab, { width: tabWidth }]}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.tabContent, tabAnimStyle]}>
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {isFocused ? icon?.active ?? '●' : icon?.inactive ?? '○'}
              </Text>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.TAB_BG,
    paddingTop: 8,
    position: 'relative',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: INDICATOR_WIDTH,
    height: 2,
    backgroundColor: Colors.GOLD,
    borderRadius: 1,
    shadowColor: Colors.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    color: Colors.TAB_INACTIVE,
  },
  tabIconActive: {
    color: Colors.GOLD,
  },
  tabLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: 9,
    color: Colors.TAB_INACTIVE,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: Colors.GOLD,
  },
});
