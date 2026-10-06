import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useRecordCalendar,
  useRecordEmails,
  useRecordNotes,
  useRecordTasks,
  useTimeline,
} from '@/activities/use-activities';
import {
  Button,
  EmptyState,
  ListRow,
  Spinner,
  TextInput,
  useTheme,
  spacing,
  radius,
} from '@/ui';

type SectionKey =
  | 'fields'
  | 'timeline'
  | 'tasks'
  | 'notes'
  | 'files'
  | 'emails'
  | 'calendar';

type SectionTabsProps = {
  active: SectionKey;
  onChange: (key: SectionKey) => void;
};

const TABS: Array<{ key: SectionKey; label: string }> = [
  { key: 'fields', label: 'Fields' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'notes', label: 'Notes' },
  { key: 'files', label: 'Files' },
  { key: 'emails', label: 'Emails' },
  { key: 'calendar', label: 'Calendar' },
];

export const SectionTabs = ({ active, onChange }: SectionTabsProps) => {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsWrap}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive
                  ? theme.accent.soft
                  : theme.background.secondary,
                borderColor: isActive
                  ? theme.accent.primary
                  : theme.border.primary,
              },
            ]}
          >
            <Text
              style={{
                color: isActive ? theme.accent.primary : theme.text.secondary,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

type ActivitySectionsProps = {
  objectNameSingular: string;
  recordId: string;
  active: SectionKey;
};

export const TimelineSection = ({
  objectNameSingular,
  recordId,
}: Omit<ActivitySectionsProps, 'active'>) => {
  const theme = useTheme();
  const { items, isLoading, error } = useTimeline(
    objectNameSingular,
    recordId,
  );

  if (isLoading && items.length === 0) {
    return <Spinner />;
  }
  if (error) {
    return <Text style={{ color: theme.danger }}>{error}</Text>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="No timeline activity"
        description="Updates on this record will show up here."
      />
    );
  }

  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <ListRow
          key={item.id}
          title={item.name || item.linkedRecordCachedName || 'Activity'}
          subtitle={item.happensAt?.slice(0, 16)?.replace('T', ' ')}
          showChevron={false}
        />
      ))}
    </View>
  );
};

export const TasksSection = ({
  objectNameSingular,
  recordId,
}: Omit<ActivitySectionsProps, 'active'>) => {
  const theme = useTheme();
  const { tasks, isLoading, error, createTask, toggleTaskDone } =
    useRecordTasks(objectNameSingular, recordId);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!draft.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await createTask(draft.trim());
      setDraft('');
    } catch (createError) {
      Alert.alert(
        'Could not create task',
        createError instanceof Error ? createError.message : 'Unknown error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.stack}>
      <TextInput
        label="New task"
        value={draft}
        onChangeText={setDraft}
        placeholder="Task title"
      />
      <Button
        label="Add task"
        loading={isSaving}
        onPress={() => {
          void handleCreate();
        }}
      />
      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading && tasks.length === 0 ? <Spinner /> : null}
      {tasks.map((task) => (
        <ListRow
          key={task.id}
          title={task.title || 'Untitled task'}
          subtitle={`${task.status ?? 'TODO'}${task.dueAt ? ` · ${task.dueAt.slice(0, 10)}` : ''}`}
          rightLabel={task.status === 'DONE' ? 'Done' : 'Todo'}
          onPress={() => {
            void toggleTaskDone(task);
          }}
        />
      ))}
      {!isLoading && tasks.length === 0 ? (
        <EmptyState title="No tasks" description="Add a task linked to this record." />
      ) : null}
    </View>
  );
};

export const NotesSection = ({
  objectNameSingular,
  recordId,
}: Omit<ActivitySectionsProps, 'active'>) => {
  const theme = useTheme();
  const { notes, isLoading, error, createNote, renameNote } = useRecordNotes(
    objectNameSingular,
    recordId,
  );
  const [draft, setDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!draft.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await createNote(draft.trim());
      setDraft('');
    } catch (createError) {
      Alert.alert(
        'Could not create note',
        createError instanceof Error ? createError.message : 'Unknown error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRename = async () => {
    if (!editingNoteId || !editTitle.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await renameNote(editingNoteId, editTitle.trim());
      setEditingNoteId(null);
      setEditTitle('');
    } catch (renameError) {
      Alert.alert(
        'Could not update note',
        renameError instanceof Error ? renameError.message : 'Unknown error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.stack}>
      <TextInput
        label="New note"
        value={draft}
        onChangeText={setDraft}
        placeholder="Note title"
      />
      <Button
        label="Add note"
        loading={isSaving && !editingNoteId}
        onPress={() => {
          void handleCreate();
        }}
      />
      {editingNoteId ? (
        <View style={styles.stack}>
          <TextInput
            label="Edit title"
            value={editTitle}
            onChangeText={setEditTitle}
          />
          <Button
            label="Save note"
            loading={isSaving}
            onPress={() => {
              void handleRename();
            }}
          />
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => {
              setEditingNoteId(null);
              setEditTitle('');
            }}
          />
        </View>
      ) : null}
      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading && notes.length === 0 ? <Spinner /> : null}
      {notes.map((note) => (
        <ListRow
          key={note.id}
          title={note.title || 'Untitled note'}
          subtitle={note.bodyPreview || note.createdAt?.slice(0, 10)}
          onPress={() => {
            setEditingNoteId(note.id);
            setEditTitle(note.title ?? '');
          }}
        />
      ))}
      {!isLoading && notes.length === 0 ? (
        <EmptyState title="No notes" description="Add a note linked to this record." />
      ) : null}
    </View>
  );
};

export const EmailsSection = ({
  objectNameSingular,
  recordId,
}: Omit<ActivitySectionsProps, 'active'>) => {
  const { threads, isLoading, error } = useRecordEmails(
    objectNameSingular,
    recordId,
  );

  if (isLoading && threads.length === 0) {
    return <Spinner />;
  }
  if (error) {
    return (
      <EmptyState
        title="Emails unavailable"
        description="Connect a mailbox in Settings, or try again later."
      />
    );
  }
  if (threads.length === 0) {
    return (
      <EmptyState
        title="No emails"
        description="Synced threads for this record will appear here."
      />
    );
  }

  return (
    <View style={styles.stack}>
      {threads.map((thread) => (
        <ListRow
          key={thread.id}
          title={thread.subject || 'No subject'}
          subtitle={
            thread.lastMessageBody?.slice(0, 80) ||
            thread.lastMessageReceivedAt?.slice(0, 10)
          }
          showChevron={false}
        />
      ))}
    </View>
  );
};

export const CalendarSection = ({
  objectNameSingular,
  recordId,
}: Omit<ActivitySectionsProps, 'active'>) => {
  const { events, isLoading, error } = useRecordCalendar(
    objectNameSingular,
    recordId,
  );

  if (isLoading && events.length === 0) {
    return <Spinner />;
  }
  if (error) {
    return (
      <EmptyState
        title="Calendar unavailable"
        description="Connect a calendar account to see events here."
      />
    );
  }
  if (events.length === 0) {
    return (
      <EmptyState
        title="No events"
        description="Synced calendar events for this record will appear here."
      />
    );
  }

  return (
    <View style={styles.stack}>
      {events.map((event) => (
        <ListRow
          key={event.id}
          title={event.title || 'Untitled event'}
          subtitle={`${event.startsAt?.slice(0, 16)?.replace('T', ' ') ?? ''}${event.location ? ` · ${event.location}` : ''}`}
          showChevron={false}
        />
      ))}
    </View>
  );
};

export type { SectionKey };

const styles = StyleSheet.create({
  tabsWrap: {
    flexDirection: 'row',
    gap: spacing(1.5),
    paddingVertical: spacing(0.5),
  },
  tab: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
  },
  stack: {
    gap: spacing(2),
  },
});
