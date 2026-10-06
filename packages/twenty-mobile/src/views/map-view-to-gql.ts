import type { FieldMetadata, ObjectMetadata } from '@/metadata/types';
import type {
  GqlVariables,
  ViewFilter,
  ViewSort,
  WorkspaceView,
} from '@/views/types';

const parseFilterValue = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const mapOneFilter = (
  viewFilter: ViewFilter,
  field: FieldMetadata,
): Record<string, unknown> | null => {
  const value = parseFilterValue(viewFilter.value);
  const name = field.name;
  const operand = viewFilter.operand;

  switch (operand) {
    case 'CONTAINS': {
      if (field.type === 'FULL_NAME') {
        const text = String(value ?? '');
        return {
          or: [
            { [name]: { firstName: { ilike: `%${text}%` } } },
            { [name]: { lastName: { ilike: `%${text}%` } } },
          ],
        };
      }
      if (field.type === 'EMAILS') {
        return { [name]: { primaryEmail: { ilike: `%${String(value)}%` } } };
      }
      return { [name]: { ilike: `%${String(value)}%` } };
    }
    case 'DOES_NOT_CONTAIN':
      return { not: { [name]: { ilike: `%${String(value)}%` } } };
    case 'IS': {
      if (field.type === 'SELECT' || field.type === 'MULTI_SELECT') {
        const values = Array.isArray(value) ? value : [value];
        return { [name]: { in: values } };
      }
      if (field.type === 'BOOLEAN') {
        return { [name]: { eq: value === true || value === 'true' } };
      }
      if (field.type === 'RELATION') {
        const ids = Array.isArray(value) ? value : [value];
        const joinColumn = `${name}Id`;
        return { [joinColumn]: { in: ids } };
      }
      if (Array.isArray(value)) {
        return { [name]: { in: value } };
      }
      return { [name]: { eq: value } };
    }
    case 'IS_NOT': {
      if (field.type === 'SELECT' || field.type === 'MULTI_SELECT') {
        const values = Array.isArray(value) ? value : [value];
        return { not: { [name]: { in: values } } };
      }
      return { not: { [name]: { eq: value } } };
    }
    case 'IS_EMPTY':
      return { [name]: { is: 'NULL' } };
    case 'IS_NOT_EMPTY':
    case 'IS_NOT_NULL':
      return { [name]: { is: 'NOT_NULL' } };
    case 'GREATER_THAN_OR_EQUAL':
      return { [name]: { gte: value } };
    case 'LESS_THAN_OR_EQUAL':
      return { [name]: { lte: value } };
    case 'IS_BEFORE':
      return { [name]: { lt: value } };
    case 'IS_AFTER':
      return { [name]: { gt: value } };
    default:
      return null;
  }
};

const mapSort = (
  viewSort: ViewSort,
  field: FieldMetadata,
): Record<string, unknown> => {
  const direction =
    viewSort.direction === 'DESC' ? 'DescNullsLast' : 'AscNullsFirst';
  return { [field.name]: direction };
};

export const mapViewToGqlVariables = (
  view: WorkspaceView,
  objectMetadata: ObjectMetadata,
): GqlVariables => {
  const fieldById = new Map(
    objectMetadata.fieldsList.map((field) => [field.id, field]),
  );

  const skippedOperands: string[] = [];
  const filters: Array<Record<string, unknown>> = [];

  for (const viewFilter of view.viewFilters) {
    const field = fieldById.get(viewFilter.fieldMetadataId);
    if (!field) {
      skippedOperands.push(viewFilter.operand);
      continue;
    }
    const mapped = mapOneFilter(viewFilter, field);
    if (!mapped) {
      skippedOperands.push(viewFilter.operand);
      continue;
    }
    filters.push(mapped);
  }

  const orderBy = view.viewSorts
    .map((viewSort) => {
      const field = fieldById.get(viewSort.fieldMetadataId);
      if (!field) {
        return null;
      }
      return mapSort(viewSort, field);
    })
    .filter((item): item is Record<string, unknown> => item !== null);

  return {
    filter: filters.length === 0 ? undefined : { and: filters },
    orderBy: orderBy.length === 0 ? undefined : orderBy,
    skippedOperands:
      skippedOperands.length === 0
        ? undefined
        : Array.from(new Set(skippedOperands)),
  };
};

export const buildKanbanColumnFilter = (
  groupByField: FieldMetadata,
  fieldValue: string,
  baseFilter?: Record<string, unknown>,
): Record<string, unknown> => {
  const columnFilter =
    fieldValue === '' || fieldValue === null
      ? { [groupByField.name]: { is: 'NULL' } }
      : { [groupByField.name]: { eq: fieldValue } };

  if (!baseFilter) {
    return columnFilter;
  }

  return { and: [baseFilter, columnFilter] };
};

export const getGroupByField = (
  view: WorkspaceView,
  objectMetadata: ObjectMetadata,
): FieldMetadata | undefined => {
  if (!view.mainGroupByFieldMetadataId) {
    return undefined;
  }
  return objectMetadata.fieldsList.find(
    (field) => field.id === view.mainGroupByFieldMetadataId,
  );
};
