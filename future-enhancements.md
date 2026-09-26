# Arabic Maqamat implementation plans

## Plan: Unified Audio Transport

Centralize playback ownership and cleanup while keeping the existing synthesis engines. The first pass focuses on deterministic stop/cancellation, status, shared audio-context startup, and lifecycle cleanup. True pause/resume is deferred.

**Steps**

1. Add an `AudioTransport` coordinator for session tokens, cancellation, transport status, subscriptions, audio-context readiness, and registered timers.
2. Integrate [microtonal-audio.ts](src/audio/microtonal-audio.ts) so sequences, drones, and delayed callbacks use coordinated cancellation.
3. Add global transport status and stop controls in [App.tsx](src/App.tsx), including cleanup on maqam and lab changes.
4. Replace raw delayed playback timers in [App.tsx](src/App.tsx), [TranspositionLab.tsx](src/components/TranspositionLab.tsx), and [TuningWheel24EDO.tsx](src/components/TuningWheel24EDO.tsx).
5. Add scoped cleanup to all playback labs, especially Training count-ins, duet timers, recordings, and unmount behavior.
6. Integrate metronome scheduling with global cleanup without breaking Training's synchronized playback.
7. Validate with typecheck, lint, build, and cross-lab playback checks.

**Decisions**

- Stop/cleanup and status now; true pause/resume later.
- Preserve existing audio APIs and synthesis graphs.
- Use scoped sessions so one lab cannot accidentally stop another lab's playback.
- Defer shared limiter/output-bus redesign to a separate enhancement.

## Plan: Workspace Continuity

Implement persistence, linkable navigation, mobile navigation, and the existing PWA functionality as one workspace-state layer. The URL contains navigation only; private settings and drafts remain local.

**Steps**

1. Add a versioned workspace-state module for localStorage persistence, defaults, validation, and migrations.
2. Persist global state from [App.tsx](src/App.tsx): maqam, active lab, timbre, audio settings, and metronome preferences.
3. Add persistence boundaries for meaningful editable drafts in the Explorer, Transposition, Violin, Sayr/Qafla, Jins, and Training labs.
4. Keep transient playback, generated exercises, audio contexts, media streams, object URLs, and recording blobs out of localStorage.
5. Add URL synchronization for active lab and selected maqam using validated catalogue IDs and `history.replaceState`.
6. Support browser back/forward navigation without synchronization loops.
7. Refactor the tab row into an accessible mobile navigation pattern with active semantics, keyboard support, and safe-area handling.
8. Mount and improve [PWAInstallButton.tsx](src/components/PWAInstallButton.tsx).
9. Add offline, service-worker-ready, update-available, and reload feedback.
10. Verify production precaching for the app shell, local assets, fonts, icons, and maqam data.
11. Validate reload persistence, direct links, browser history, invalid URLs, mobile navigation, installation, offline launch, and service-worker updates.

**Decisions**

- Persist global state plus editable drafts.
- URLs contain only active lab and selected maqam.
- Preserve existing theme and training-statistics storage.
- Defer durable recording storage and A/B comparison to the practice/content plan.

## Plan: Practice and Content

Implement durable recordings, event-based progress analytics, saved/shareable user material, and complete maqam-change resets. Use IndexedDB for recordings and saved content, serializable pitch/reference types for persistence and links, and the existing MusicXML path after fixing its fidelity issues. MIDI is deferred.

**Steps**

1. Add shared serializable models for pitches, maqam references, practice events, saved material, and recording metadata.
2. Add a maqam revision/change signal from [App.tsx](src/App.tsx) to dependent labs.
3. Fix stale state in [TrainingLab.tsx](src/components/TrainingLab.tsx), including quiz selections, ear-training feedback, playback, timers, and maqam-dependent exercises.
4. Reset qafla state and playback in [SayrQaflaLab.tsx](src/components/SayrQaflaLab.tsx).
5. Synchronize transposition controls in [TranspositionLab.tsx](src/components/TranspositionLab.tsx).
6. Add versioned IndexedDB storage for recording metadata and blobs.
7. Add recording load, rename, notes, delete, download, playback, object-URL cleanup, and MIME-type detection.
8. Record structured practice events by maqam, skill, difficulty, interval, and correctness.
9. Build derived progress summaries and use weak areas to influence future exercises.
10. Update unused training counters and badge unlocks from real events while preserving existing XP/streak behavior.
11. Add named saved material for Jins phrases, Qafla sequences, and generated melodies.
12. Add validated JSON import/export and bounded share payloads.
13. Improve [musicxml-exporter.ts](src/score/musicxml-exporter.ts) to escape XML and preserve note durations.
14. Defer MIDI until the serializable material model and MusicXML output are stable.
15. Validate reload persistence, rename/delete, object-URL cleanup, storage failure, microphone failures, malformed imports, quarter-tone round trips, and maqam-change scenarios.

**Decisions**

- Use IndexedDB for recordings and saved material.
- Use JSON and improved MusicXML first; defer MIDI.
- Preserve existing theme, XP, streak, and training-statistics compatibility.
- Never serialize `Maqam` or `ArabicPitch` class instances, generated random state, media streams, or audio objects directly.

## Plan: Clarity and Accessibility

Implement backlog items 10-12 through shared recovery, localization, accessibility, and session-context infrastructure.

The first language pass will establish English/Arabic foundations and translate the shell and high-traffic controls, rather than every lab string.

**Steps**

1. Add shared loading, error, retry, and status patterns for score rendering, sight-reading, audio startup, recording, and async playback.
2. Improve [ScoreViewer.tsx](src/components/ScoreViewer.tsx) with retry controls, clipboard feedback, compatibility guidance, and accessible live states.
3. Surface OSMD, melody-generation, audio, microphone, and audio-playback failures in [TrainingLab.tsx](src/components/TrainingLab.tsx).
4. Add explicit audio readiness and recovery through the shared transport controller.
5. Convert shell navigation to accessible tabs or equivalent navigation using existing UI primitives.
6. Replace custom DSP and install modals with the existing Dialog primitive and add focus management.
7. Label DSP controls, selected settings, note tiles, delete actions, popovers, and score controls for keyboard and screen-reader use.
8. Add English/Arabic language state, document `lang`/`dir`, RTL-safe CSS, and explicit Latin/Arabic font loading.
9. Add shared explanations for quarter-tone notation and terms such as qarar, ghammaz, sayr, qafla, jins, tanjees, and intiqal.
10. Normalize inconsistent notation labels across [pitch.ts](src/core/pitch.ts), [ScoreViewer.tsx](src/components/ScoreViewer.tsx), and [JinsDetectorLab.tsx](src/components/JinsDetectorLab.tsx).
11. Add a reusable `SessionBar` beneath the header showing maqam, tonic, ghammaz, scale, drone, transport state, and quick links.
12. Source the SessionBar from shared workspace and transport state, with responsive mobile behavior.
13. Validate with typecheck, lint, build, forced rendering/audio failures, denied permissions, keyboard navigation, dialog focus handling, bilingual RTL layouts, and cross-lab SessionBar consistency.

**Relevant files**

- [App.tsx](src/App.tsx)
- [ScoreViewer.tsx](src/components/ScoreViewer.tsx)
- [TrainingLab.tsx](src/components/TrainingLab.tsx)
- [PWAInstallButton.tsx](src/components/PWAInstallButton.tsx)
- [microtonal-audio.ts](src/audio/microtonal-audio.ts)
- [index.css](src/index.css)
- [index.html](index.html)
- Existing UI primitives under [src/components/ui](src/components/ui)

**Decisions**

- Translate infrastructure, shell, and high-traffic controls first.
- Reuse shared Tabs, Dialog, Alert, Spinner, and Popover components.
- Make all failures visible and actionable.
- Keep SessionBar as a view over shared state, not another state owner.
- Keep durable recordings and workspace persistence as separate feature areas.
