import React from 'react';
import { View, StyleSheet } from 'react-native';

import { QuickActionFab } from '@/navigation/quick-action-fab';
import { ObjectRecordsPanel } from '@/records/object-records-panel';

export default function PeopleTabScreen() {
  return (
    <View style={styles.root}>
      <ObjectRecordsPanel namePlural="people" showHeaderActions={false} />
      <QuickActionFab mode="people" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
