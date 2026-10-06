import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useObjects } from '@/metadata/objects-provider';
import type { FieldMetadata } from '@/metadata/types';
import { formatFieldValue } from '@/records/generate-queries';
import { Button, TextInput, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

type FieldEditorProps = {
  field: FieldMetadata;
  value: unknown;
  onSave: (nextValue: unknown) => Promise<void>;
};

export const FieldEditor = ({ field, value, onSave }: FieldEditorProps) => {
  const theme = useTheme();
  const { objects } = useObjects();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(
    () => formatFieldValue(field, value, objects),
    [field, value, objects],
  );

  const relationRecord =
    field.type === 'RELATION' && value && typeof value === 'object'
      ? (value as { id?: string })
      : null;
  const relationTargetSingular =
    field.relation?.targetObjectMetadata?.nameSingular;

  const canEdit =
    field.type === 'TEXT' ||
    field.type === 'NUMBER' ||
    field.type === 'NUMERIC' ||
    field.type === 'BOOLEAN' ||
    field.type === 'SELECT';

  const startEdit = () => {
    if (!canEdit) {
      return;
    }
    if (field.type === 'BOOLEAN') {
      return;
    }
    setDraft(value === null || value === undefined ? '' : String(value));
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      let nextValue: unknown = draft;
      if (field.type === 'NUMBER' || field.type === 'NUMERIC') {
        nextValue = draft.trim() === '' ? null : Number(draft);
      }
      await onSave(nextValue);
      setIsEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (
    field.type === 'RELATION' &&
    field.relation?.type === 'MANY_TO_ONE' &&
    relationRecord?.id &&
    relationTargetSingular
  ) {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(app)/object/[singular]/[id]',
            params: {
              singular: relationTargetSingular,
              id: relationRecord.id as string,
            },
          })
        }
        style={[
          styles.row,
          {
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.primary,
          },
        ]}
      >
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>
            {field.label}
          </Text>
          <Text style={[styles.value, { color: theme.accent.primary }]}>
            {display}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.text.tertiary}
        />
      </Pressable>
    );
  }

  if (field.type === 'BOOLEAN') {
    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.primary,
          },
        ]}
      >
        <Text style={[styles.label, { color: theme.text.secondary }]}>
          {field.label}
        </Text>
        <Switch
          value={Boolean(value)}
          onValueChange={(next) => {
            void onSave(next);
          }}
        />
      </View>
    );
  }

  if (isEditing) {
    return (
      <View
        style={[
          styles.editor,
          {
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.primary,
          },
        ]}
      >
        <TextInput
          label={field.label}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          error={error ?? undefined}
        />
        <View style={styles.actions}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => setIsEditing(false)}
            style={styles.actionButton}
          />
          <Button
            label="Save"
            loading={isSaving}
            onPress={() => {
              void handleSave();
            }}
            style={styles.actionButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.primary,
        },
      ]}
    >
      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: theme.text.secondary }]}>
          {field.label}
        </Text>
        <Text style={[styles.value, { color: theme.text.primary }]}>
          {display}
        </Text>
      </View>
      {canEdit ? (
        <Button label="Edit" variant="ghost" onPress={startEdit} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing(2),
    padding: spacing(3),
  },
  editor: {
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing(2),
    padding: spacing(3),
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  actionButton: {
    flex: 1,
  },
});
