import React from 'react';
import { Modal, StyleSheet, View, Pressable, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface VoltageModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function VoltageModal({ visible, onClose, children, contentStyle }: VoltageModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.container, contentStyle]} 
          onPress={() => {}} // Prevent closing when tapping content
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.heat,
    padding: Spacing.lg,
    borderRadius: 0, // Sharp corners
    elevation: 20,
    shadowColor: Colors.heat,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
});
