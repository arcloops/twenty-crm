import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useObjects } from '@/metadata/objects-provider';
import { QuickActionFab } from '@/navigation/quick-action-fab';
import { ObjectRecordsPanel } from '@/records/object-records-panel';

export default function ObjectListScreen() {
  const { plural } = useLocalSearchParams<{ plural: string }>();
  const { getByPlural } = useObjects();
  const objectMetadata = getByPlural(plural);

  return (
    <View style={styles.root}>
      <ObjectRecordsPanel namePlural={plural} showHeaderActions />
      {objectMetadata ? (
        <QuickActionFab
          mode="object"
          singular={objectMetadata.nameSingular}
          labelSingular={objectMetadata.labelSingular}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
