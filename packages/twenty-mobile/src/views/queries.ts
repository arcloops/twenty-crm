import { gql } from '@apollo/client';

export const FIND_MANY_VIEWS = gql`
  query FindManyViews($objectMetadataId: String) {
    getViews(objectMetadataId: $objectMetadataId) {
      id
      name
      objectMetadataId
      type
      key
      icon
      position
      isActive
      mainGroupByFieldMetadataId
      viewFilters {
        id
        fieldMetadataId
        operand
        value
        subFieldName
      }
      viewSorts {
        id
        fieldMetadataId
        direction
        subFieldName
      }
      viewGroups {
        id
        fieldValue
        isVisible
        position
      }
    }
  }
`;
