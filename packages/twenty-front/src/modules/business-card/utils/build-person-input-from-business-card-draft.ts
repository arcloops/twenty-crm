import { isDefined, isNonEmptyString } from 'twenty-shared/utils';

export type BusinessCardPersonDraft = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  website: string;
  companyId: string | null;
};

export type ExistingPersonForBusinessCard = {
  name?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  jobTitle?: string | null;
  emails?: {
    primaryEmail?: string | null;
  } | null;
  phones?: {
    primaryPhoneNumber?: string | null;
  } | null;
  linkedinLink?: {
    primaryLinkUrl?: string | null;
  } | null;
  companyId?: string | null;
};

const isBlank = (value: string | null | undefined): boolean =>
  !isNonEmptyString(value);

export const buildPersonInputFromBusinessCardDraft = (
  draft: BusinessCardPersonDraft,
  options?: {
    existingPerson?: ExistingPersonForBusinessCard | null;
    emptyFieldsOnly?: boolean;
  },
): Record<string, unknown> => {
  const existingPerson = options?.existingPerson ?? null;
  const emptyFieldsOnly = options?.emptyFieldsOnly === true;

  const shouldSet = (isExistingEmpty: boolean) =>
    emptyFieldsOnly ? isExistingEmpty : true;

  const input: Record<string, unknown> = {};

  const existingFirstName = existingPerson?.name?.firstName;
  const existingLastName = existingPerson?.name?.lastName;
  const shouldSetFirstName =
    isNonEmptyString(draft.firstName) &&
    shouldSet(isBlank(existingFirstName));
  const shouldSetLastName =
    isNonEmptyString(draft.lastName) && shouldSet(isBlank(existingLastName));

  if (shouldSetFirstName || shouldSetLastName) {
    input.name = {
      firstName: shouldSetFirstName
        ? draft.firstName
        : (existingFirstName ?? null),
      lastName: shouldSetLastName
        ? draft.lastName
        : (existingLastName ?? null),
    };
  } else if (!emptyFieldsOnly) {
    input.name = {
      firstName: draft.firstName || null,
      lastName: draft.lastName || null,
    };
  }

  if (
    isNonEmptyString(draft.jobTitle) &&
    shouldSet(isBlank(existingPerson?.jobTitle))
  ) {
    input.jobTitle = draft.jobTitle;
  }

  if (
    isNonEmptyString(draft.email) &&
    shouldSet(isBlank(existingPerson?.emails?.primaryEmail))
  ) {
    input.emails = {
      primaryEmail: draft.email,
      additionalEmails: null,
    };
  }

  if (
    isNonEmptyString(draft.phone) &&
    shouldSet(isBlank(existingPerson?.phones?.primaryPhoneNumber))
  ) {
    input.phones = {
      primaryPhoneNumber: draft.phone.replace(/^\+/, ''),
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    };
  }

  const isLinkedIn = /linkedin\.com/i.test(draft.website);
  const normalizedWebsite = isNonEmptyString(draft.website)
    ? draft.website.startsWith('http')
      ? draft.website
      : `https://${draft.website}`
    : null;

  if (
    isLinkedIn &&
    isDefined(normalizedWebsite) &&
    shouldSet(isBlank(existingPerson?.linkedinLink?.primaryLinkUrl))
  ) {
    input.linkedinLink = {
      primaryLinkUrl: normalizedWebsite,
      primaryLinkLabel: '',
      secondaryLinks: [],
    };
  }

  if (
    isNonEmptyString(draft.companyId) &&
    shouldSet(isBlank(existingPerson?.companyId))
  ) {
    input.companyId = draft.companyId;
  }

  return input;
};
