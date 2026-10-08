import React from 'react';
import { View, StyleSheet } from 'react-native';

import { QuickActionFab } from '@/navigation/quick-action-fab';
import { ObjectRecordsPanel } from '@/records/object-records-panel';

export default function TasksTabScreen() {
  return (
    <View style={styles.root}>
      <ObjectRecordsPanel namePlural="tasks" showHeaderActions={false} />
      <QuickActionFab mode="object" singular="task" labelSingular="Task" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
