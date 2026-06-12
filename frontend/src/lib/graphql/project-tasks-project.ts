import { gql } from "@apollo/client";

// Fetch ALL tasks for a project (used for student project expand/view)
export const GET_PROJECT_TASKS_BY_PROJECT_ID = gql`
  query GetProjectTasks($projectId: ID!) {
    projectTasks(projectId: $projectId) {
      id
      projectId
      title
      description
      status
      priority
      assignee {
        id
        username
        fullName
        avatar
      }
      dueDate
      order
      approved
      createdAt
      project {
        id
        title
        status
        progress
      }
    }
  }
`;

