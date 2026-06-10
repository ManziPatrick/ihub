# TODO - Developer progress + assigned tasks per developer

- [ ] Backend: add GraphQL types for developer task summary (ProjectDeveloperTaskSummary, nested DeveloperTaskProgress, and developer summary task fields)
- [ ] Backend: add resolver query `projectDeveloperTaskSummary(projectId)`
- [ ] Backend: compute weighted progress using mapping: todo=25, in_progress=50, in_review=75, done=100, blocked=0
- [ ] Backend: include tasks assigned to each developer (at least id/title/status/priority/dueDate/order/approved)
- [ ] Frontend: add GraphQL query document for `projectDeveloperTaskSummary`
- [ ] Frontend: update `frontend/src/pages/portal/admin/AdminProjects.tsx` to render developer summary when boardProjectId is set
- [ ] Frontend: add UI list/table for each developer with progress bar + counts and expandable task list
- [ ] Frontend: wire refetch after task create/update/move/approve/assign (use existing `refetchTasks` callback)
- [ ] Verify: run frontend build + backend TypeScript compile

