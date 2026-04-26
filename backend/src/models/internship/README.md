# IHUB Internship Module

This module provides a production-ready, scalable internship management system for the IHUB Academy Hub.

## Core Features

### 1. Internship Program Management (Admin)
- Full CRUD for internship tracks.
- Configure duration, windows, and eligibility.
- Enable/Disable programs dynamically.

### 2. Applications & Dynamic Selection
- Student application flow with skills and portfolio tracking.
- Admin review, approval, and rejection with reason tracking.
- Real-time Socket.IO notifications for status changes.

### 3. IHUB-Owned Projects
- Define projects with specific milestones, required skills, and team size ranges.
- Attach projects to specific internship programs.

### 4. Dynamic Team Management
- Create teams for project collaboration.
- Assign mentors (Trainers) to teams.
- Add/Remove/Reassign interns anytime.
- Membership history is tracked.

### 5. Execution & Tracking
- **Student View**: Milestone tracking, work submission, and time logging.
- **Mentor Tools**: Submission review, performance grading, and written feedback.
- **Admin Dashboard**: Comprehensive monitoring of intern and team performance.

### 6. Audit & Accountability
- **Activity Logs**: Every action (Apply, Create, Assign, Review) is logged with who, what, and when.
- **Soft Deletes**: All entities use soft deletes to ensure data is reversible and auditable.
- **Time Logs**: Precise tracking of minutes spent per task by interns.

## Technical Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **API**: Apollo GraphQL
- **Real-time**: Socket.IO

## Database Models
- `InternshipProgram`: Track definition.
- `InternshipApplication`: Student application state.
- `InternshipProject`: The work to be done.
- `InternshipTeam`: Collaborative units.
- `InternshipTeamMember`: Mapping users to teams with roles.
- `InternshipMilestone`: Deliverables within a project.
- `InternshipSubmission`: Student work uploads and review status.
- `InternshipTimeLog`: Effort tracking.
- `InternshipMentorFeedback`: Mentor-to-Intern evaluations.
- `InternshipActivityLog`: System-wide audit trail.

## Getting Started

### Seeding Data
To populate the database with sample internship data:
```bash
cd backend
npm run seed:internship
```

### GraphQL Playground
Explore the API at `http://localhost:4000/graphql`.
Significant new Queries and Mutations have been added under the Internship section.
