# TODO

## User report quality improvements (UserFullReport)
- [ ] Update `backend/src/graphql/user-report-resolvers.ts` to populate required course fields (title/level/category/modules/thumbnail) for both:
  - [ ] `enrolledCourses` (from `User`)
  - [ ] `courseId` (from `AssignmentSubmission`)
- [ ] Add smarter fallbacks so report fields don’t show `Unknown` or unnecessary `null`.
- [ ] Improve formatting for print:
  - [ ] Convert missing school/job fields into user-friendly “Not provided” strings where schema allows
  - [ ] Ensure date fields are consistently ISO strings
- [ ] Run backend TypeScript build / tests and verify the `getUserFullReport` output.

