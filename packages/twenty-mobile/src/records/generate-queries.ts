import { gql } from '@apollo/client';

import {
  COMPOSITE_FIELD_TYPES,
  SIMPLE_FIELD_TYPES,
  UNSUPPORTED_FIELD_TYPES,
  getLabelField,
  getListFieldNames,
  type FieldMetadata,
  type ObjectMetadata,
} from '@/metadata/types';

const capitalize = (value: string) =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

const fieldSelection = (
  field: FieldMetadata,
  relatedObjects: ObjectMetadata[] = [],
): string | null => {
  if (UNSUPPORTED_FIELD_TYPES.has(field.type)) {
    return null;
  }

  if (SIMPLE_FIELD_TYPES.has(field.type)) {
    return field.name;
  }

  switch (field.type) {
    case 'FULL_NAME':
      return `${field.name} { firstName lastName }`;
    case 'EMAILS':
      return `${field.name} { primaryEmail additionalEmails }`;
    case 'PHONES':
      return `${field.name} { primaryPhoneNumber primaryPhoneCountryCode primaryPhoneCallingCode }`;
    case 'LINKS':
      return `${field.name} { primaryLinkUrl primaryLinkLabel }`;
    case 'CURRENCY':
      return `${field.name} { amountMicros currencyCode }`;
    case 'ADDRESS':
      return `${field.name} { addressStreet1 addressCity addressCountry }`;
    case 'ACTOR':
      return `${field.name} { name source }`;
    case 'RELATION': {
      if (field.relation?.type !== 'MANY_TO_ONE') {
        return null;
      }
      const targetSingular =
        field.relation.targetObjectMetadata?.nameSingular;
      const targetObject = relatedObjects.find(
        (object) => object.nameSingular === targetSingular,
      );
      const labelField = targetObject
        ? getLabelField(targetObject)
        : undefined;

      if (labelField?.type === 'FULL_NAME') {
        return `${field.name} { id ${labelField.name} { firstName lastName } }`;
      }
      if (labelField && SIMPLE_FIELD_TYPES.has(labelField.type)) {
        return `${field.name} { id ${labelField.name} }`;
      }
      return `${field.name} { id }`;
    }
    default:
      return null;
  }
};

export const buildNodeSelection = (
  objectMetadata: ObjectMetadata,
  fieldNames: string[],
  relatedObjects: ObjectMetadata[] = [],
): string => {
  const selections = fieldNames
    .map((fieldName) => {
      const field = objectMetadata.fieldsList.find(
        (item) => item.name === fieldName,
      );
      if (!field) {
        return fieldName === 'id' ? 'id' : null;
      }
      return fieldSelection(field, relatedObjects);
    })
    .filter((value): value is string => value !== null);

  return `{ ${Array.from(new Set(['id', ...selections])).join('\n')} }`;
};

export const generateFindManyQuery = (
  objectMetadata: ObjectMetadata,
  relatedObjects: ObjectMetadata[] = [],
) => {
  const fieldNames = getListFieldNames(objectMetadata);
  const node = buildNodeSelection(
    objectMetadata,
    fieldNames,
    relatedObjects,
  );
  const plural = objectMetadata.namePlural;
  const singularCap = capitalize(objectMetadata.nameSingular);
  const pluralCap = capitalize(plural);

  return gql`
    query FindMany${pluralCap}(
      $filter: ${singularCap}FilterInput
      $orderBy: [${singularCap}OrderByInput]
      $lastCursor: String
      $limit: Int
    ) {
      ${plural}(
        filter: $filter
        orderBy: $orderBy
        first: $limit
        after: $lastCursor
      ) {
        edges {
          node ${node}
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  `;
};

export const generateFindOneQuery = (
  objectMetadata: ObjectMetadata,
  relatedObjects: ObjectMetadata[] = [],
) => {
  const fieldNames = objectMetadata.fieldsList
    .filter(
      (field) =>
        field.isActive &&
        !UNSUPPORTED_FIELD_TYPES.has(field.type) &&
        (SIMPLE_FIELD_TYPES.has(field.type) ||
          COMPOSITE_FIELD_TYPES.has(field.type) ||
          (field.type === 'RELATION' &&
            field.relation?.type === 'MANY_TO_ONE') ||
          field.name === 'id'),
    )
    .map((field) => field.name);

  const node = buildNodeSelection(
    objectMetadata,
    ['id', ...fieldNames],
    relatedObjects,
  );
  const singular = objectMetadata.nameSingular;
  const singularCap = capitalize(singular);
  const body = node.replace(/^\{\s*/, '').replace(/\s*\}$/, '');

  return gql`
    query FindOne${singularCap}($objectRecordId: UUID!) {
      ${singular}(filter: { id: { eq: $objectRecordId } }) {
        ${body}
      }
    }
  `;
};

export const generateCreateMutation = (objectMetadata: ObjectMetadata) => {
  const singular = objectMetadata.nameSingular;
  const singularCap = capitalize(singular);
  const labelField = getLabelField(objectMetadata);
  const selection = labelField
    ? buildNodeSelection(objectMetadata, ['id', labelField.name])
    : '{ id }';

  return gql`
    mutation CreateOne${singularCap}($input: ${singularCap}CreateInput!) {
      create${singularCap}(data: $input) ${selection}
    }
  `;
};

export const generateUpdateMutation = (objectMetadata: ObjectMetadata) => {
  const singular = objectMetadata.nameSingular;
  const singularCap = capitalize(singular);
  const labelField = getLabelField(objectMetadata);
  const selection = labelField
    ? buildNodeSelection(objectMetadata, ['id', labelField.name])
    : '{ id }';

  return gql`
    mutation UpdateOne${singularCap}(
      $idToUpdate: UUID!
      $input: ${singularCap}UpdateInput!
    ) {
      update${singularCap}(id: $idToUpdate, data: $input) ${selection}
    }
  `;
};

export const generateDeleteMutation = (objectMetadata: ObjectMetadata) => {
  const singular = objectMetadata.nameSingular;
  const singularCap = capitalize(singular);

  return gql`
    mutation DeleteOne${singularCap}($idToDelete: UUID!) {
      delete${singularCap}(id: $idToDelete) {
        id
      }
    }
  `;
};

export const getRecordTitle = (
  objectMetadata: ObjectMetadata,
  record: Record<string, unknown>,
): string => {
  const labelField = getLabelField(objectMetadata);
  if (!labelField) {
    return 'Untitled';
  }

  const value = record[labelField.name];

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (value && typeof value === 'object') {
    const composite = value as Record<string, unknown>;
    if (labelField.type === 'FULL_NAME') {
      return (
        [composite.firstName, composite.lastName].filter(Boolean).join(' ') ||
        'Untitled'
      );
    }
    if (labelField.type === 'LINKS') {
      return String(
        composite.primaryLinkLabel || composite.primaryLinkUrl || 'Untitled',
      );
    }
    if (labelField.type === 'EMAILS') {
      return String(composite.primaryEmail || 'Untitled');
    }
  }

  return 'Untitled';
};

const SUBTITLE_FIELD_PRIORITY = [
  'SELECT',
  'CURRENCY',
  'RELATION',
  'EMAILS',
  'PHONES',
  'DATE',
  'DATE_TIME',
  'TEXT',
  'NUMBER',
  'NUMERIC',
] as const;

export const getRecordSubtitle = (
  objectMetadata: ObjectMetadata,
  record: Record<string, unknown>,
  relatedObjects: ObjectMetadata[] = [],
): string | undefined => {
  const labelField = getLabelField(objectMetadata);
  const candidates = objectMetadata.fieldsList.filter(
    (field) =>
      field.isActive &&
      !field.isSystem &&
      field.name !== 'id' &&
      field.name !== labelField?.name &&
      record[field.name] !== null &&
      record[field.name] !== undefined &&
      record[field.name] !== '',
  );

  const parts: string[] = [];

  for (const fieldType of SUBTITLE_FIELD_PRIORITY) {
    const field = candidates.find((item) => item.type === fieldType);
    if (!field) {
      continue;
    }

    const formatted = formatFieldValue(
      field,
      record[field.name],
      relatedObjects,
    );

    if (formatted === '—' || formatted === String(record.id)) {
      continue;
    }

    parts.push(formatted);

    if (parts.length >= 2) {
      break;
    }
  }

  return parts.length > 0 ? parts.join(' · ') : undefined;
};

export const formatFieldValue = (
  field: FieldMetadata,
  value: unknown,
  relatedObjects: ObjectMetadata[] = [],
): string => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    if (field.type === 'SELECT' && typeof value === 'string') {
      const option = field.options?.find((item) => item.value === value);
      return option?.label ?? value;
    }

    if (field.type === 'DATE' || field.type === 'DATE_TIME') {
      return String(value).slice(0, 10);
    }

    return String(value);
  }

  if (typeof value === 'object') {
    const composite = value as Record<string, unknown>;
    switch (field.type) {
      case 'FULL_NAME':
        return (
          [composite.firstName, composite.lastName].filter(Boolean).join(' ') ||
          '—'
        );
      case 'EMAILS':
        return String(composite.primaryEmail ?? '—');
      case 'PHONES':
        return String(composite.primaryPhoneNumber ?? '—');
      case 'LINKS':
        return String(
          composite.primaryLinkLabel || composite.primaryLinkUrl || '—',
        );
      case 'CURRENCY':
        return composite.amountMicros
          ? `${(Number(composite.amountMicros) / 1_000_000).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} ${composite.currencyCode ?? ''}`.trim()
          : '—';
      case 'ADDRESS':
        return (
          [
            composite.addressStreet1,
            composite.addressCity,
            composite.addressCountry,
          ]
            .filter(Boolean)
            .join(', ') || '—'
        );
      case 'ACTOR':
        return String(composite.name ?? '—');
      case 'RELATION': {
        const targetSingular =
          field.relation?.targetObjectMetadata?.nameSingular;
        const targetObject = relatedObjects.find(
          (object) => object.nameSingular === targetSingular,
        );
        if (targetObject) {
          return getRecordTitle(targetObject, composite);
        }
        return String(composite.id ?? '—');
      }
      case 'MULTI_SELECT':
        return Array.isArray(value) ? value.join(', ') : '—';
      default:
        return JSON.stringify(value);
    }
  }

  return String(value);
};
