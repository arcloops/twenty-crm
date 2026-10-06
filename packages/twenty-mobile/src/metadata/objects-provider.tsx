import React, { createContext, useContext } from 'react';

import { useObjectsMetadata } from '@/metadata/use-objects';
import type { ObjectMetadata } from '@/metadata/types';

type ObjectsContextValue = {
  objects: ObjectMetadata[];
  activeObjects: ObjectMetadata[];
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  reload: () => Promise<void>;
  getByPlural: (namePlural: string) => ObjectMetadata | undefined;
  getBySingular: (nameSingular: string) => ObjectMetadata | undefined;
};

const ObjectsContext = createContext<ObjectsContextValue | null>(null);

export const ObjectsMetadataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value = useObjectsMetadata();

  return (
    <ObjectsContext.Provider value={value}>{children}</ObjectsContext.Provider>
  );
};

export const useObjects = () => {
  const context = useContext(ObjectsContext);
  if (!context) {
    throw new Error('useObjects must be used within ObjectsMetadataProvider');
  }
  return context;
};
