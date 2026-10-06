import { useCallback, useEffect, useMemo, useState } from 'react';
import { gql } from '@apollo/client';

import { useAuth } from '@/auth/auth-context';
import { mapChartFilterToGql } from '@/dashboards/map-chart-filter-to-gql';
import {
  FIND_ONE_PAGE_LAYOUT,
  type AggregateWidgetConfiguration,
  type PageLayout,
  type PageLayoutTab,
  type PageLayoutWidget,
} from '@/dashboards/queries';
import { useObjects } from '@/metadata/objects-provider';
import type { ObjectMetadata } from '@/metadata/types';

const capitalize = (value: string) =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

const resolveAggregateGqlField = ({
  objectMetadata,
  configuration,
}: {
  objectMetadata: ObjectMetadata;
  configuration: AggregateWidgetConfiguration;
}): string => {
  const operation = configuration.aggregateOperation ?? 'COUNT';
  const field = objectMetadata.fieldsList.find(
    (item) => item.id === configuration.aggregateFieldMetadataId,
  );

  if (operation === 'COUNT' || !field) {
    return 'totalCount';
  }

  if (field.type === 'CURRENCY') {
    return `${operation.toLowerCase()}${capitalize(field.name)}AmountMicros`;
  }

  return `${operation.toLowerCase()}${capitalize(field.name)}`;
};

const formatAggregateValue = ({
  rawValue,
  configuration,
  objectMetadata,
}: {
  rawValue: unknown;
  configuration: AggregateWidgetConfiguration;
  objectMetadata: ObjectMetadata;
}): string => {
  if (rawValue === null || rawValue === undefined) {
    return '—';
  }

  const field = objectMetadata.fieldsList.find(
    (item) => item.id === configuration.aggregateFieldMetadataId,
  );
  const operation = configuration.aggregateOperation ?? 'COUNT';
  const numeric =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string' && rawValue.trim().length > 0
        ? Number(rawValue)
        : NaN;

  if (Number.isNaN(numeric)) {
    return String(rawValue);
  }

  if (field?.type === 'CURRENCY' && operation !== 'COUNT') {
    return (numeric / 1_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  if (operation === 'COUNT' || Number.isInteger(numeric)) {
    return numeric.toLocaleString();
  }

  return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const isAggregateWidget = (widget: PageLayoutWidget): boolean => {
  const configuration = widget.configuration;
  return (
    configuration?.configurationType === 'AggregateChartConfiguration' ||
    configuration?.aggregateOperation != null
  );
};

export type AggregateKpi = {
  widgetId: string;
  title: string;
  label?: string | null;
  value: string;
  prefix?: string | null;
  suffix?: string | null;
  error?: string | null;
};

export const usePageLayout = (pageLayoutId: string | undefined) => {
  const { apolloClients } = useAuth();
  const [pageLayout, setPageLayout] = useState<PageLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !pageLayoutId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apolloClients.metadataClient.query<{
        getPageLayout: PageLayout;
      }>({
        query: FIND_ONE_PAGE_LAYOUT,
        variables: { id: pageLayoutId },
        fetchPolicy: 'network-only',
      });
      setPageLayout(result.data.getPageLayout);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load dashboard layout',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, pageLayoutId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { pageLayout, isLoading, error, reload };
};

export const useAggregateWidgets = (
  pageLayout: PageLayout | null,
  selectedTabId?: string | null,
) => {
  const { apolloClients } = useAuth();
  const { objects } = useObjects();
  const [kpis, setKpis] = useState<AggregateKpi[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sortedTabs = useMemo(() => {
    if (!pageLayout?.tabs) {
      return [] as PageLayoutTab[];
    }
    return [...pageLayout.tabs].sort(
      (left, right) => (left.position ?? 0) - (right.position ?? 0),
    );
  }, [pageLayout]);

  const activeTab = useMemo(() => {
    if (sortedTabs.length === 0) {
      return null;
    }
    if (selectedTabId) {
      return (
        sortedTabs.find((tab) => tab.id === selectedTabId) ?? sortedTabs[0]
      );
    }
    return sortedTabs[0];
  }, [selectedTabId, sortedTabs]);

  const tabWidgets = useMemo(
    () => activeTab?.widgets ?? [],
    [activeTab],
  );

  const aggregateWidgets = useMemo(
    () => tabWidgets.filter(isAggregateWidget),
    [tabWidgets],
  );

  const nonAggregateCount = tabWidgets.length - aggregateWidgets.length;

  const reload = useCallback(async () => {
    if (!apolloClients || aggregateWidgets.length === 0) {
      setKpis([]);
      return;
    }

    setIsLoading(true);

    const results = await Promise.all(
      aggregateWidgets.map(async (widget) => {
        const configuration = widget.configuration ?? {};
        const objectMetadata = objects.find(
          (object) => object.id === widget.objectMetadataId,
        );

        if (!objectMetadata) {
          return {
            widgetId: widget.id,
            title: widget.title ?? 'KPI',
            label: configuration.label,
            value: '—',
            prefix: configuration.prefix,
            suffix: configuration.suffix,
            error: 'Unknown object',
          } satisfies AggregateKpi;
        }

        const gqlField = resolveAggregateGqlField({
          objectMetadata,
          configuration,
        });
        const filter = mapChartFilterToGql({
          chartFilter: configuration.filter,
          objectMetadata,
        });

        const query = gql`
          query AggregateWidget_${widget.id.replace(/-/g, '_')}($filter: ${capitalize(objectMetadata.nameSingular)}FilterInput) {
            ${objectMetadata.namePlural}(filter: $filter) {
              ${gqlField}
            }
          }
        `;

        try {
          const result = await apolloClients.coreClient.query({
            query,
            variables: { filter: filter ?? undefined },
            fetchPolicy: 'network-only',
          });
          const connection = result.data?.[objectMetadata.namePlural] as
            | Record<string, unknown>
            | undefined;
          const rawValue = connection?.[gqlField];
          const displayValue = formatAggregateValue({
            rawValue,
            configuration,
            objectMetadata,
          });

          return {
            widgetId: widget.id,
            title: widget.title ?? 'KPI',
            label: configuration.label,
            value: displayValue,
            prefix: configuration.prefix,
            suffix: configuration.suffix,
          } satisfies AggregateKpi;
        } catch (queryError) {
          return {
            widgetId: widget.id,
            title: widget.title ?? 'KPI',
            label: configuration.label,
            value: '—',
            prefix: configuration.prefix,
            suffix: configuration.suffix,
            error:
              queryError instanceof Error
                ? queryError.message
                : 'Aggregate failed',
          } satisfies AggregateKpi;
        }
      }),
    );

    setKpis(results);
    setIsLoading(false);
  }, [aggregateWidgets, apolloClients, objects]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    kpis,
    isLoading,
    aggregateCount: aggregateWidgets.length,
    nonAggregateCount,
    tabs: sortedTabs,
    activeTabId: activeTab?.id ?? null,
    reload,
  };
};
