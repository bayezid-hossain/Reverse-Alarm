import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

interface WaveformVisualizerProps {
  active: boolean;
}

const BAR_COUNT = 20;

export function WaveformVisualizer({ active }: WaveformVisualizerProps) {
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(8))).current;
  const animations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    animations.current.forEach((a) => a.stop());

    if (!active) {
      bars.forEach((b) => b.setValue(8));
      return;
    }

    animations.current = bars.map((bar, i) => {
      const delay = i * 50;
      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(bar, {
            toValue: 8 + Math.random() * 40,
            duration: 150 + Math.random() * 150,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 8,
            duration: 150 + Math.random() * 150,
            useNativeDriver: false,
          }),
        ])
      );
      anim.start();
      return anim;
    });

    return () => animations.current.forEach((a) => a.stop());
  }, [active]);

  return (
    <View style={styles.container}>
      {bars.map((height, i) => (
        <Animated.View
          key={i}
          style={[styles.bar, { height, backgroundColor: active ? Colors.heat : Colors.textMuted }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 56,
  },
  bar: {
    flex: 1,
    borderRadius: 0,
  },
});
