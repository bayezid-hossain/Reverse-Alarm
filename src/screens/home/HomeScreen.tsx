import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { Fonts, FontSizes } from '@/constants/typography';
import { useStore } from '@/store';
import { AlarmCard } from './components/AlarmCard';
import { SystemStatusHeader } from './components/SystemStatusHeader';
import { VoltageText } from '@/components/VoltageText';
import { useAlarms } from '@/hooks/useAlarms';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const alarms = useStore((s) => s.alarms);
  const loadAlarms = useStore((s) => s.loadAlarms);
  const { toggleAlarm, deleteAlarm } = useAlarms();

  useEffect(() => {
    loadAlarms();
  }, []);

  function handleDelete(id: string) {
    Alert.alert('DELETE ALARM', 'Decommission this wait-state?', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'CONFIRM', style: 'destructive', onPress: () => deleteAlarm(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <SystemStatusHeader />

      <View style={styles.sectionHeader}>
        <VoltageText variant="h4" color={Colors.textSecondary}>
          ACTIVE WAIT-STATES
        </VoltageText>
        <VoltageText variant="caption" color={Colors.textMuted}>
          {alarms.filter((a) => a.status === 'active').length} ARMED
        </VoltageText>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            onToggle={() => toggleAlarm(item.id)}
            onPress={() => navigation.navigate('AlarmSetup', { alarmId: item.id })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <VoltageText variant="h3" color={Colors.textMuted}>
              NO WAIT-STATES
            </VoltageText>
            <VoltageText variant="body" color={Colors.textMuted}>
              Initiate a new protocol below
            </VoltageText>
          </View>
        }
      />

      {/* FAB — Add alarm */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AlarmSetup', {})}
        activeOpacity={0.85}
      >
        <VoltageText variant="h3" color={Colors.textInverse}>
          +
        </VoltageText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.vantablack,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  list: {
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 64,
    height: 64,
    backgroundColor: Colors.heat,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
});
