import { ScanBusinessCardButton } from '@/business-card/components/ScanBusinessCardButton';
import { RecordIndexCommandMenu } from '@/command-menu-item/components/RecordIndexCommandMenu';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { contextStoreNumberOfSelectedRecordsComponentState } from '@/context-store/states/contextStoreNumberOfSelectedRecordsComponentState';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { RecordIndexPageHeaderTitle } from '@/object-record/record-index/components/RecordIndexPageHeaderTitle';
import { RecordIndexPageHeaderIcon } from '@/object-record/record-index/components/RecordIndexPageHeaderIcon';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { SidePanelPageTitleSyncEffect } from '@/side-panel/components/SidePanelPageTitleSyncEffect';
import { SidePanelToggleButton } from '@/side-panel/components/SidePanelToggleButton';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

export const RecordIndexPageHeader = () => {
  const workspaceSurface = useWorkspaceSurface();

  const { findObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();

  const contextStoreNumberOfSelectedRecords = useAtomComponentStateValue(
    contextStoreNumberOfSelectedRecordsComponentState,
  );

  const { objectNamePlural } = useRecordIndexContextOrThrow();

  const objectMetadataItem =
    findObjectMetadataItemByNamePlural(objectNamePlural);

  const label = objectMetadataItem?.labelPlural ?? objectNamePlural;

  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
  );
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  const showScanBusinessCard = objectNamePlural === 'people';

  return (
    <>
      <SidePanelPageTitleSyncEffect pageTitle={label} />
      <PageCardHeader
        icon={
          <RecordIndexPageHeaderIcon objectMetadataItem={objectMetadataItem} />
        }
        title={
          <RecordIndexPageHeaderTitle
            label={label}
            numberOfSelectedRecords={contextStoreNumberOfSelectedRecords}
          />
        }
        actionButton={
          isDefined(contextStoreCurrentViewId) ? (
            <StyledActions>
              {showScanBusinessCard ? <ScanBusinessCardButton /> : null}
              <RecordIndexCommandMenu />
              {!isLayoutCustomizationModeEnabled &&
                workspaceSurface.type === 'main' && <SidePanelToggleButton />}
            </StyledActions>
          ) : undefined
        }
      />
    </>
  );
};
