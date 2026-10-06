import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useObjects } from '@/metadata/objects-provider';
import { getEditableFields, getLabelField } from '@/metadata/types';
import { useCreateRecord } from '@/records/use-records';
import { Button, EmptyState, Screen, TextInput, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function NewRecordScreen() {
  const theme = useTheme();
  const { singular } = useLocalSearchParams<{ singular: string }>();
  const { getBySingular } = useObjects();
  const objectMetadata = getBySingular(singular);
  const { createRecord } = useCreateRecord(objectMetadata);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fields = useMemo(() => {
    if (!objectMetadata) {
      return [];
    }
    const labelField = getLabelField(objectMetadata);
    const editable = getEditableFields(objectMetadata).filter(
      (field) =>
        field.type === 'TEXT' ||
        field.type === 'NUMBER' ||
        field.type === 'NUMERIC' ||
        field.type === 'FULL_NAME',
    );

    if (labelField && !editable.find((field) => field.id === labelField.id)) {
      return [labelField, ...editable].slice(0, 6);
    }

    return editable.slice(0, 6);
  }, [objectMetadata]);

  if (!objectMetadata) {
    return (
      <Screen>
        <EmptyState title="Object not found" />
      </Screen>
    );
  }

  const handleCreate = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = values[field.name];
        if (raw === undefined || raw.trim() === '') {
          continue;
        }
        if (field.type === 'FULL_NAME') {
          const [firstName, ...rest] = raw.trim().split(' ');
          data[field.name] = {
            firstName: firstName ?? '',
            lastName: rest.join(' '),
          };
        } else if (field.type === 'NUMBER' || field.type === 'NUMERIC') {
          data[field.name] = Number(raw);
        } else {
          data[field.name] = raw;
        }
      }

      const created = await createRecord(data);
      if (created?.id) {
        router.replace({
          pathname: '/(app)/object/[singular]/[id]',
          params: {
            singular: objectMetadata.nameSingular,
            id: String(created.id),
          },
        });
      } else {
        router.back();
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Failed to create record',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.text.primary }]}>
        New {objectMetadata.labelSingular}
      </Text>

      <View style={styles.fields}>
        {fields.map((field) => (
          <TextInput
            key={field.id}
            label={
              field.type === 'FULL_NAME'
                ? `${field.label} (First Last)`
                : field.label
            }
            value={values[field.name] ?? ''}
            onChangeText={(text) =>
              setValues((current) => ({ ...current, [field.name]: text }))
            }
          />
        ))}
      </View>

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

      <Button
        label="Create"
        loading={isSaving}
        onPress={() => {
          void handleCreate();
        }}
      />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  fields: {
    gap: spacing(3),
  },
});
