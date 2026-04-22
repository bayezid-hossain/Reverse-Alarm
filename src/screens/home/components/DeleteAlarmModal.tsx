import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { VoltageText } from '@/components/VoltageText';
import { VoltageButton } from '@/components/VoltageButton';
import { VoltageModal } from '@/components/VoltageModal';
import { Alarm } from '@/types/alarm.types';
import { formatAlarmTime } from '@/utils/timeUtils';

interface DeleteAlarmModalProps {
  visible: boolean;
  alarm: Alarm | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAlarmModal({ visible, alarm, onClose, onConfirm }: DeleteAlarmModalProps) {
  if (!alarm) return null;

  return (
    <VoltageModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <VoltageText variant="label" color={Colors.heat}>SECURITY PROTOCOL</VoltageText>
        <VoltageText variant="h2" style={styles.title}>DECOMMISSION STATE</VoltageText>
      </View>

      <View style={styles.content}>
        <VoltageText variant="body" color={Colors.textSecondary}>
          Are you sure you want to terminate the wait-state for{' '}
          <VoltageText variant="body" color={Colors.textPrimary}>
            {formatAlarmTime(alarm.hour, alarm.minute)}
          </VoltageText>?
        </VoltageText>
        
        <View style={styles.warningBox}>
          <VoltageText variant="caption" color={Colors.warning}>
            WARNING: SYSTEM PERSISTENCE WILL BE LOST
          </VoltageText>
        </View>
      </View>

      <View style={styles.footer}>
        <VoltageButton 
          label="CANCEL" 
          onPress={onClose} 
          style={styles.cancelBtn}
          variant="secondary"
        />
        <VoltageButton 
          label="TERMINATE" 
          onPress={onConfirm} 
          style={styles.confirmBtn}
        />
      </View>
    </VoltageModal>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    marginTop: Spacing.xs,
    letterSpacing: 2,
  },
  content: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  warningBox: {
    backgroundColor: 'rgba(234, 234, 0, 0.1)',
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceMuted,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: Colors.error,
  },
});
