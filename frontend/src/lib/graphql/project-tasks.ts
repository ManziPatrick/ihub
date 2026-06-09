import { gql } from "@apollo/client";

// ─── QUERIES ────────────────────────────────────────────────────────────────

export const GET_PROJECT_TASKS = gql`
  query GetProjectTasks($projectId: ID!) {
    projectTasks(projectId: $projectId) {
      id
      projectId
      project {
        id
        title
        status
        progress
      }
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
      assigneeId
      labels
      storyPoints
      dueDate
      order
      dependencies
      approved
      feedback
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT_TASK = gql`
  query GetProjectTask($id: ID!) {
    projectTask(id: $id) {
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
      assigneeId
      labels
      storyPoints
      dueDate
      order
      dependencies
      approved
      feedback
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_PROJECT_TASKS = gql`
  query GetMyProjectTasks($status: String) {
    myProjectTasks(status: $status) {
      id
      projectId
      project {
        id
        title
        status
        progress
      }
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
    }
  }
`;

export const GET_PROJECT_BOARD_STATS = gql`
  query GetProjectBoardStats($projectId: ID!) {
    projectBoardStats(projectId: $projectId) {
      totalTasks
      backlogCount
      todoCount
      inProgressCount
      inReviewCount
      doneCount
      blockedCount
      completedPercentage
      overdueTasks
    }
  }
`;

// ─── MUTATIONS ──────────────────────────────────────────────────────────────

export const CREATE_PROJECT_TASK = gql`
  mutation CreateProjectTask(
    $projectId: ID!
    $title: String!
    $description: String
    $priority: String
    $assigneeId: ID
    $labels: [String]
    $storyPoints: Int
    $dueDate: String
    $dependencies: [ID]
  ) {
    createProjectTask(
      projectId: $projectId
      title: $title
      description: $description
      priority: $priority
      assigneeId: $assigneeId
      labels: $labels
      storyPoints: $storyPoints
      dueDate: $dueDate
      dependencies: $dependencies
    ) {
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
      assigneeId
      labels
      storyPoints
      dueDate
      order
      dependencies
      createdAt
    }
  }
`;

export const UPDATE_PROJECT_TASK = gql`
  mutation UpdateProjectTask(
    $id: ID!
    $title: String
    $description: String
    $status: String
    $priority: String
    $assigneeId: ID
    $labels: [String]
    $storyPoints: Int
    $dueDate: String
    $order: Int
    $dependencies: [ID]
  ) {
    updateProjectTask(
      id: $id
      title: $title
      description: $description
      status: $status
      priority: $priority
      assigneeId: $assigneeId
      labels: $labels
      storyPoints: $storyPoints
      dueDate: $dueDate
      order: $order
      dependencies: $dependencies
    ) {
      id
      title
      status
      priority
      assignee {
        id
        username
      }
      dueDate
      order
    }
  }
`;

export const MOVE_PROJECT_TASK = gql`
  mutation MoveProjectTask($id: ID!, $status: String!, $order: Int) {
    moveProjectTask(id: $id, status: $status, order: $order) {
      id
      status
      order
    }
  }
`;

export const DELETE_PROJECT_TASK = gql`
  mutation DeleteProjectTask($id: ID!) {
    deleteProjectTask(id: $id)
  }
`;

export const APPROVE_PROJECT_TASK = gql`
  mutation ApproveProjectTask($id: ID!, $feedback: String) {
    approveProjectTask(id: $id, feedback: $feedback) {
      id
      status
      approved
      feedback
    }
  }
`;

export const ASSIGN_PROJECT_TASK = gql`
  mutation AssignProjectTask($id: ID!, $assigneeId: ID!) {
    assignProjectTask(id: $id, assigneeId: $assigneeId) {
      id
      assignee {
        id
        username
        fullName
        avatar
      }
      assigneeId
    }
  }
`;

// ─── PROJECT STAGE MUTATIONS ────────────────────────────────────────────────

export const ADD_PROJECT_STAGE = gql`
  mutation AddProjectStage(
    $projectId: ID!
    $name: String!
    $description: String
    $order: Int!
    $dueDate: String
  ) {
    addProjectStage(
      projectId: $projectId
      name: $name
      description: $description
      order: $order
      dueDate: $dueDate
    ) {
      id
      stages {
        name
        description
        order
        status
        assignee {
          id
          username
          fullName
          avatar
        }
        dueDate
        completed
        completedAt
      }
    }
  }
`;

export const UPDATE_PROJECT_STAGE = gql`
  mutation UpdateProjectStage(
    $projectId: ID!
    $order: Int!
    $name: String
    $description: String
    $status: String
    $assigneeId: ID
    $dueDate: String
  ) {
    updateProjectStage(
      projectId: $projectId
      order: $order
      name: $name
      description: $description
      status: $status
      assigneeId: $assigneeId
      dueDate: $dueDate
    ) {
      id
      stages {
        name
        description
        order
        status
        assignee {
          id
          username
          fullName
          avatar
        }
        dueDate
        completed
        completedAt
      }
    }
  }
`;

export const ASSIGN_PROJECT_STAGE = gql`
  mutation AssignProjectStage(
    $projectId: ID!
    $order: Int!
    $assigneeId: ID!
  ) {
    assignProjectStage(
      projectId: $projectId
      order: $order
      assigneeId: $assigneeId
    ) {
      id
      stages {
        name
        description
        order
        status
        assignee {
          id
          username
          fullName
          avatar
        }
        dueDate
        completed
      }
    }
  }
`;

export const COMPLETE_PROJECT_STAGE = gql`
  mutation CompleteProjectStage($projectId: ID!, $order: Int!) {
    completeProjectStage(projectId: $projectId, order: $order) {
      id
      stages {
        name
        description
        order
        status
        assignee {
          id
          username
          fullName
          avatar
        }
        completed
        completedAt
      }
    }
  }
`;

export const REMOVE_PROJECT_STAGE = gql`
  mutation RemoveProjectStage($projectId: ID!, $order: Int!) {
    removeProjectStage(projectId: $projectId, order: $order) {
      id
      stages {
        name
        order
      }
    }
  }
`;
