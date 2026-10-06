import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useCallback, useRef, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined, isNonEmptyString } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { IconUpload } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { useUploadAttachmentFile } from '@/activities/files/hooks/useUploadAttachmentFile';
import {
  EXTRACT_PERSON_FROM_BUSINESS_CARD,
  type BusinessCardExtraction,
} from '@/business-card/graphql/extractPersonFromBusinessCard';
import {
  buildPersonInputFromBusinessCardDraft,
  type ExistingPersonForBusinessCard,
} from '@/business-card/utils/build-person-input-from-business-card-draft';
import { useDirectFileUpload } from '@/file/hooks/useDirectFileUpload';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { TextInput } from '@/ui/input/components/TextInput';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { FileFolder } from '~/generated-metadata/graphql';

export const SCAN_BUSINESS_CARD_DIALOG_ID = 'scan-business-card-dialog';
export const SCAN_BUSINESS_CARD_ATTACH_DIALOG_ID =
  'scan-business-card-attach-dialog';

// Keep legacy aliases for any external references
export const SCAN_BUSINESS_CARD_MODAL_ID = SCAN_BUSINESS_CARD_DIALOG_ID;
export const SCAN_BUSINESS_CARD_ATTACH_MODAL_ID =
  SCAN_BUSINESS_CARD_ATTACH_DIALOG_ID;

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledWarning = styled.p`
  color: ${themeCssVariables.color.orange};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledError = styled.p`
  color: ${themeCssVariables.color.red};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledHiddenFileInput = styled.input`
  display: none;
`;

const StyledSides = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 1fr 1fr;
`;

const StyledSide = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSideTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledPreview = styled.img`
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 120px;
  object-fit: cover;
  width: 100%;
`;

const StyledPreviewPlaceholder = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  height: 120px;
  justify-content: center;
`;

type DraftState = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  website: string;
  companyName: string;
  companyId: string | null;
  warnings: string[];
};

const emptyDraft = (): DraftState => ({
  firstName: '',
  lastName: '',
  jobTitle: '',
  email: '',
  phone: '',
  website: '',
  companyName: '',
  companyId: null,
  warnings: [],
});

const toDraft = (extraction: BusinessCardExtraction): DraftState => ({
  firstName: extraction.firstName ?? '',
  lastName: extraction.lastName ?? '',
  jobTitle: extraction.jobTitle ?? '',
  email: extraction.emails[0] ?? '',
  phone: extraction.phones[0] ?? '',
  website: extraction.website ?? '',
  companyName: extraction.companyName ?? '',
  companyId: extraction.companyId,
  warnings: extraction.warnings,
});

type CardSide = 'front' | 'back';

type ScanBusinessCardModalProps = {
  dialogId?: string;
  existingPersonId?: string;
};

export const ScanBusinessCardModal = ({
  dialogId = SCAN_BUSINESS_CARD_DIALOG_ID,
  existingPersonId,
}: ScanBusinessCardModalProps) => {
  const { closeDialog } = useDialog();
  const { enqueueToast } = useToast();
  const { uploadFile } = useDirectFileUpload();
  const { uploadAttachmentFile } = useUploadAttachmentFile();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const isAttachingToExisting = isDefined(existingPersonId);
  const { record: existingPerson } = useFindOneRecord({
    objectNameSingular: 'person',
    objectRecordId: existingPersonId,
    skip: !isAttachingToExisting,
  });
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'person',
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const [extractPersonFromBusinessCard] = useMutation<{
    extractPersonFromBusinessCard: BusinessCardExtraction;
  }>(EXTRACT_PERSON_FROM_BUSINESS_CARD);

  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);

  const revokePreview = (url: string | null) => {
    if (isDefined(url)) {
      URL.revokeObjectURL(url);
    }
  };

  const reset = useCallback(() => {
    setDraft(emptyDraft());
    setStep('upload');
    setError(null);
    setIsWorking(false);
    setFrontFile(null);
    setBackFile(null);
    setFrontPreviewUrl((current) => {
      revokePreview(current);
      return null;
    });
    setBackPreviewUrl((current) => {
      revokePreview(current);
      return null;
    });
  }, []);

  const handleClose = () => {
    reset();
    closeDialog(dialogId);
  };

  const handleSideSelected = (
    side: CardSide,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (side === 'front') {
      setFrontPreviewUrl((current) => {
        revokePreview(current);
        return isDefined(file) ? URL.createObjectURL(file) : null;
      });
      setFrontFile(file);
    } else {
      setBackPreviewUrl((current) => {
        revokePreview(current);
        return isDefined(file) ? URL.createObjectURL(file) : null;
      });
      setBackFile(file);
    }
  };

  const attachCardImages = async (personId: string) => {
    const cardFiles = [frontFile, backFile].filter(isDefined);
    for (const file of cardFiles) {
      await uploadAttachmentFile(file, {
        id: personId,
        targetObjectNameSingular: CoreObjectNameSingular.Person,
      });
    }
  };

  const handleScan = async () => {
    if (!isDefined(frontFile)) {
      setError(t`Add a front image of the business card first`);
      return;
    }

    setIsWorking(true);
    setError(null);

    try {
      const files = [frontFile, backFile].filter(isDefined);
      const fileIds: string[] = [];

      for (const file of files) {
        const uploaded = await uploadFile(file, {
          fileFolder: FileFolder.AgentChat,
        });
        fileIds.push(uploaded.id);
      }

      const result = await extractPersonFromBusinessCard({
        variables: { fileIds },
      });

      const extraction = result.data?.extractPersonFromBusinessCard;
      if (!isDefined(extraction)) {
        throw new Error('Empty extraction response');
      }

      setDraft(toDraft(extraction));
      setStep('review');
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : t`Failed to scan business card`,
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleAttachOnly = async () => {
    if (!isDefined(existingPersonId)) {
      return;
    }

    if (!isDefined(frontFile)) {
      setError(t`Add a front image of the business card first`);
      return;
    }

    setIsWorking(true);
    setError(null);

    try {
      await attachCardImages(existingPersonId);
      enqueueToast({
        variant: 'success',
        children: t`Business card images attached`,
      });
      handleClose();
    } catch (attachError) {
      const message =
        attachError instanceof Error
          ? attachError.message
          : t`Failed to attach business card`;
      setError(message);
      enqueueToast({ variant: 'error', children: message });
    } finally {
      setIsWorking(false);
    }
  };

  const handleSave = async () => {
    setIsWorking(true);
    setError(null);

    try {
      const personInput = buildPersonInputFromBusinessCardDraft(
        {
          firstName: draft.firstName,
          lastName: draft.lastName,
          jobTitle: draft.jobTitle,
          email: draft.email,
          phone: draft.phone,
          website: draft.website,
          companyId: draft.companyId,
        },
        isAttachingToExisting
          ? {
              emptyFieldsOnly: true,
              existingPerson:
                existingPerson as ExistingPersonForBusinessCard | undefined,
            }
          : undefined,
      );

      if (isAttachingToExisting && isDefined(existingPersonId)) {
        if (Object.keys(personInput).length > 0) {
          await updateOneRecord({
            objectNameSingular: 'person',
            idToUpdate: existingPersonId,
            updateOneRecordInput: personInput as Partial<ObjectRecord>,
          });
        }

        await attachCardImages(existingPersonId);

        enqueueToast({
          variant: 'success',
          children: t`Business card added to person`,
        });
        handleClose();
        return;
      }

      const created = await createOneRecord(
        personInput as Partial<ObjectRecord>,
      );
      const personId = created?.id;
      if (isDefined(personId)) {
        await attachCardImages(personId);
      }

      enqueueToast({
        variant: 'success',
        children: t`Person created from business card`,
      });
      handleClose();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : isAttachingToExisting
            ? t`Failed to update person`
            : t`Failed to create person`;
      setError(message);
      enqueueToast({ variant: 'error', children: message });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <DialogInstance
      dialogId={dialogId}
      dismissible={!isWorking}
      onClose={reset}
      renderInDocumentBody
    >
      {({ container, backdrop, viewportProps, onKeyDown }) => (
        <Dialog.Popup
          {...{ container, backdrop, viewportProps, onKeyDown }}
          size="md"
          data-globally-prevent-click-outside
          style={{
            padding: 'var(--t-spacing-6)',
            borderRadius: 'var(--t-spacing-1)',
          }}
        >
          <Dialog.Title>
            {isAttachingToExisting
              ? t`Add business card`
              : t`Scan business card`}
          </Dialog.Title>
          <Dialog.Body>
            <StyledBody>
              {step === 'upload' ? (
                <>
                  <StyledHint>
                    {isAttachingToExisting
                      ? t`Upload front and optional back photos. Attach them to this person, or scan to fill empty contact fields.`
                      : t`Upload front and optional back photos, then scan to create a person.`}
                  </StyledHint>
                  <StyledHiddenFileInput
                    ref={frontInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={isWorking}
                    onChange={(event) => handleSideSelected('front', event)}
                  />
                  <StyledHiddenFileInput
                    ref={backInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={isWorking}
                    onChange={(event) => handleSideSelected('back', event)}
                  />
                  <StyledSides>
                    <StyledSide>
                      <StyledSideTitle>{t`Front`}</StyledSideTitle>
                      {isDefined(frontPreviewUrl) ? (
                        <StyledPreview
                          src={frontPreviewUrl}
                          alt={t`Front`}
                        />
                      ) : (
                        <StyledPreviewPlaceholder>
                          {t`Required`}
                        </StyledPreviewPlaceholder>
                      )}
                      <Button
                        startIcon={<IconUpload />}
                        variant="outline"
                        disabled={isWorking}
                        onClick={() => frontInputRef.current?.click()}
                      >
                        {isDefined(frontFile)
                          ? t`Replace front`
                          : t`Add front`}
                      </Button>
                    </StyledSide>
                    <StyledSide>
                      <StyledSideTitle>{t`Back`}</StyledSideTitle>
                      {isDefined(backPreviewUrl) ? (
                        <StyledPreview src={backPreviewUrl} alt={t`Back`} />
                      ) : (
                        <StyledPreviewPlaceholder>
                          {t`Optional`}
                        </StyledPreviewPlaceholder>
                      )}
                      <Button
                        startIcon={<IconUpload />}
                        variant="outline"
                        disabled={isWorking}
                        onClick={() => backInputRef.current?.click()}
                      >
                        {isDefined(backFile) ? t`Replace back` : t`Add back`}
                      </Button>
                    </StyledSide>
                  </StyledSides>
                  <Button
                    color="accent"
                    disabled={isWorking || !isDefined(frontFile)}
                    onClick={() => {
                      void handleScan();
                    }}
                  >
                    {isWorking ? t`Scanning…` : t`Scan card fields`}
                  </Button>
                  {isAttachingToExisting ? (
                    <Button
                      variant="outline"
                      disabled={isWorking || !isDefined(frontFile)}
                      onClick={() => {
                        void handleAttachOnly();
                      }}
                    >
                      {isWorking ? t`Attaching…` : t`Attach images only`}
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  {draft.warnings.map((warning) => (
                    <StyledWarning key={warning}>{warning}</StyledWarning>
                  ))}
                  {isAttachingToExisting ? (
                    <StyledHint>
                      {t`Only empty fields on this person will be filled. Existing values are kept.`}
                    </StyledHint>
                  ) : null}
                  <TextInput
                    label={t`First name`}
                    value={draft.firstName}
                    fullWidth
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, firstName: value }))
                    }
                  />
                  <TextInput
                    label={t`Last name`}
                    value={draft.lastName}
                    fullWidth
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, lastName: value }))
                    }
                  />
                  <TextInput
                    label={t`Job title`}
                    value={draft.jobTitle}
                    fullWidth
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, jobTitle: value }))
                    }
                  />
                  <TextInput
                    label={t`Email`}
                    value={draft.email}
                    fullWidth
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, email: value }))
                    }
                  />
                  <TextInput
                    label={t`Phone`}
                    value={draft.phone}
                    fullWidth
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, phone: value }))
                    }
                  />
                  <TextInput
                    label={t`Website`}
                    value={draft.website}
                    fullWidth
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, website: value }))
                    }
                  />
                  <TextInput
                    label={t`Company`}
                    value={draft.companyName}
                    fullWidth
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        companyName: value,
                        companyId: null,
                      }))
                    }
                    disabled={isNonEmptyString(draft.companyId)}
                  />
                  {isNonEmptyString(draft.companyId) ? (
                    <StyledHint>
                      {t`Matched or created company will be linked to this person.`}
                    </StyledHint>
                  ) : null}
                  <StyledHint>
                    {t`Card images will be saved as attachments on this person.`}
                  </StyledHint>
                  <Button
                    variant="outline"
                    disabled={isWorking}
                    onClick={() => {
                      setStep('upload');
                      setDraft(emptyDraft());
                      setError(null);
                    }}
                  >
                    {t`Scan another card`}
                  </Button>
                </>
              )}
              {error ? <StyledError>{error}</StyledError> : null}
            </StyledBody>
            <StyledActions>
              <Button
                onClick={handleClose}
                disabled={isWorking}
                variant="outline"
              >
                {t`Cancel`}
              </Button>
              {step === 'review' ? (
                <Button
                  onClick={() => {
                    void handleSave();
                  }}
                  disabled={isWorking}
                  color="accent"
                >
                  {isAttachingToExisting
                    ? t`Save to person`
                    : t`Create person`}
                </Button>
              ) : null}
            </StyledActions>
          </Dialog.Body>
        </Dialog.Popup>
      )}
    </DialogInstance>
  );
};
