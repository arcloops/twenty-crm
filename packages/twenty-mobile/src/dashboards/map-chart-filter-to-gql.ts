import type { ChartFilter } from './queries';
import type { ObjectMetadata } from '@/metadata/types';
import { mapOneFilter } from '@/views/map-view-to-gql';
import type { ViewFilter } from '@/views/types';

// Mirrors twenty-shared computeRecordGqlOperationFilter for AGGREGATE widgets,
// reusing mobile view-filter mapping to avoid pulling Temporal filter deps into RN.

const normalizeOperand = (operand: string): string => {
  if (operand === operand.toUpperCase()) {
    return operand;
  }

  // Chart filters may use camelCase / lowercase ViewFilterOperand values
  const withUnderscores = operand
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toUpperCase();

  return withUnderscores;
};

export const mapChartFilterToGql = ({
  chartFilter,
  objectMetadata,
}: {
  chartFilter?: ChartFilter | null;
  objectMetadata: ObjectMetadata;
}): Record<string, unknown> | undefined => {
  if (!chartFilter) {
    return undefined;
  }

  const recordFilters = chartFilter.recordFilters ?? [];
  if (recordFilters.length === 0) {
    return undefined;
  }

  const fieldById = new Map(
    objectMetadata.fieldsList.map((field) => [field.id, field]),
  );

  const mappedFilters: Array<Record<string, unknown>> = [];

  for (const recordFilter of recordFilters) {
    const field = fieldById.get(recordFilter.fieldMetadataId);
    if (!field) {
      continue;
    }

    const viewFilter: ViewFilter = {
      id: recordFilter.fieldMetadataId,
      fieldMetadataId: recordFilter.fieldMetadataId,
      operand: normalizeOperand(recordFilter.operand),
      value: recordFilter.value ?? '',
      subFieldName: recordFilter.subFieldName,
    };

    const mapped = mapOneFilter(viewFilter, field);
    if (mapped) {
      mappedFilters.push(mapped);
    }
  }

  if (mappedFilters.length === 0) {
    return undefined;
  }

  if (mappedFilters.length === 1) {
    return mappedFilters[0];
  }

  return { and: mappedFilters };
};
