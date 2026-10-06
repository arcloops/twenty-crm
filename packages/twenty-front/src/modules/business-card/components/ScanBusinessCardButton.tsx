import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconPhotoUp } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import {
  SCAN_BUSINESS_CARD_ATTACH_DIALOG_ID,
  SCAN_BUSINESS_CARD_DIALOG_ID,
  ScanBusinessCardModal,
} from '@/business-card/components/ScanBusinessCardModal';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';

const StyledWrap = styled.div`
  display: inline-flex;
`;

type ScanBusinessCardButtonProps = {
  existingPersonId?: string;
};

export const ScanBusinessCardButton = ({
  existingPersonId,
}: ScanBusinessCardButtonProps) => {
  const { openDialog } = useDialog();
  const dialogId = isDefined(existingPersonId)
    ? SCAN_BUSINESS_CARD_ATTACH_DIALOG_ID
    : SCAN_BUSINESS_CARD_DIALOG_ID;

  return (
    <StyledWrap>
      <Button
        startIcon={<IconPhotoUp />}
        variant="outline"
        size="sm"
        onClick={() => openDialog(dialogId)}
      >
        {isDefined(existingPersonId) ? t`Add card` : t`Scan card`}
      </Button>
      <ScanBusinessCardModal
        dialogId={dialogId}
        existingPersonId={existingPersonId}
      />
    </StyledWrap>
  );
};
