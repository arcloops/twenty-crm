import { gql } from '@apollo/client';

export const GET_CORE_WORKFLOWS = gql`
  query GetCoreWorkflows($first: Int) {
    coreWorkflows(
      first: $first
      orderBy: UPDATED_AT
      orderByDirection: DESC
    ) {
      edges {
        node {
          id
          name
          statuses
          workspaceWorkflowId
          updatedAt
        }
      }
      totalCount
    }
  }
`;

export const RUN_WORKFLOW_VERSION = gql`
  mutation RunWorkflowVersion($input: RunWorkflowVersionInput!) {
    runWorkflowVersion(input: $input) {
      workflowRunId
    }
  }
`;

export type CoreWorkflow = {
  id: string;
  name?: string | null;
  statuses?: string[] | null;
  workspaceWorkflowId?: string | null;
  updatedAt?: string | null;
};
