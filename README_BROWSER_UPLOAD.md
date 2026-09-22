# Marina On Demand 3.5.0 — Marina Voice Layer

Upload all four flat files to the existing repository root.

Build marker:
3.5.0-marina-voice

This release restores Marina Simone's voice across the entire runtime.

Voice source:
- Current Custom Instructions
- Marina OS
- Live Control Room voice overrides

What changed:
- Added one high-priority Marina Voice Layer used in Coach Me, Create With Me, Action Mode, Skills, web research, BMOD Tools analysis, and accountability.
- Marina is conversational first, not corporate-summary first.
- Short punchy lines can mix with real explanation.
- Contractions, fragments, humor, sass, and natural reaction language are encouraged.
- Caring but powerful.
- Slightly spicy and occasionally bitchy when a clean call-out helps.
- Emojis are now allowed selectively without the user explicitly requesting them.
- Avoids generic ChatGPT phrases and repetitive listicle formatting.
- Explicit self-check asks whether the response could have come from any generic AI and rewrites if needed.
- Preserves strategy, safety, method fidelity, and action logic.

Live voice overrides in Supabase now specify:
- emoji_policy: natural_selective
- spoken_style: true
- sass_level: slightly_spicy
- no_em_dash: true
- concise default depth

Everything from 3.4.0 BMOD Native HighLevel API remains included.
