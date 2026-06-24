# Ollama in backend Dockerfile

## Goal
Run Ollama inside the same backend container (option 1).

## Steps
1. Update `backend/Dockerfile` to install required tools/binaries.
2. Install/start Ollama during container boot.
3. Ensure backend and Ollama can both run (CMD should start both).
4. Expose Ollama port `11434` (optional, for debugging).
5. Set env vars / defaults expected by `backend/src/services/ai.service.ts`:
   - `OLLAMA_ONLY=true`
   - `OLLAMA_ENABLED=true`
   - `OLLAMA_BASE_URL=http://localhost:11434`
   - `OLLAMA_MODEL=...`
6. Build and test container locally:
   - Verify `curl http://localhost:11434/api/tags`
   - Verify backend AI endpoint works and logs show Ollama success.

