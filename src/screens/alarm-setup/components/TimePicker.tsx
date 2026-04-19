import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useStore } from '@/store';
import { WheelTimePicker } from './WheelTimePicker';
import { GridTimePicker } from './GridTimePicker';

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

export function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  const pickerStyle = useStore((s) => s.config.timePickerStyle);

  return (
    <View style={styles.container}>
      {pickerStyle === 'wheel' ? (
        <WheelTimePicker hour={hour} minute={minute} onChange={onChange} />
      ) : (
        <GridTimePicker hour={hour} minute={minute} onChange={onChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
