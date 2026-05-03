import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface WheelTimePickerProps {
  hour: number;   // 0-23
  minute: number; // 0-59
  onChange: (hour: number, minute: number) => void;
}

const ITEM_HEIGHT = 56;
const VISIBLE = 3;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// Spacer count = half of VISIBLE rows so first/last items snap to center
const SPACERS = Math.floor(VISIBLE / 2); // 1
const PADDED_HOURS: (number | null)[] = [
  ...Array(SPACERS).fill(null),
  ...HOURS_12,
  ...Array(SPACERS).fill(null),
];
const PADDED_MINUTES: (number | null)[] = [
  ...Array(SPACERS).fill(null),
  ...MINUTES,
  ...Array(SPACERS).fill(null),
];

function to12h(h24: number): { idx: number; isPM: boolean } {
  const isPM = h24 >= 12;
  const h12 = h24 % 12;
  return { idx: h12, isPM };
}

function to24h(idx: number, isPM: boolean): number {
  const h12 = idx === 0 ? 12 : idx;
  if (isPM) return h12 === 12 ? 12 : h12 + 12;
  return h12 === 12 ? 0 : h12;
}

export function WheelTimePicker({ hour, minute, onChange }: WheelTimePickerProps) {
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const { idx: initHourIdx, isPM: initPM } = to12h(hour);

  const currentHourIdx = useRef(initHourIdx);
  const currentMinute = useRef(minute);
  const currentIsPM = useRef(initPM);

  useEffect(() => {
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: initHourIdx * ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: minute * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const handleHourScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, HOURS_12.length - 1));
    const exactY = clamped * ITEM_HEIGHT;
    // Force exact pixel alignment if native snap was imprecise
    if (Math.abs(y - exactY) > 1) {
      hourScrollRef.current?.scrollTo({ y: exactY, animated: false });
    }
    if (clamped !== currentHourIdx.current) {
      currentHourIdx.current = clamped;
      Haptics.selectionAsync();
      onChange(to24h(clamped, currentIsPM.current), currentMinute.current);
    }
  };

  const handleMinuteScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, MINUTES.length - 1));
    const exactY = clamped * ITEM_HEIGHT;
    // Force exact pixel alignment if native snap was imprecise
    if (Math.abs(y - exactY) > 1) {
      minuteScrollRef.current?.scrollTo({ y: exactY, animated: false });
    }
    if (clamped !== currentMinute.current) {
      currentMinute.current = clamped;
      Haptics.selectionAsync();
      onChange(to24h(currentHourIdx.current, currentIsPM.current), clamped);
    }
  };

  const toggleAMPM = (pm: boolean) => {
    if (pm === currentIsPM.current) return;
    currentIsPM.current = pm;
    Haptics.selectionAsync();
    onChange(to24h(currentHourIdx.current, pm), currentMinute.current);
  };

  const isPM = to12h(hour).isPM;

  return (
    <View style={styles.outer}>
      {/* AM / PM toggle — above wheel, full width, clearly separated */}
      <View style={styles.ampmRow}>
        {(['AM', 'PM'] as const).map((label) => {
          const active = label === 'PM' ? isPM : !isPM;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => toggleAMPM(label === 'PM')}
              style={[styles.ampmBtn, active && styles.ampmBtnActive]}
              activeOpacity={0.7}
            >
              <VoltageText
                variant="label"
                color={active ? Colors.heat : Colors.textMuted}
                style={styles.ampmText}
              >
                {label}
              </VoltageText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Wheel — overflow hidden, perfectly centered */}
      <View style={styles.wheelContainer}>
        {/* Selection highlight behind the center row */}
        <View style={styles.highlight} pointerEvents="none" />

        {/* Hour column */}
        <View style={styles.wheelWrapper}>
          <ScrollView
            ref={hourScrollRef}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="start"
            disableIntervalMomentum={true}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            onMomentumScrollEnd={handleHourScroll}
            contentContainerStyle={styles.listContent}
            nestedScrollEnabled={true}
          >
            {PADDED_HOURS.map((h, i) => (
              <View key={i} style={styles.item}>
                {h !== null && (
                  <VoltageText variant="display" style={styles.itemText} color={Colors.textPrimary}>
                    {String(h).padStart(2, '0')}
                  </VoltageText>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Colon — vertically centered in the container */}
        <View style={styles.colonWrapper}>
          <VoltageText variant="display" color={Colors.heat} style={styles.colon}>:</VoltageText>
        </View>

        {/* Minute column */}
        <View style={styles.wheelWrapper}>
          <ScrollView
            ref={minuteScrollRef}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="start"
            disableIntervalMomentum={true}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            onMomentumScrollEnd={handleMinuteScroll}
            contentContainerStyle={styles.listContent}
            nestedScrollEnabled={true}
          >
            {PADDED_MINUTES.map((m, i) => (
              <View key={i} style={styles.item}>
                {m !== null && (
                  <VoltageText variant="display" style={styles.itemText} color={Colors.textPrimary}>
                    {String(m).padStart(2, '0')}
                  </VoltageText>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    width: '100%',
  },
  ampmRow: {
    flexDirection: 'row',
    width: 240,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  ampmBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ampmBtnActive: {
    borderColor: Colors.heat,
    backgroundColor: Colors.surface,
  },
  ampmText: {
    fontSize: 13,
    letterSpacing: 2,
  },
  wheelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ITEM_HEIGHT * VISIBLE,
    overflow: 'hidden',
    width: 240,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceMuted,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.heat,
  },
  wheelWrapper: {
    flex: 1,
    height: ITEM_HEIGHT * VISIBLE,
  },
  colonWrapper: {
    width: 24,
    height: ITEM_HEIGHT * VISIBLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: {
    fontSize: 32,
    lineHeight: ITEM_HEIGHT,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  item: {
    height: ITEM_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 38,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
    lineHeight: ITEM_HEIGHT,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  listContent: {
    paddingVertical: 0,
  },
});
