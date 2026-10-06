import { gql } from '@apollo/client';

export const CREATE_FILE_UPLOAD = gql`
  mutation CreateFileUpload(
    $filename: String!
    $size: Float!
    $fileFolder: FileFolder!
    $fieldMetadataId: String
  ) {
    createFileUpload(
      filename: $filename
      size: $size
      fileFolder: $fileFolder
      fieldMetadataId: $fieldMetadataId
    ) {
      fileId
      uploadUrl
      contentType
      expiresAt
    }
  }
`;

export const COMPLETE_FILE_UPLOAD = gql`
  mutation CompleteFileUpload($fileId: String!) {
    completeFileUpload(fileId: $fileId) {
      id
      path
      size
      createdAt
      url
    }
  }
`;

export const FIND_ATTACHMENTS = gql`
  query FindAttachments($filter: AttachmentFilterInput, $limit: Int) {
    attachments(
      filter: $filter
      first: $limit
      orderBy: [{ createdAt: DescNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          createdAt
          file {
            fileId
            label
            url
            path
          }
        }
      }
    }
  }
`;

export const CREATE_ATTACHMENT = gql`
  mutation CreateAttachment($input: AttachmentCreateInput!) {
    createAttachment(data: $input) {
      id
      name
    }
  }
`;

export const getTargetFieldIdName = (nameSingular: string) =>
  `target${nameSingular.charAt(0).toUpperCase()}${nameSingular.slice(1)}Id`;
