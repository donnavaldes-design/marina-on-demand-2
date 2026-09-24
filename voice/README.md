# MOD beta voice

Beta scope: microphone dictation, two-minute browser recording limit, 3 MiB server upload ceiling, editable transcript before Send, opt-in response playback with native pause/replay controls. Playback input is limited to 4,000 characters after formatting cleanup. Text and existing tools remain the core workflow.

Default providers: OpenAI whisper-1 transcription and gpt-4o-mini-tts / coral playback, using the existing server OPENAI_API_KEY. Audio is disclosed as MOD's AI voice. An authorized verified Marina voice can be enabled later with server ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID; neither belongs in browser code.

Private output: mod-voice storage bucket, signed URLs, voice_usage rows owned by authenticated user. Playback cache includes user, message, text, provider, model and voice. Database uniqueness prevents concurrent paid duplicate playback. No microphone recording is saved to app storage. Transcript stays in the draft until sent. Provider processing/retention still applies.

Usage: voice_usage stores dictation duration and bytes, playback character and output-byte counts, provider, model, timestamp and outcome. These are usage measurements, not a dollar invoice. Daily voice quotas and an owner-facing cost report remain follow-up work.

Phase 2: full voice-to-voice conversations, interruption while MOD speaks, streaming playback, voice-minute budgets, and retaining the existing approval cards for external actions. Not enabled in beta.

Validation: automated ownership, caching, concurrency, input limits, denied microphone permissions, draft preservation and navigation cleanup tests. A physical microphone and phone playback smoke test is still required after deployment.
