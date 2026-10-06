export type FieldMetadata = {
  id: string;
  type: string;
  name: string;
  label: string;
  isActive: boolean;
  isSystem: boolean;
  isNullable: boolean;
  defaultValue?: unknown;
  options?: Array<{
    id?: string;
    value: string;
    label: string;
    color?: string;
    position?: number;
  }> | null;
  relation?: {
    type: string;
    targetObjectMetadata?: {
      id: string;
      nameSingular: string;
      namePlural: string;
    } | null;
  } | null;
};

export type ObjectMetadata = {
  id: string;
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  icon?: string | null;
  isActive: boolean;
  isSystem: boolean;
  isUICreatable?: boolean;
  labelIdentifierFieldMetadataId?: string | null;
  fieldsList: FieldMetadata[];
};

export const SIMPLE_FIELD_TYPES = new Set([
  'TEXT',
  'NUMBER',
  'NUMERIC',
  'BOOLEAN',
  'DATE',
  'DATE_TIME',
  'SELECT',
  'MULTI_SELECT',
  'RATING',
  'UUID',
]);

export const COMPOSITE_FIELD_TYPES = new Set([
  'FULL_NAME',
  'EMAILS',
  'PHONES',
  'LINKS',
  'CURRENCY',
  'ADDRESS',
  'ACTOR',
]);

// Must never be selected as bare GraphQL scalars
export const UNSUPPORTED_FIELD_TYPES = new Set([
  'RICH_TEXT',
  'RICH_TEXT_V2',
  'FILES',
  'TS_VECTOR',
  'MORPH_RELATION',
  'RAW_JSON',
  'ARRAY',
  'POSITION',
]);

export const isQueryableField = (field: FieldMetadata): boolean =>
  !UNSUPPORTED_FIELD_TYPES.has(field.type) &&
  (SIMPLE_FIELD_TYPES.has(field.type) ||
    COMPOSITE_FIELD_TYPES.has(field.type) ||
    (field.type === 'RELATION' && field.relation?.type === 'MANY_TO_ONE'));

export const getLabelField = (
  objectMetadata: ObjectMetadata,
): FieldMetadata | undefined => {
  if (objectMetadata.labelIdentifierFieldMetadataId) {
    const byId = objectMetadata.fieldsList.find(
      (field) => field.id === objectMetadata.labelIdentifierFieldMetadataId,
    );
    if (byId && isQueryableField(byId)) {
      return byId;
    }
  }

  return (
    objectMetadata.fieldsList.find(
      (field) =>
        field.name === 'name' && field.isActive && isQueryableField(field),
    ) ??
    objectMetadata.fieldsList.find(
      (field) =>
        field.isActive &&
        !field.isSystem &&
        field.type === 'TEXT' &&
        isQueryableField(field),
    )
  );
};

export const getEditableFields = (
  objectMetadata: ObjectMetadata,
): FieldMetadata[] =>
  objectMetadata.fieldsList.filter(
    (field) =>
      field.isActive &&
      !field.isSystem &&
      field.name !== 'id' &&
      field.name !== 'createdAt' &&
      field.name !== 'updatedAt' &&
      field.name !== 'deletedAt' &&
      !UNSUPPORTED_FIELD_TYPES.has(field.type) &&
      (SIMPLE_FIELD_TYPES.has(field.type) ||
        COMPOSITE_FIELD_TYPES.has(field.type) ||
        (field.type === 'RELATION' &&
          field.relation?.type === 'MANY_TO_ONE')),
  );

const LIST_SUBTITLE_FIELD_PRIORITY = [
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

export const getListFieldNames = (
  objectMetadata: ObjectMetadata,
): string[] => {
  const labelField = getLabelField(objectMetadata);
  const names = new Set<string>(['id']);

  if (labelField) {
    names.add(labelField.name);
  }

  const candidates = objectMetadata.fieldsList.filter(
    (field) =>
      field.isActive &&
      !field.isSystem &&
      field.name !== labelField?.name &&
      field.name !== 'id' &&
      isQueryableField(field),
  );

  for (const fieldType of LIST_SUBTITLE_FIELD_PRIORITY) {
    for (const field of candidates) {
      if (field.type === fieldType && names.size < 6) {
        names.add(field.name);
      }
    }
  }

  return Array.from(names);
};

export const buildSearchFilter = (
  objectMetadata: ObjectMetadata,
  searchTerm: string,
): Record<string, unknown> | null => {
  const trimmed = searchTerm.trim();
  if (trimmed.length < 2) {
    return null;
  }

  const labelField = getLabelField(objectMetadata);
  if (!labelField) {
    return null;
  }

  const pattern = `%${trimmed}%`;

  if (labelField.type === 'TEXT' || labelField.type === 'SELECT') {
    return { [labelField.name]: { ilike: pattern } };
  }

  if (labelField.type === 'FULL_NAME') {
    return {
      or: [
        { [labelField.name]: { firstName: { ilike: pattern } } },
        { [labelField.name]: { lastName: { ilike: pattern } } },
      ],
    };
  }

  if (labelField.type === 'EMAILS') {
    return {
      [labelField.name]: { primaryEmail: { ilike: pattern } },
    };
  }

  // Composite / other — caller should fall back to client-side filter
  return null;
};
