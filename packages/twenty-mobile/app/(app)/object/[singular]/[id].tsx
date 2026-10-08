import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CalendarSection,
  EmailsSection,
  NotesSection,
  SectionTabs,
  TasksSection,
  TimelineSection,
  type SectionKey,
} from '@/activities/activity-sections';
import { FilesSection } from '@/files/files-section';
import { useObjects } from '@/metadata/objects-provider';
import { getEditableFields } from '@/metadata/types';
import { FieldEditor } from '@/records/field-editor';
import { getRecordTitle } from '@/records/generate-queries';
import { useRecordDetail } from '@/records/use-records';
import { Button, EmptyState, Screen, Spinner, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function RecordDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { singular, id } = useLocalSearchParams<{
    singular: string;
    id: string;
  }>();
  const { getBySingular } = useObjects();
  const objectMetadata = getBySingular(singular);
  const { record, isLoading, error, updateRecord, deleteRecord } =
    useRecordDetail(objectMetadata, id);
  const [section, setSection] = useState<SectionKey>('fields');

  const editableFields = useMemo(
    () => (objectMetadata ? getEditableFields(objectMetadata) : []),
    [objectMetadata],
  );

  const openComposeSheet = useCallback(() => {
    const isPerson = singular === 'person';

    if (Platform.OS === 'ios') {
      const options = isPerson
        ? ['Cancel', 'Add task', 'Add note', 'Add business card']
        : ['Cancel', 'Add task', 'Add note'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setSection('tasks');
          }
          if (buttonIndex === 2) {
            setSection('notes');
          }
          if (isPerson && buttonIndex === 3) {
            router.push({
              pathname: '/(app)/people/scan-card',
              params: { personId: id },
            });
          }
        },
      );
      return;
    }

    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Add task', onPress: () => setSection('tasks') },
      { text: 'Add note', onPress: () => setSection('notes') },
      ...(isPerson
        ? [
            {
              text: 'Add business card',
              onPress: () => {
                router.push({
                  pathname: '/(app)/people/scan-card',
                  params: { personId: id },
                });
              },
            },
          ]
        : []),
    ];

    Alert.alert('Add', undefined, buttons);
  }, [id, singular]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title:
        objectMetadata && record
          ? getRecordTitle(objectMetadata, record)
          : (objectMetadata?.labelSingular ?? 'Record'),
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={openComposeSheet}
          hitSlop={8}
          style={styles.headerAction}
        >
          <Text style={{ color: theme.accent.primary, fontWeight: '600' }}>
            Add
          </Text>
        </Pressable>
      ),
    });
  }, [
    navigation,
    objectMetadata,
    openComposeSheet,
    record,
    theme.accent.primary,
  ]);

  if (!objectMetadata) {
    return (
      <Screen>
        <EmptyState title="Object not found" />
      </Screen>
    );
  }

  if (isLoading && !record) {
    return <Spinner fullScreen />;
  }

  if (!record) {
    return (
      <Screen>
        <EmptyState title="Record not found" description={error ?? undefined} />
      </Screen>
    );
  }

  const primaryFields = editableFields.slice(0, 6);
  const secondaryFields = editableFields.slice(6);
  const isPerson = singular === 'person';

  return (
    <View
      style={[styles.root, { backgroundColor: theme.background.primary }]}
    >
      <Screen
        edges={['left', 'right']}
        style={styles.screen}
        contentStyle={styles.content}
      >
        <ScrollView
          style={styles.listFlex}
          contentContainerStyle={styles.scroll}
        >
          <Text style={[styles.title, { color: theme.text.primary }]}>
            {getRecordTitle(objectMetadata, record)}
          </Text>
          <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
            {objectMetadata.labelSingular}
          </Text>
          {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

          <SectionTabs active={section} onChange={setSection} />

          {section === 'fields' ? (
            <View style={styles.fields}>
              {primaryFields.map((field) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  value={record[field.name]}
                  onSave={async (nextValue) => {
                    await updateRecord({ [field.name]: nextValue });
                  }}
                />
              ))}
              {secondaryFields.length > 0 ? (
                <View style={styles.secondaryBlock}>
                  <Text
                    style={[
                      styles.secondaryLabel,
                      { color: theme.text.tertiary },
                    ]}
                  >
                    More fields
                  </Text>
                  {secondaryFields.map((field) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      value={record[field.name]}
                      onSave={async (nextValue) => {
                        await updateRecord({ [field.name]: nextValue });
                      }}
                    />
                  ))}
                </View>
              ) : null}
              <Button
                label="Delete"
                variant="ghost"
                onPress={() => {
                  Alert.alert(
                    `Delete ${objectMetadata.labelSingular}?`,
                    'This soft-deletes the record.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          void deleteRecord().then(() => router.back());
                        },
                      },
                    ],
                  );
                }}
              />
            </View>
          ) : null}

          {section === 'timeline' ? (
            <TimelineSection
              objectNameSingular={objectMetadata.nameSingular}
              recordId={id}
            />
          ) : null}
          {section === 'tasks' ? (
            <TasksSection
              objectNameSingular={objectMetadata.nameSingular}
              recordId={id}
            />
          ) : null}
          {section === 'notes' ? (
            <NotesSection
              objectNameSingular={objectMetadata.nameSingular}
              recordId={id}
            />
          ) : null}
          {section === 'files' ? (
            <FilesSection
              objectNameSingular={objectMetadata.nameSingular}
              recordId={id}
            />
          ) : null}
          {section === 'emails' ? (
            <EmailsSection
              objectNameSingular={objectMetadata.nameSingular}
              recordId={id}
            />
          ) : null}
          {section === 'calendar' ? (
            <CalendarSection
              objectNameSingular={objectMetadata.nameSingular}
              recordId={id}
            />
          ) : null}
        </ScrollView>
      </Screen>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.background.primary,
            borderTopColor: theme.border.primary,
            paddingBottom: Math.max(insets.bottom, spacing(2)),
          },
        ]}
      >
        <View style={styles.bottomAction}>
          <Button
            label="Log activity"
            variant="secondary"
            onPress={openComposeSheet}
          />
        </View>
        <View style={styles.bottomAction}>
          {isPerson ? (
            <Button
              label="Scan card"
              onPress={() => {
                router.push({
                  pathname: '/(app)/people/scan-card',
                  params: { personId: id },
                });
              }}
            />
          ) : (
            <Button label="Add task" onPress={() => setSection('tasks')} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { paddingBottom: 0 },
  content: { flex: 1, paddingBottom: 0 },
  listFlex: { flex: 1 },
  scroll: { gap: spacing(3), paddingBottom: spacing(4) },
  title: { fontSize: 24, fontWeight: '700' },
  fields: { gap: spacing(2) },
  secondaryBlock: { gap: spacing(2), marginTop: spacing(2) },
  secondaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerAction: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing(2),
    paddingHorizontal: spacing(3),
    paddingTop: spacing(2),
  },
  bottomAction: { flex: 1 },
});
