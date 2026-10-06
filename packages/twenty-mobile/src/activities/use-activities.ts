import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import {
  CREATE_NOTE,
  CREATE_NOTE_TARGET,
  CREATE_TASK,
  CREATE_TASK_TARGET,
  FIND_NOTE_TARGETS,
  FIND_TASK_TARGETS,
  FIND_TIMELINE_ACTIVITIES,
  GET_TIMELINE_CALENDAR_EVENTS,
  GET_TIMELINE_THREADS,
  UPDATE_NOTE,
  UPDATE_TASK,
  getTargetFieldIdName,
} from '@/activities/queries';

export type TimelineItem = {
  id: string;
  name?: string | null;
  happensAt?: string | null;
  linkedRecordCachedName?: string | null;
};

export type TaskItem = {
  id: string;
  title?: string | null;
  status?: string | null;
  dueAt?: string | null;
};

export type NoteItem = {
  id: string;
  title?: string | null;
  createdAt?: string | null;
  bodyPreview?: string | null;
};

export type EmailThreadItem = {
  id: string;
  subject?: string | null;
  lastMessageBody?: string | null;
  lastMessageReceivedAt?: string | null;
  numberOfMessagesInThread?: number | null;
};

export type CalendarEventItem = {
  id: string;
  title?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
};

export const useTimeline = (
  objectNameSingular: string | undefined,
  recordId: string | undefined,
) => {
  const { apolloClients } = useAuth();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !objectNameSingular || !recordId) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const targetField = getTargetFieldIdName(objectNameSingular);
      const result = await apolloClients.coreClient.query({
        query: FIND_TIMELINE_ACTIVITIES,
        variables: {
          limit: 40,
          filter: { [targetField]: { eq: recordId } },
        },
        fetchPolicy: 'network-only',
      });
      setItems(
        (result.data?.timelineActivities?.edges ?? []).map(
          (edge: { node: TimelineItem }) => edge.node,
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load timeline',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, objectNameSingular, recordId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, isLoading, error, reload };
};

export const useRecordTasks = (
  objectNameSingular: string | undefined,
  recordId: string | undefined,
) => {
  const { apolloClients } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !objectNameSingular || !recordId) {
      setTasks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const targetField = getTargetFieldIdName(objectNameSingular);
      const result = await apolloClients.coreClient.query({
        query: FIND_TASK_TARGETS,
        variables: {
          limit: 50,
          filter: { [targetField]: { eq: recordId } },
        },
        fetchPolicy: 'network-only',
      });
      const next = (result.data?.taskTargets?.edges ?? [])
        .map((edge: { node: { task?: TaskItem | null } }) => edge.node.task)
        .filter(Boolean) as TaskItem[];
      setTasks(next);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load tasks',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, objectNameSingular, recordId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createTask = useCallback(
    async (title: string) => {
      if (!apolloClients || !objectNameSingular || !recordId) {
        return;
      }
      const created = await apolloClients.coreClient.mutate({
        mutation: CREATE_TASK,
        variables: {
          input: {
            title,
            status: 'TODO',
          },
        },
      });
      const taskId = created.data?.createTask?.id;
      if (!taskId) {
        throw new Error('Failed to create task');
      }
      const targetField = getTargetFieldIdName(objectNameSingular);
      await apolloClients.coreClient.mutate({
        mutation: CREATE_TASK_TARGET,
        variables: {
          input: {
            taskId,
            [targetField]: recordId,
          },
        },
      });
      await reload();
    },
    [apolloClients, objectNameSingular, recordId, reload],
  );

  const toggleTaskDone = useCallback(
    async (task: TaskItem) => {
      if (!apolloClients) {
        return;
      }
      const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
      await apolloClients.coreClient.mutate({
        mutation: UPDATE_TASK,
        variables: {
          idToUpdate: task.id,
          input: { status: nextStatus },
        },
      });
      await reload();
    },
    [apolloClients, reload],
  );

  return { tasks, isLoading, error, reload, createTask, toggleTaskDone };
};

export const useRecordNotes = (
  objectNameSingular: string | undefined,
  recordId: string | undefined,
) => {
  const { apolloClients } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !objectNameSingular || !recordId) {
      setNotes([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const targetField = getTargetFieldIdName(objectNameSingular);
      const result = await apolloClients.coreClient.query({
        query: FIND_NOTE_TARGETS,
        variables: {
          limit: 50,
          filter: { [targetField]: { eq: recordId } },
        },
        fetchPolicy: 'network-only',
      });
      const next = (result.data?.noteTargets?.edges ?? []).map(
        (edge: {
          node: {
            note?: {
              id: string;
              title?: string | null;
              createdAt?: string | null;
              bodyV2?: { markdown?: string | null } | null;
            } | null;
          };
        }) => {
          const note = edge.node.note;
          if (!note) {
            return null;
          }
          return {
            id: note.id,
            title: note.title,
            createdAt: note.createdAt,
            bodyPreview: note.bodyV2?.markdown?.slice(0, 120) ?? null,
          } satisfies NoteItem;
        },
      );
      setNotes(next.filter(Boolean) as NoteItem[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load notes',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, objectNameSingular, recordId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createNote = useCallback(
    async (title: string) => {
      if (!apolloClients || !objectNameSingular || !recordId) {
        return;
      }
      const created = await apolloClients.coreClient.mutate({
        mutation: CREATE_NOTE,
        variables: {
          input: { title },
        },
      });
      const noteId = created.data?.createNote?.id;
      if (!noteId) {
        throw new Error('Failed to create note');
      }
      const targetField = getTargetFieldIdName(objectNameSingular);
      await apolloClients.coreClient.mutate({
        mutation: CREATE_NOTE_TARGET,
        variables: {
          input: {
            noteId,
            [targetField]: recordId,
          },
        },
      });
      await reload();
    },
    [apolloClients, objectNameSingular, recordId, reload],
  );

  const renameNote = useCallback(
    async (noteId: string, title: string) => {
      if (!apolloClients) {
        return;
      }
      await apolloClients.coreClient.mutate({
        mutation: UPDATE_NOTE,
        variables: {
          idToUpdate: noteId,
          input: { title },
        },
      });
      await reload();
    },
    [apolloClients, reload],
  );

  return { notes, isLoading, error, reload, createNote, renameNote };
};

export const useRecordEmails = (
  objectNameSingular: string | undefined,
  recordId: string | undefined,
) => {
  const { apolloClients } = useAuth();
  const [threads, setThreads] = useState<EmailThreadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !objectNameSingular || !recordId) {
      setThreads([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await apolloClients.coreClient.query({
        query: GET_TIMELINE_THREADS,
        variables: {
          objectNameSingular,
          recordId,
          page: 1,
          pageSize: 20,
        },
        fetchPolicy: 'network-only',
      });
      setThreads(
        result.data?.getTimelineThreadsFromObjectRecord?.timelineThreads ?? [],
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load emails',
      );
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, objectNameSingular, recordId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { threads, isLoading, error, reload };
};

export const useRecordCalendar = (
  objectNameSingular: string | undefined,
  recordId: string | undefined,
) => {
  const { apolloClients } = useAuth();
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !objectNameSingular || !recordId) {
      setEvents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await apolloClients.coreClient.query({
        query: GET_TIMELINE_CALENDAR_EVENTS,
        variables: {
          objectNameSingular,
          recordId,
          page: 1,
          pageSize: 20,
        },
        fetchPolicy: 'network-only',
      });
      setEvents(
        result.data?.getTimelineCalendarEventsFromObjectRecord
          ?.timelineCalendarEvents ?? [],
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load calendar',
      );
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, objectNameSingular, recordId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { events, isLoading, error, reload };
};
