export type ViewFilter = {
  id: string;
  fieldMetadataId: string;
  operand: string;
  value: string;
  subFieldName?: string | null;
};

export type ViewSort = {
  id: string;
  fieldMetadataId: string;
  direction: 'ASC' | 'DESC' | string;
  subFieldName?: string | null;
};

export type ViewGroup = {
  id: string;
  fieldValue: string;
  isVisible: boolean;
  position: number;
};

export type WorkspaceView = {
  id: string;
  name: string;
  objectMetadataId: string;
  type: string;
  key?: string | null;
  icon?: string | null;
  position?: number | null;
  isActive?: boolean | null;
  mainGroupByFieldMetadataId?: string | null;
  viewFilters: ViewFilter[];
  viewSorts: ViewSort[];
  viewGroups: ViewGroup[];
};

export type GqlVariables = {
  filter?: Record<string, unknown>;
  orderBy?: Array<Record<string, unknown>>;
  skippedOperands?: string[];
};
