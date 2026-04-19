import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface PulseIndicatorProps {
  color?: string;
  size?: number;
  active?: boolean;
  style?: ViewStyle;
}

export function PulseIndicator({
  color = Colors.error,
  size = 10,
  active = true,
  style,
}: PulseIndicatorProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active, opacity]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { width: size, height: size, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 0,
  },
});
