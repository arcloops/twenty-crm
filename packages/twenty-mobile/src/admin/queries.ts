import { gql } from '@apollo/client';

export type ApiKeySummary = {
  id: string;
  name: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  role?: {
    id: string;
    label: string;
  } | null;
};

export type RoleSummary = {
  id: string;
  label: string;
  description?: string | null;
  isEditable?: boolean | null;
  permissionFlags?: Array<{
    id: string;
    flag: string;
  }> | null;
};

export const GET_API_KEYS = gql`
  query GetApiKeys {
    apiKeys {
      id
      name
      expiresAt
      revokedAt
      role {
        id
        label
      }
    }
  }
`;

// Slim vs web GetRoles — list + flag labels only (no object/field permission trees)
export const GET_ROLES = gql`
  query GetRoles {
    getRoles {
      id
      label
      description
      isEditable
      permissionFlags {
        id
        flag
      }
    }
  }
`;
