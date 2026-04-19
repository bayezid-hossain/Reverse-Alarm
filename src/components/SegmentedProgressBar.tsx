import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface SegmentedProgressBarProps {
  progress: number;   // 0–1
  segments?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function SegmentedProgressBar({
  progress,
  segments = 14,
  color = Colors.warning,
  backgroundColor = Colors.surfaceMuted,
  style,
}: SegmentedProgressBarProps) {
  const filledCount = Math.floor(progress * segments);

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: segments }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: i < filledCount ? color : backgroundColor },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
  },
  segment: {
    flex: 1,
    borderRadius: 0,
  },
});
