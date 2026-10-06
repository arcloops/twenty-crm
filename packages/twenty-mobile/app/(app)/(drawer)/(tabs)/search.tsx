import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { router } from 'expo-router';

import { useObjects } from '@/metadata/objects-provider';
import {
  getRecordSubtitle,
  getRecordTitle,
} from '@/records/generate-queries';
import { useSearchRecords } from '@/records/use-records';
import {
  EmptyState,
  ListRow,
  Screen,
  Spinner,
  TextInput,
  useTheme,
} from '@/ui';
import { radius, spacing } from '@/ui/theme';

export default function SearchScreen() {
  const theme = useTheme();
  const { activeObjects, objects } = useObjects();
  const [selectedPlural, setSelectedPlural] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const searchableObjects = useMemo(
    () =>
      activeObjects.filter((object) =>
        ['people', 'companies', 'opportunities', 'tasks', 'notes'].includes(
          object.namePlural,
        ),
      ).length > 0
        ? activeObjects.filter((object) =>
            [
              'people',
              'companies',
              'opportunities',
              'tasks',
              'notes',
            ].includes(object.namePlural),
          )
        : activeObjects.slice(0, 8),
    [activeObjects],
  );

  const selectedObject = useMemo(() => {
    if (selectedPlural) {
      return (
        searchableObjects.find(
          (object) => object.namePlural === selectedPlural,
        ) ?? searchableObjects[0]
      );
    }
    return (
      searchableObjects.find((object) => object.namePlural === 'people') ??
      searchableObjects.find((object) => object.namePlural === 'companies') ??
      searchableObjects[0]
    );
  }, [searchableObjects, selectedPlural]);

  const { records, isLoading, error } = useSearchRecords(
    selectedObject,
    searchTerm,
  );

  return (
    <Screen
      edges={['left', 'right']}
      style={styles.screen}
      contentStyle={styles.content}
    >
      <TextInput
        label="Search"
        placeholder="Type at least 2 characters"
        value={searchTerm}
        onChangeText={setSearchTerm}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chips}
      >
        {searchableObjects.map((item) => {
          const isSelected = selectedObject?.id === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedPlural(item.namePlural)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.accent.soft
                    : theme.background.secondary,
                  borderColor: isSelected
                    ? theme.accent.primary
                    : theme.border.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected
                    ? theme.accent.primary
                    : theme.text.primary,
                  fontWeight: '500',
                  fontSize: 13,
                }}
              >
                {item.labelPlural}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading ? <Spinner /> : null}

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        style={styles.listFlex}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading && searchTerm.trim().length >= 2 ? (
            <EmptyState title="No matches" description="Try another term." />
          ) : (
            <EmptyState
              title="Search records"
              description="Pick an object and search by name."
            />
          )
        }
        renderItem={({ item }) => (
          <ListRow
            title={
              selectedObject
                ? getRecordTitle(selectedObject, item)
                : 'Untitled'
            }
            subtitle={
              selectedObject
                ? getRecordSubtitle(selectedObject, item, objects)
                : undefined
            }
            onPress={() => {
              if (!selectedObject) {
                return;
              }
              router.push({
                pathname: '/(app)/object/[singular]/[id]',
                params: {
                  singular: selectedObject.nameSingular,
                  id: String(item.id),
                },
              });
            }}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { flex: 1, paddingBottom: 0, gap: spacing(2) },
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chips: {
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(1),
  },
  chip: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  listFlex: { flex: 1 },
  list: {
    gap: spacing(2),
    paddingBottom: spacing(8),
  },
});
