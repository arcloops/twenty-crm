import { parseBusinessCardText } from 'src/engine/core-modules/business-card/utils/parse-business-card-text.util';

describe('parseBusinessCardText', () => {
  it('extracts name, title, company, email, phone, and website', () => {
    const rawText = `
Jane Doe
Head of Sales
Acme Robotics
jane.doe@acme-robotics.com
+1 (415) 555-0199
www.acme-robotics.com
`;

    const parsed = parseBusinessCardText(rawText);

    expect(parsed.firstName).toBe('Jane');
    expect(parsed.lastName).toBe('Doe');
    expect(parsed.jobTitle).toBe('Head of Sales');
    expect(parsed.companyName).toBe('Acme Robotics');
    expect(parsed.emails).toEqual(['jane.doe@acme-robotics.com']);
    expect(parsed.phones[0]).toContain('4155550199');
    expect(parsed.website).toContain('acme-robotics.com');
    expect(parsed.warnings).toEqual([]);
  });

  it('returns warnings when OCR text is empty', () => {
    const parsed = parseBusinessCardText('   \n  ');

    expect(parsed.firstName).toBeNull();
    expect(parsed.emails).toEqual([]);
    expect(parsed.warnings).toContain(
      'No text detected on the business card image',
    );
  });

  it('prefers linkedin URL when present', () => {
    const parsed = parseBusinessCardText(`
Alex Rivera
Engineer
Rivera Labs
alex@rivera.io
linkedin.com/in/alexrivera
rivera.io
`);

    expect(parsed.website).toContain('linkedin.com/in/alexrivera');
    expect(parsed.emails).toEqual(['alex@rivera.io']);
  });
});
