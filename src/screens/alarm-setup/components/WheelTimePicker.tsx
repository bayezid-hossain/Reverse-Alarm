import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface WheelTimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

const ITEM_HEIGHT = 50;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function WheelTimePicker({ hour, minute, onChange }: WheelTimePickerProps) {
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initial scroll to current values
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: hour * ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: minute * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const handleScroll = (type: 'hour' | 'minute') => (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    
    if (type === 'hour') {
      if (index >= 0 && index < HOURS.length && index !== hour) {
        onChange(index, minute);
        Haptics.selectionAsync();
      }
    } else {
      if (index >= 0 && index < MINUTES.length && index !== minute) {
        onChange(hour, index);
        Haptics.selectionAsync();
      }
    }
  };

  const renderItems = (data: number[]) => {
    return data.map((item) => (
      <View key={item} style={styles.item}>
        <VoltageText
          variant="display"
          style={styles.itemText}
          color={Colors.textPrimary}
        >
          {String(item).padStart(2, '0')}
        </VoltageText>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.highlight} />
      
      <View style={styles.wheelWrapper}>
        <ScrollView
          ref={hourScrollRef}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll('hour')}
          contentContainerStyle={styles.listContent}
        >
          {renderItems(HOURS)}
        </ScrollView>
      </View>

      <VoltageText variant="display" color={Colors.heat} style={styles.colon}>:</VoltageText>

      <View style={styles.wheelWrapper}>
        <ScrollView
          ref={minuteScrollRef}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll('minute')}
          contentContainerStyle={styles.listContent}
        >
          {renderItems(MINUTES)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ITEM_HEIGHT * 3,
    overflow: 'hidden',
  },
  wheelWrapper: {
    height: ITEM_HEIGHT * 3,
    width: 80,
  },
  highlight: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    left: '10%',
    right: '10%',
    backgroundColor: Colors.surfaceMuted,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.heat,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 32,
  },
  colon: {
    paddingBottom: 4,
  },
  listContent: {
    paddingVertical: ITEM_HEIGHT,
  },
});
