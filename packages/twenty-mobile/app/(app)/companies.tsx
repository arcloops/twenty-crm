import React from 'react';
import { StyleSheet, View } from 'react-native';

import { QuickActionFab } from '@/navigation/quick-action-fab';
import { ObjectRecordsPanel } from '@/records/object-records-panel';

export default function CompaniesScreen() {
  return (
    <View style={styles.root}>
      <ObjectRecordsPanel namePlural="companies" showHeaderActions />
      <QuickActionFab
        mode="object"
        singular="company"
        labelSingular="Company"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});