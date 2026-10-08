import type { FieldMetadata, ObjectMetadata } from '@/metadata/types';

export const hasActiveField = (
  objectMetadata: ObjectMetadata | undefined,
  fieldName: string,
): boolean =>
  objectMetadata?.fieldsList.some(
    (field) => field.name === fieldName && field.isActive,
  ) === true;

export const getActiveField = (
  objectMetadata: ObjectMetadata | undefined,
  fieldName: string,
): FieldMetadata | undefined =>
  objectMetadata?.fieldsList.find(
    (field) => field.name === fieldName && field.isActive,
  );

const CLOSED_STAGE_VALUES = new Set([
  'CUSTOMER',
  'WON',
  'LOST',
  'CLOSED',
  'CLOSED_WON',
  'CLOSED_LOST',
]);

export const getOpenStageValues = (
  objectMetadata: ObjectMetadata | undefined,
): string[] | null => {
  const stageField = getActiveField(objectMetadata, 'stage');
  const options = stageField?.options;
  if (!options || options.length === 0) {
    return null;
  }

  const open = options
    .map((option) => option.value)
    .filter((value) => !CLOSED_STAGE_VALUES.has(value));

  return open.length > 0 ? open : null;
};

export const buildMyOpenTasksFilter = (
  objectMetadata: ObjectMetadata | undefined,
  workspaceMemberId: string | undefined,
): Record<string, unknown> | undefined => {
  if (!objectMetadata) {
    return undefined;
  }

  const parts: Array<Record<string, unknown>> = [];

  if (hasActiveField(objectMetadata, 'status')) {
    parts.push({ not: { status: { eq: 'DONE' } } });
  }

  if (workspaceMemberId && hasActiveField(objectMetadata, 'assignee')) {
    parts.push({ assigneeId: { eq: workspaceMemberId } });
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.length === 1 ? parts[0] : { and: parts };
};

export const buildOverdueTasksFilter = (
  objectMetadata: ObjectMetadata | undefined,
  workspaceMemberId: string | undefined,
  nowIso: string,
): Record<string, unknown> | undefined => {
  if (!hasActiveField(objectMetadata, 'dueAt')) {
    return undefined;
  }

  const base = buildMyOpenTasksFilter(objectMetadata, workspaceMemberId);
  const dueFilter = { dueAt: { lte: nowIso } };

  if (!base) {
    return dueFilter;
  }

  return { and: [base, dueFilter] };
};

export const buildDueSoonTasksFilter = (
  objectMetadata: ObjectMetadata | undefined,
  workspaceMemberId: string | undefined,
  startIso: string,
  endIso: string,
): Record<string, unknown> | undefined => {
  if (!hasActiveField(objectMetadata, 'dueAt')) {
    return undefined;
  }

  const base = buildMyOpenTasksFilter(objectMetadata, workspaceMemberId);
  const dueFilter = {
    and: [{ dueAt: { gte: startIso } }, { dueAt: { lte: endIso } }],
  };

  if (!base) {
    return dueFilter;
  }

  return { and: [base, dueFilter] };
};

export const buildOpenPipelineFilter = (
  objectMetadata: ObjectMetadata | undefined,
): Record<string, unknown> | undefined => {
  const openStages = getOpenStageValues(objectMetadata);
  if (!openStages) {
    return undefined;
  }

  return { stage: { in: openStages } };
};

export const startOfLocalDayIso = (date = new Date()): string => {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  return local.toISOString();
};

export const endOfLocalDayIso = (date = new Date()): string => {
  const local = new Date(date);
  local.setHours(23, 59, 59, 999);
  return local.toISOString();
};

export const addDaysIso = (days: number, from = new Date()): string => {
  const local = new Date(from);
  local.setDate(local.getDate() + days);
  return endOfLocalDayIso(local);
};

export type DueLabelKind = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';

export const getDueLabel = (
  dueAt: string | null | undefined,
  now = new Date(),
): { label: string; kind: DueLabelKind } => {
  if (!dueAt) {
    return { label: 'No due date', kind: 'none' };
  }

  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return { label: 'No due date', kind: 'none' };
  }

  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);
  const startDayAfter = new Date(startToday);
  startDayAfter.setDate(startDayAfter.getDate() + 2);

  if (due < startToday) {
    return { label: 'Overdue', kind: 'overdue' };
  }
  if (due < startTomorrow) {
    return { label: 'Today', kind: 'today' };
  }
  if (due < startDayAfter) {
    return { label: 'Tomorrow', kind: 'tomorrow' };
  }

  return {
    label: due.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    kind: 'upcoming',
  };
};

export const getTimeOfDayGreeting = (now = new Date()): string => {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
};

export const formatTodayHeading = (now = new Date()): string =>
  now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
