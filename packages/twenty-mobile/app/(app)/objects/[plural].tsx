import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { ObjectRecordsPanel } from '@/records/object-records-panel';

export default function ObjectListScreen() {
  const { plural } = useLocalSearchParams<{ plural: string }>();

  return <ObjectRecordsPanel namePlural={plural} />;
}
