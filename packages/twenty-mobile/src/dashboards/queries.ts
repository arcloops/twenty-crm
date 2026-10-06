import { gql } from '@apollo/client';

export const FIND_ONE_PAGE_LAYOUT = gql`
  query FindOnePageLayout($id: String!) {
    getPageLayout(id: $id) {
      id
      name
      type
      tabs {
        id
        title
        position
        widgets {
          id
          title
          type
          objectMetadataId
          configuration {
            ... on AggregateChartConfiguration {
              configurationType
              aggregateFieldMetadataId
              aggregateOperation
              label
              prefix
              suffix
              filter
            }
          }
        }
      }
    }
  }
`;

export type ChartRecordFilter = {
  fieldMetadataId: string;
  operand: string;
  value?: string | null;
  type?: string;
  recordFilterGroupId?: string | null;
  subFieldName?: string | null;
};

export type ChartFilter = {
  recordFilters?: ChartRecordFilter[];
  recordFilterGroups?: Array<{
    id: string;
    logicalOperator: string;
    parentRecordFilterGroupId?: string | null;
  }>;
};

export type AggregateWidgetConfiguration = {
  configurationType?: string | null;
  aggregateFieldMetadataId?: string | null;
  aggregateOperation?: string | null;
  label?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  filter?: ChartFilter | null;
};

export type PageLayoutWidget = {
  id: string;
  title?: string | null;
  type?: string | null;
  objectMetadataId?: string | null;
  configuration?: AggregateWidgetConfiguration | null;
};

export type PageLayoutTab = {
  id: string;
  title?: string | null;
  position?: number | null;
  widgets?: PageLayoutWidget[] | null;
};

export type PageLayout = {
  id: string;
  name?: string | null;
  type?: string | null;
  tabs?: PageLayoutTab[] | null;
};
