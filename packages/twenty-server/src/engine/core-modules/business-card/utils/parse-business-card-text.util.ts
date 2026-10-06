export type ParsedBusinessCard = {
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  emails: string[];
  phones: string[];
  website: string | null;
  companyName: string | null;
  warnings: string[];
};

const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN =
  /(?:\+|00)?[\d][\d\s().-]{7,}\d/g;
const URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/g;

const JOB_TITLE_HINTS = [
  'ceo',
  'cto',
  'cfo',
  'coo',
  'founder',
  'co-founder',
  'president',
  'director',
  'manager',
  'engineer',
  'developer',
  'designer',
  'consultant',
  'sales',
  'marketing',
  'account',
  'partner',
  'head of',
  'vp',
  'vice president',
  'lead',
];

const NON_NAME_HINTS = [
  'llc',
  'inc',
  'ltd',
  'gmbh',
  'corp',
  'company',
  'street',
  'avenue',
  'road',
  'suite',
  'floor',
  'tel',
  'fax',
  'mobile',
  'phone',
  'email',
  'www',
];

const normalizeLines = (rawText: string): string[] =>
  rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);

const containsEmail = (value: string) =>
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value);

const containsPhone = (value: string) =>
  /(?:\+|00)?[\d][\d\s().-]{7,}\d/.test(value);

const containsUrl = (value: string) =>
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(?:\.[a-zA-Z]{2,})+/.test(
    value,
  );

const isLikelyJobTitle = (line: string): boolean => {
  const lowered = line.toLowerCase();
  return JOB_TITLE_HINTS.some((hint) => lowered.includes(hint));
};

const isLikelyNonName = (line: string): boolean => {
  const lowered = line.toLowerCase();
  if (containsEmail(line) || containsUrl(line) || containsPhone(line)) {
    return true;
  }

  return NON_NAME_HINTS.some((hint) => lowered.includes(hint));
};

const parseName = (
  line: string,
): { firstName: string | null; lastName: string | null } => {
  const parts = line
    .replace(/[^a-zA-ZÀ-ÿ' -]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const extractUnique = (matches: string[] | null): string[] => {
  if (!matches) {
    return [];
  }

  return Array.from(
    new Set(matches.map((value) => value.trim()).filter(Boolean)),
  );
};

const cleanPhone = (value: string): string => {
  const digits = value.replace(/[^\d+]/g, '');
  if (value.trim().startsWith('+') || value.trim().startsWith('00')) {
    return digits.startsWith('+') ? digits : `+${digits.replace(/^00/, '')}`;
  }
  return digits.replace(/^\+/, '');
};

export const parseBusinessCardText = (rawText: string): ParsedBusinessCard => {
  const warnings: string[] = [];
  const lines = normalizeLines(rawText);

  if (lines.length === 0) {
    return {
      firstName: null,
      lastName: null,
      jobTitle: null,
      emails: [],
      phones: [],
      website: null,
      companyName: null,
      warnings: ['No text detected on the business card image'],
    };
  }

  const emails = extractUnique(rawText.match(EMAIL_PATTERN));
  const phones = extractUnique(rawText.match(PHONE_PATTERN))
    .map(cleanPhone)
    .filter((phone) => phone.replace(/\D/g, '').length >= 8);
  const urls = extractUnique(rawText.match(URL_PATTERN)).filter(
    (url) => !emails.some((email) => email.includes(url)),
  );

  const website =
    urls.find((url) => /linkedin\.com/i.test(url)) ??
    urls.find((url) => !/@/.test(url)) ??
    null;

  let firstName: string | null = null;
  let lastName: string | null = null;
  let jobTitle: string | null = null;
  let companyName: string | null = null;

  for (const line of lines.slice(0, 8)) {
    if (isLikelyNonName(line) && !isLikelyJobTitle(line)) {
      continue;
    }

    if (
      !firstName &&
      !isLikelyJobTitle(line) &&
      /^[A-Za-zÀ-ÿ' .-]+$/.test(line)
    ) {
      const parsed = parseName(line);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
      continue;
    }

    if (!jobTitle && isLikelyJobTitle(line)) {
      jobTitle = line;
      continue;
    }
  }

  for (const line of lines) {
    if (
      line === [firstName, lastName].filter(Boolean).join(' ') ||
      line === jobTitle ||
      emails.some((email) => line.includes(email)) ||
      phones.some((phone) => line.includes(phone)) ||
      (website && line.includes(website.replace(/^https?:\/\//, '')))
    ) {
      continue;
    }

    if (
      !companyName &&
      line.length >= 2 &&
      line.length <= 60 &&
      !containsEmail(line) &&
      !containsPhone(line) &&
      !isLikelyJobTitle(line)
    ) {
      companyName = line;
      break;
    }
  }

  if (!firstName) {
    warnings.push('Could not detect a person name');
  }
  if (emails.length === 0) {
    warnings.push('No email address found');
  }
  if (phones.length === 0) {
    warnings.push('No phone number found');
  }

  return {
    firstName,
    lastName,
    jobTitle,
    emails,
    phones,
    website,
    companyName,
    warnings,
  };
};
