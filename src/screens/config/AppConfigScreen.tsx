import React from 'react';
import { View, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { VoltageText } from '@/components/VoltageText';
import { VoltageCard } from '@/components/VoltageCard';
import { useStore } from '@/store';

function SettingRow({ label, sublabel, right }: { label: string; sublabel?: string; right: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <VoltageText variant="body">{label}</VoltageText>
        {sublabel ? <VoltageText variant="caption" color={Colors.textMuted}>{sublabel}</VoltageText> : null}
      </View>
      {right}
    </View>
  );
}

export default function AppConfigScreen() {
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <VoltageText variant="h4">SYSTEM CONFIG</VoltageText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <VoltageText variant="label" color={Colors.textMuted} style={styles.sectionLabel}>
          ALARM BEHAVIOUR
        </VoltageText>
        <VoltageCard>
          <SettingRow
            label="Haptics"
            sublabel="Vibrate during alarm"
            right={
              <Switch
                value={config.hapticsEnabled}
                onValueChange={(v) => updateConfig({ hapticsEnabled: v })}
                trackColor={{ false: Colors.surfaceMuted, true: Colors.heat }}
                thumbColor={Colors.textPrimary}
              />
            }
          />
        </VoltageCard>

        <VoltageText variant="label" color={Colors.textMuted} style={styles.sectionLabel}>
          INTERFACE
        </VoltageText>
        <VoltageCard>
          <SettingRow
            label="Picker Style"
            sublabel="Method for selecting time"
            right={
              <View style={styles.segmentContainer}>
                <TouchableOpacity
                  onPress={() => updateConfig({ timePickerStyle: 'wheel' })}
                  style={[styles.segment, config.timePickerStyle === 'wheel' && styles.segmentActive]}
                >
                  <VoltageText
                    variant="caption"
                    color={config.timePickerStyle === 'wheel' ? Colors.textInverse : Colors.textMuted}
                  >WHEEL</VoltageText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateConfig({ timePickerStyle: 'grid' })}
                  style={[styles.segment, config.timePickerStyle === 'grid' && styles.segmentActive]}
                >
                  <VoltageText
                    variant="caption"
                    color={config.timePickerStyle === 'grid' ? Colors.textInverse : Colors.textMuted}
                  >GRID</VoltageText>
                </TouchableOpacity>
              </View>
            }
          />
        </VoltageCard>

        <VoltageText variant="label" color={Colors.textMuted} style={styles.sectionLabel}>
          SNOOZE
        </VoltageText>
        <VoltageCard>
          <SettingRow
            label="Max snoozes"
            sublabel={`Currently: ${config.maxSnoozes}x`}
            right={
              <View style={styles.stepper}>
                <VoltageText
                  variant="h4"
                  onPress={() => updateConfig({ maxSnoozes: Math.max(0, config.maxSnoozes - 1) })}
                  style={styles.stepBtn}
                >−</VoltageText>
                <VoltageText variant="h4">{config.maxSnoozes}</VoltageText>
                <VoltageText
                  variant="h4"
                  onPress={() => updateConfig({ maxSnoozes: Math.min(10, config.maxSnoozes + 1) })}
                  style={styles.stepBtn}
                >+</VoltageText>
              </View>
            }
          />
          <SettingRow
            label="Snooze interval"
            sublabel={`Currently: ${config.defaultSnoozeMinutes} min`}
            right={
              <View style={styles.stepper}>
                <VoltageText
                  variant="h4"
                  onPress={() => updateConfig({ defaultSnoozeMinutes: Math.max(1, config.defaultSnoozeMinutes - 1) })}
                  style={styles.stepBtn}
                >−</VoltageText>
                <VoltageText variant="h4">{config.defaultSnoozeMinutes}</VoltageText>
                <VoltageText
                  variant="h4"
                  onPress={() => updateConfig({ defaultSnoozeMinutes: Math.min(30, config.defaultSnoozeMinutes + 1) })}
                  style={styles.stepBtn}
                >+</VoltageText>
              </View>
            }
          />
        </VoltageCard>

        <VoltageText variant="label" color={Colors.textMuted} style={styles.sectionLabel}>
          ABOUT
        </VoltageText>
        <VoltageCard>
          <SettingRow
            label="Reverse Alarm"
            sublabel="Version 1.0.0 — Voltage Shift Build"
            right={null}
          />
        </VoltageCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.vantablack,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  sectionLabel: {
    letterSpacing: 2,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0,
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepBtn: {
    color: Colors.heat,
    paddingHorizontal: Spacing.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    padding: 2,
    borderRadius: 0,
  },
  segment: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 0,
  },
  segmentActive: {
    backgroundColor: Colors.heat,
  },
});
