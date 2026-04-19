import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface VoltageCardProps extends ViewProps {
  elevated?: boolean;
  accent?: boolean;
}

export function VoltageCard({ elevated = false, accent = false, style, children, ...props }: VoltageCardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        accent && styles.accent,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 0,
  },
  elevated: {
    backgroundColor: Colors.surfaceElevated,
  },
  accent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.heat,
  },
});
