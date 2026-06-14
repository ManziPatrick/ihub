# TODO

- [ ] Inspect GraphQL schema/resolver for `CHAT_WITH_AI` output fields (content/role/action/actionData).
- [ ] Update `backend/src/services/ai.service.ts`:
  - [ ] Add new AI action protocol tags for navigation/links (NAVIGATE/LINKS).
  - [ ] Extend `parseAIResponse()` to detect and return `action` and `actionData`.
  - [ ] Update the AI system prompt to instruct when to return navigation actions.
- [ ] Update GraphQL resolver/type defs if needed so frontend can access `action` and `actionData`.
- [ ] Update `frontend/src/components/chatbot/ChatBot.tsx`:
  - [ ] Render cld ickable link cards/buttons based on `action`.
  - [ ] Use React Router navigation for internal paths.
- [ ] Run frontend typecheck and backend build/tests.
- [ ] Manual test chatbot flows: courses page, internship page, student dashboard/schedule.

