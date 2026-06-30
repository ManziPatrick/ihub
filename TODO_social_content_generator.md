# Social media content generator (meme/captions/holiday wishes + image prompts)

- [ ] Implement safe “Social Content” helpers in ChatBot UI (preset buttons + prompt templates)
  - [ ] Update `frontend/src/components/chatbot/ChatBot.tsx`
- [ ] Enforce structured output in backend AI service for social requests
  - [ ] Update `backend/src/services/ai.service.ts`
- [ ] Smoke-test (manual)
  - [ ] Ask: “Create 1 meme caption + 1 alt caption for [topic], include hashtags, English”
  - [ ] Ask: “Write 5 holiday/public-day wishes for [event/date], include CTA and image prompts”
- [ ] (Optional) Add help text in greeting
  - [ ] Update `getChatGreeting()` in `backend/src/services/ai.service.ts`

