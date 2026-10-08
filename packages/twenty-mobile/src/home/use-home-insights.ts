import { useCallback, useEffect, useMemo, useState } from 'react';

import { FIND_TIMELINE_ACTIVITIES } from '@/activities/queries';
import { useAuth } from '@/auth/auth-context';
import {
  addDaysIso,
  buildDueSoonTasksFilter,
  buildMyOpenTasksFilter,
  buildOpenPipelineFilter,
  buildOverdueTasksFilter,
  hasActiveField,
  startOfLocalDayIso,
} from '@/home/home-filters';
import { useObjects } from '@/metadata/objects-provider';
import { useRecordList } from '@/records/use-records';

const FOLLOW_UP_LIMIT = 6;
const PIPELINE_LIMIT = 5;
const NOTES_LIMIT = 5;
const ACTIVITY_LIMIT = 8;

export type HomeActivityItem = {
  id: string;
  name?: string | null;
  happensAt?: string | null;
  linkedRecordCachedName?: string | null;
};

export const useHomeInsights = () => {
  const { user, apolloClients } = useAuth();
  const { getByPlural } = useObjects();

  const workspaceMemberId = user?.workspaceMember?.id;
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const dueSoonStartIso = useMemo(() => startOfLocalDayIso(), []);
  const dueSoonEndIso = useMemo(() => addDaysIso(7), []);

  const tasksMetadata = getByPlural('tasks');
  const opportunitiesMetadata = getByPlural('opportunities');
  const notesMetadata = getByPlural('notes');

  const myOpenTasksFilter = useMemo(
    () => buildMyOpenTasksFilter(tasksMetadata, workspaceMemberId),
    [tasksMetadata, workspaceMemberId],
  );

  const overdueTasksFilter = useMemo(
    () =>
      buildOverdueTasksFilter(tasksMetadata, workspaceMemberId, nowIso),
    [tasksMetadata, workspaceMemberId, nowIso],
  );

  const dueSoonTasksFilter = useMemo(
    () =>
      buildDueSoonTasksFilter(
        tasksMetadata,
        workspaceMemberId,
        dueSoonStartIso,
        dueSoonEndIso,
      ),
    [tasksMetadata, workspaceMemberId, dueSoonStartIso, dueSoonEndIso],
  );

  const openPipelineFilter = useMemo(
    () => buildOpenPipelineFilter(opportunitiesMetadata),
    [opportunitiesMetadata],
  );

  const followUpOrderBy = useMemo(() => {
    if (hasActiveField(tasksMetadata, 'dueAt')) {
      return [{ dueAt: 'AscNullsLast' }];
    }
    return [{ createdAt: 'DescNullsFirst' }];
  }, [tasksMetadata]);

  const pipelineOrderBy = useMemo(() => {
    if (hasActiveField(opportunitiesMetadata, 'updatedAt')) {
      return [{ updatedAt: 'DescNullsFirst' }];
    }
    if (hasActiveField(opportunitiesMetadata, 'closeDate')) {
      return [{ closeDate: 'AscNullsLast' }];
    }
    return undefined;
  }, [opportunitiesMetadata]);

  const notesOrderBy = useMemo(
    () => [{ createdAt: 'DescNullsFirst' }],
    [],
  );

  const followUps = useRecordList(tasksMetadata, {
    filter: myOpenTasksFilter,
    orderBy: followUpOrderBy,
    limit: FOLLOW_UP_LIMIT,
  });

  const overdue = useRecordList(tasksMetadata, {
    filter: overdueTasksFilter,
    limit: 1,
  });

  const dueSoon = useRecordList(tasksMetadata, {
    filter: dueSoonTasksFilter,
    limit: 1,
  });

  const pipeline = useRecordList(opportunitiesMetadata, {
    filter: openPipelineFilter,
    orderBy: pipelineOrderBy,
    limit: PIPELINE_LIMIT,
  });

  const notes = useRecordList(notesMetadata, {
    orderBy: notesOrderBy,
    limit: NOTES_LIMIT,
  });

  const [activities, setActivities] = useState<HomeActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const reloadActivities = useCallback(async () => {
    if (!apolloClients) {
      setActivities([]);
      return;
    }

    setActivitiesLoading(true);
    try {
      const result = await apolloClients.coreClient.query({
        query: FIND_TIMELINE_ACTIVITIES,
        variables: { limit: ACTIVITY_LIMIT },
        fetchPolicy: 'network-only',
      });
      setActivities(
        (result.data?.timelineActivities?.edges ?? []).map(
          (edge: { node: HomeActivityItem }) => edge.node,
        ),
      );
    } catch {
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, [apolloClients]);

  useEffect(() => {
    void reloadActivities();
  }, [reloadActivities]);

  return {
    tasksMetadata,
    opportunitiesMetadata,
    notesMetadata,
    isAssignedToMe: Boolean(workspaceMemberId),
    followUps: followUps.records,
    followUpsTotal: followUps.totalCount,
    followUpsLoading: followUps.isLoading,
    getFollowUpTitle: followUps.getTitle,
    getFollowUpSubtitle: followUps.getSubtitle,
    overdueCount: overdue.totalCount ?? 0,
    dueSoonCount: dueSoon.totalCount ?? 0,
    pipeline: pipeline.records,
    pipelineTotal: pipeline.totalCount,
    pipelineLoading: pipeline.isLoading,
    getPipelineTitle: pipeline.getTitle,
    getPipelineSubtitle: pipeline.getSubtitle,
    notes: notes.records,
    notesTotal: notes.totalCount,
    notesLoading: notes.isLoading,
    getNoteTitle: notes.getTitle,
    getNoteSubtitle: notes.getSubtitle,
    activities,
    activitiesLoading,
    workspaceMembersCount:
      user?.currentWorkspace?.workspaceMembersCount ?? null,
    workspaceDisplayName: user?.currentWorkspace?.displayName ?? null,
  };
};
