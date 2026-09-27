# Arabic Maqamat roadmap

This roadmap reflects the current implementation. Shared workspace persistence, the audio transport controller, accessible shell tabs, bilingual font styling, and MusicXML viewing/download are already present. The work below focuses on completing and hardening those foundations.

## Practice, recordings, and saved material

Make practice state reliable across maqam changes, preserve recordings and user-created material across reloads, and use real practice activity for progress summaries.

1. Define shared serializable models for maqam references, practice events, saved material, and recording metadata. Reuse the validated pitch serialization in [workspace-state.ts](src/state/workspace-state.ts); never persist class instances, media streams, or audio objects.
2. Add a maqam revision/change signal from [App.tsx](src/App.tsx) to labs that keep maqam-dependent local state.
3. Clear or regenerate stale exercises, quiz selections, feedback, playback, and timers in [TrainingLab.tsx](src/components/TrainingLab.tsx) when the maqam changes.
4. Reset qafla state and playback in [SayrQaflaLab.tsx](src/components/SayrQaflaLab.tsx), and keep transposition controls synchronized in [TranspositionLab.tsx](src/components/TranspositionLab.tsx).
5. Add versioned IndexedDB storage for recording blobs and metadata, with graceful handling for unavailable or full storage.
6. Support recording reload, rename, notes, delete, download, and playback. Detect supported MIME types, release object URLs, and stop recording resources on cancellation or unmount.
7. Record structured practice events by maqam, skill, difficulty, interval, and correctness. Derive progress summaries and use weak areas to choose future exercises.
8. Connect existing training counters and badges in [training-progress.ts](src/theory/training-progress.ts) to completed activity while retaining current XP, streak, and local stats compatibility.
9. Add named saved material for Jins phrases, Qafla sequences, and generated melodies.
10. Add versioned, validated JSON import/export and bounded share payloads; report malformed or unsupported data clearly.
11. Validate reload persistence, rename/delete, object URL cleanup, quota/storage failures, microphone denial, malformed imports, quarter-tone round trips, and maqam-change scenarios.

**Decisions**

- Keep workspace settings/drafts in the existing local storage layer; use IndexedDB for recordings and saved material.
- Use JSON and MusicXML for exchange. Revisit MIDI after the serializable material model and MusicXML fidelity are stable.
- Keep migrations explicit and versioned; preserve existing theme, XP, streak, and training-statistics compatibility.

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

## MusicXML fidelity

MusicXML export and display/download are already wired through [musicxml-exporter.ts](src/score/musicxml-exporter.ts) and [ScoreViewer.tsx](src/components/ScoreViewer.tsx). Harden the output before using it as the stable interchange path.

1. Escape XML text and attribute values, including maqam names and user-provided phrase titles.
2. Preserve note durations and phrase timing instead of assigning every note a quarter-note duration.
3. Verify quarter-tone accidentals and pitch spelling survive export and re-import in supported notation software.
4. Add validation for empty phrases, unusual durations, and unsupported pitch data, with clear user-facing feedback.
