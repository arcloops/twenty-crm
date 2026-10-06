import { gql } from '@apollo/client';

export const getTargetFieldIdName = (nameSingular: string) =>
  `target${nameSingular.charAt(0).toUpperCase()}${nameSingular.slice(1)}Id`;

export const FIND_TIMELINE_ACTIVITIES = gql`
  query FindTimelineActivities(
    $filter: TimelineActivityFilterInput
    $limit: Int
  ) {
    timelineActivities(
      filter: $filter
      first: $limit
      orderBy: [{ happensAt: DescNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          happensAt
          properties
          linkedRecordCachedName
          linkedObjectMetadataId
        }
      }
    }
  }
`;

export const FIND_TASK_TARGETS = gql`
  query FindTaskTargets($filter: TaskTargetFilterInput, $limit: Int) {
    taskTargets(filter: $filter, first: $limit) {
      edges {
        node {
          id
          task {
            id
            title
            status
            dueAt
            createdAt
          }
        }
      }
    }
  }
`;

export const FIND_NOTE_TARGETS = gql`
  query FindNoteTargets($filter: NoteTargetFilterInput, $limit: Int) {
    noteTargets(filter: $filter, first: $limit) {
      edges {
        node {
          id
          note {
            id
            title
            createdAt
            bodyV2 {
              blocknote
              markdown
            }
          }
        }
      }
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: TaskCreateInput!) {
    createTask(data: $input) {
      id
      title
      status
    }
  }
`;

export const CREATE_TASK_TARGET = gql`
  mutation CreateTaskTarget($input: TaskTargetCreateInput!) {
    createTaskTarget(data: $input) {
      id
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($idToUpdate: UUID!, $input: TaskUpdateInput!) {
    updateTask(id: $idToUpdate, data: $input) {
      id
      title
      status
    }
  }
`;

export const CREATE_NOTE = gql`
  mutation CreateNote($input: NoteCreateInput!) {
    createNote(data: $input) {
      id
      title
    }
  }
`;

export const CREATE_NOTE_TARGET = gql`
  mutation CreateNoteTarget($input: NoteTargetCreateInput!) {
    createNoteTarget(data: $input) {
      id
    }
  }
`;

export const UPDATE_NOTE = gql`
  mutation UpdateNote($idToUpdate: UUID!, $input: NoteUpdateInput!) {
    updateNote(id: $idToUpdate, data: $input) {
      id
      title
    }
  }
`;

export const GET_TIMELINE_THREADS = gql`
  query GetTimelineThreadsFromObjectRecord(
    $objectNameSingular: String!
    $recordId: UUID!
    $page: Int!
    $pageSize: Int!
  ) {
    getTimelineThreadsFromObjectRecord(
      objectNameSingular: $objectNameSingular
      recordId: $recordId
      page: $page
      pageSize: $pageSize
    ) {
      totalNumberOfThreads
      timelineThreads {
        id
        subject
        lastMessageBody
        lastMessageReceivedAt
        numberOfMessagesInThread
        participantCount
        read
      }
    }
  }
`;

export const GET_TIMELINE_CALENDAR_EVENTS = gql`
  query GetTimelineCalendarEventsFromObjectRecord(
    $objectNameSingular: String!
    $recordId: UUID!
    $page: Int!
    $pageSize: Int!
  ) {
    getTimelineCalendarEventsFromObjectRecord(
      objectNameSingular: $objectNameSingular
      recordId: $recordId
      page: $page
      pageSize: $pageSize
    ) {
      totalNumberOfCalendarEvents
      timelineCalendarEvents {
        id
        title
        description
        location
        startsAt
        endsAt
        isFullDay
      }
    }
  }
`;
