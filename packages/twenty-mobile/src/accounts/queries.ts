import { gql } from '@apollo/client';

export const MY_CONNECTED_ACCOUNTS = gql`
  query MyConnectedAccounts {
    myConnectedAccounts {
      id
      handle
      provider
      authFailedAt
      archivedAt
      scopes
      lastSignedInAt
      name
      visibility
      createdAt
      updatedAt
    }
  }
`;

export const GENERATE_TRANSIENT_TOKEN = gql`
  mutation generateTransientToken {
    generateTransientToken {
      transientToken {
        token
      }
    }
  }
`;

export const DELETE_CONNECTED_ACCOUNT = gql`
  mutation DeleteConnectedAccount($id: UUID!) {
    deleteConnectedAccount(id: $id) {
      id
    }
  }
`;
