import { gql } from '@apollo/client';

export const OBJECT_METADATA_ITEMS = gql`
  query ObjectMetadataItems {
    objects(paging: { first: 1000 }) {
      edges {
        node {
          id
          nameSingular
          namePlural
          labelSingular
          labelPlural
          icon
          isActive
          isSystem
          isUICreatable
          labelIdentifierFieldMetadataId
          fieldsList {
            id
            type
            name
            label
            isActive
            isSystem
            isNullable
            defaultValue
            options
            relation {
              type
              targetObjectMetadata {
                id
                nameSingular
                namePlural
              }
            }
          }
        }
      }
    }
  }
`;
