import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, BorderRadius, Spacing } from '../../theme';

interface GoldInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  onRightIconPress?: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function GoldInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  onRightIconPress,
  ...props
}: GoldInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? Colors.ERROR : 'rgba(201,168,76,0.2)', Colors.GOLD]
    ),
  }));

  function handleFocus() {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    props.onFocus?.({} as never);
  }

  function handleBlur() {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    props.onBlur?.({} as never);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
      )}
      <AnimatedView style={[styles.inputWrapper, borderStyle]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...props}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeft,
            rightIcon && styles.inputWithRight,
            props.style,
          ]}
          placeholderTextColor={Colors.DUST}
          selectionColor={Colors.GOLD}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </AnimatedView>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    color: Colors.PARCHMENT,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelError: {
    color: Colors.ERROR,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ASH,
    borderRadius: BorderRadius.MD,
    borderWidth: 1.5,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_MD,
    color: Colors.IVORY,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
  },
  inputWithLeft: {
    paddingLeft: Spacing.SM,
  },
  inputWithRight: {
    paddingRight: Spacing.SM,
  },
  leftIcon: {
    paddingLeft: Spacing.MD,
  },
  rightIcon: {
    paddingRight: Spacing.MD,
  },
  error: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.ERROR,
  },
  hint: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
});
