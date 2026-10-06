import { buildPersonInputFromBusinessCardDraft } from '@/business-card/utils/build-person-input-from-business-card-draft';

describe('buildPersonInputFromBusinessCardDraft', () => {
  const draft = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    jobTitle: 'Engineer',
    email: 'ada@example.com',
    phone: '+15551212',
    website: 'linkedin.com/in/ada',
    companyId: 'company-1',
  };

  it('builds create input with all draft fields', () => {
    const input = buildPersonInputFromBusinessCardDraft(draft);

    expect(input).toEqual({
      name: { firstName: 'Ada', lastName: 'Lovelace' },
      jobTitle: 'Engineer',
      emails: { primaryEmail: 'ada@example.com', additionalEmails: null },
      phones: {
        primaryPhoneNumber: '15551212',
        primaryPhoneCountryCode: '',
        primaryPhoneCallingCode: '',
        additionalPhones: null,
      },
      linkedinLink: {
        primaryLinkUrl: 'https://linkedin.com/in/ada',
        primaryLinkLabel: '',
        secondaryLinks: [],
      },
      companyId: 'company-1',
    });
  });

  it('only fills empty fields when updating an existing person', () => {
    const input = buildPersonInputFromBusinessCardDraft(draft, {
      emptyFieldsOnly: true,
      existingPerson: {
        name: { firstName: 'Ada', lastName: '' },
        jobTitle: 'Mathematician',
        emails: { primaryEmail: null },
        phones: { primaryPhoneNumber: '999' },
        linkedinLink: { primaryLinkUrl: null },
        companyId: null,
      },
    });

    expect(input).toEqual({
      name: { firstName: 'Ada', lastName: 'Lovelace' },
      emails: { primaryEmail: 'ada@example.com', additionalEmails: null },
      linkedinLink: {
        primaryLinkUrl: 'https://linkedin.com/in/ada',
        primaryLinkLabel: '',
        secondaryLinks: [],
      },
      companyId: 'company-1',
    });
    expect(input.jobTitle).toBeUndefined();
    expect(input.phones).toBeUndefined();
  });
});
