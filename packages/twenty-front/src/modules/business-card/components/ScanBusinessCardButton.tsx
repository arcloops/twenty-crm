import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconPhotoUp } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

import {
  SCAN_BUSINESS_CARD_ATTACH_MODAL_ID,
  SCAN_BUSINESS_CARD_MODAL_ID,
  ScanBusinessCardModal,
} from '@/business-card/components/ScanBusinessCardModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';

const StyledWrap = styled.div`
  display: inline-flex;
`;

type ScanBusinessCardButtonProps = {
  existingPersonId?: string;
};

export const ScanBusinessCardButton = ({
  existingPersonId,
}: ScanBusinessCardButtonProps) => {
  const { openModal } = useModal();
  const modalInstanceId = isDefined(existingPersonId)
    ? SCAN_BUSINESS_CARD_ATTACH_MODAL_ID
    : SCAN_BUSINESS_CARD_MODAL_ID;

  return (
    <StyledWrap>
      <Button
        Icon={IconPhotoUp}
        title={
          isDefined(existingPersonId) ? t`Add card` : t`Scan card`
        }
        variant="secondary"
        size="small"
        onClick={() => openModal(modalInstanceId)}
      />
      <ScanBusinessCardModal
        modalInstanceId={modalInstanceId}
        existingPersonId={existingPersonId}
      />
    </StyledWrap>
  );
};
