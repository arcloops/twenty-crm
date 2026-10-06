import { gql } from '@apollo/client';

export const EXTRACT_PERSON_FROM_BUSINESS_CARD = gql`
  mutation ExtractPersonFromBusinessCard($fileIds: [UUID!]!) {
    extractPersonFromBusinessCard(fileIds: $fileIds) {
      firstName
      lastName
      jobTitle
      emails
      phones
      website
      companyName
      companyId
      rawText
      warnings
      fileId
      fileIds
    }
  }
`;

export type BusinessCardExtraction = {
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  emails: string[];
  phones: string[];
  website: string | null;
  companyName: string | null;
  companyId: string | null;
  rawText: string;
  warnings: string[];
  fileId: string;
  fileIds: string[];
};
