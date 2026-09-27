# Arabic Maqamat roadmap

This roadmap reflects the current implementation. Shared workspace persistence, the audio transport controller, accessible shell tabs, bilingual font styling, and MusicXML viewing/download are already present. The work below focuses on completing and hardening those foundations.


## Accessibility, recovery, and localization

Complete actionable feedback for async failures, keyboard and screen-reader support across labs, and an English/Arabic language foundation. The shell already uses tab semantics and existing Tabs/Dialog primitives are available.

1. Establish shared loading, error, retry, and status patterns for score rendering, sight-reading, audio startup, recording, and asynchronous playback.
2. Improve [ScoreViewer.tsx](src/components/ScoreViewer.tsx) with render retry, clipboard feedback, compatibility guidance, and accessible live states.
3. Surface OSMD, melody generation, audio, microphone, and playback failures in [TrainingLab.tsx](src/components/TrainingLab.tsx) with a useful recovery action.
4. Expose audio readiness and recovery from [audio-transport.ts](src/audio/audio-transport.ts) consistently across the shell and labs.
5. Audit navigation and lab controls for keyboard operation, visible focus, accessible names, selected state, and screen-reader announcements. Reuse existing UI primitives and correct any gaps in the current shell tabs.
6. Replace remaining custom DSP/install dialogs with the shared Dialog primitive and verify focus handling. Label DSP controls, note tiles, delete actions, popovers, and score controls.
7. Add English/Arabic language state, update document `lang` and `dir`, and make layout styles direction-safe. Arabic font styling exists; ensure the intended Latin and Arabic fonts are explicitly loaded and applied.
8. Translate the shell and high-traffic controls first, then expand coverage by lab. Keep Arabic musical terms available and explain quarter-tone notation and terms such as qarar, ghammaz, sayr, qafla, jins, tanjees, and intiqal.
9. Normalize notation labels across [pitch.ts](src/core/pitch.ts), [ScoreViewer.tsx](src/components/ScoreViewer.tsx), and [JinsDetectorLab.tsx](src/components/JinsDetectorLab.tsx).
10. Add a reusable `SessionBar` beneath the header with maqam, tonic, ghammaz, scale, drone, transport state, and quick links. Derive it from shared workspace and transport state, with responsive mobile behavior.
11. Validate typecheck, lint, build, forced rendering/audio failures, denied permissions, keyboard and screen-reader navigation, dialog focus handling, bilingual RTL layouts, and cross-lab session consistency.

**Decisions**

- Translate infrastructure, shell, and high-traffic controls before translating every lab string.
- Reuse shared Tabs, Dialog, Alert, Spinner, and Popover components.
- Keep failures visible and actionable; keep the SessionBar a view over shared state rather than a new state owner.
- Keep durable recordings and workspace persistence as separate feature areas.

