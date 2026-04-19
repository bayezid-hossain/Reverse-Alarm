import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes, LineHeights } from '@/constants/typography';

type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'label';

interface VoltageTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  uppercase?: boolean;
}

export function VoltageText({
  variant = 'body',
  color,
  uppercase,
  style,
  children,
  ...props
}: VoltageTextProps) {
  const isDisplayVariant = ['display', 'h1', 'h2', 'h3', 'h4'].includes(variant);
  const shouldUppercase = uppercase !== undefined ? uppercase : isDisplayVariant;

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        color ? { color } : null,
        shouldUppercase ? styles.uppercase : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.textPrimary,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  display: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: FontSizes.display,
    lineHeight: LineHeights.display,
    letterSpacing: -2,
  },
  h1: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: FontSizes.h1,
    lineHeight: LineHeights.h1,
    letterSpacing: -1,
  },
  h2: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: FontSizes.h2,
    lineHeight: LineHeights.h2,
    letterSpacing: 1,
  },
  h3: {
    fontFamily: Fonts.spaceGroteskMedium,
    fontSize: FontSizes.h3,
    lineHeight: LineHeights.h3,
    letterSpacing: 1,
  },
  h4: {
    fontFamily: Fonts.spaceGroteskMedium,
    fontSize: FontSizes.h4,
    lineHeight: LineHeights.h4,
    letterSpacing: 1,
  },
  body: {
    fontFamily: Fonts.interRegular,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
  },
  bodySmall: {
    fontFamily: Fonts.interRegular,
    fontSize: FontSizes.bodySmall,
    lineHeight: LineHeights.bodySmall,
  },
  caption: {
    fontFamily: Fonts.interRegular,
    fontSize: FontSizes.caption,
    lineHeight: LineHeights.caption,
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: Fonts.interSemiBold,
    fontSize: FontSizes.label,
    lineHeight: LineHeights.label,
    letterSpacing: 2,
  },
});
