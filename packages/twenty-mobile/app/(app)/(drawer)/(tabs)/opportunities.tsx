import React from 'react';
import { View, StyleSheet } from 'react-native';

import { QuickActionFab } from '@/navigation/quick-action-fab';
import { ObjectRecordsPanel } from '@/records/object-records-panel';

export default function OpportunitiesTabScreen() {
  return (
    <View style={styles.root}>
      <ObjectRecordsPanel
        namePlural="opportunities"
        showHeaderActions={false}
      />
      <QuickActionFab
        mode="object"
        singular="opportunity"
        labelSingular="Opportunity"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
