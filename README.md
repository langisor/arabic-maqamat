# Arabic Maqamat 24-EDO Studio

An interactive React studio for exploring Arabic maqamat, ajnas (jins), quarter-tone pitch, violin fingering, practice, audio synthesis, and MusicXML notation. The application is a client-side Vite PWA; it has no application server or required environment variables.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements and setup](#requirements-and-setup)
- [Development commands](#development-commands)
- [Repository map](#repository-map)
- [Application architecture](#application-architecture)
- [Domain model and pitch conventions](#domain-model-and-pitch-conventions)
- [State and persistence](#state-and-persistence)
- [Audio and transport](#audio-and-transport)
- [MusicXML](#musicxml)
- [UI, language, and accessibility](#ui-language-and-accessibility)
- [PWA and offline behavior](#pwa-and-offline-behavior)
- [Common development tasks](#common-development-tasks)
- [Quality checks and troubleshooting](#quality-checks-and-troubleshooting)
- [Deployment](#deployment)

## Features

The studio navigation opens these labs:

- **Maqam & 8 Families:** browse the maqam catalogue, family information, scale structure, and tonic.
- **Transposition Lab:** transpose a maqam to a target tonic while retaining its interval structure.
- **Violin Fingerboard:** explore scale and custom-sequence fingerings.
- **Sayr & Qafla:** inspect melodic trajectories, modulation, and cadential phrases.
- **Score & MusicXML:** render notation, inspect or copy MusicXML, and download exports.
- **24-EDO Tuning:** inspect quarter-tone pitch positions and note relationships.
- **Jins Classifier:** analyze a pitch phrase against the available ajnas.
- **Practice & Training:** build and quiz scales, practice pitch recognition and sight-reading, and record takes for playback and comparison.

The app also provides synthesized violin, oud, and kanun timbres, drone and metronome controls, theme and language selection, shareable lab/maqam URLs, and installable PWA support.

## Technology

- React 19 and TypeScript 6
- Vite 8 and Tailwind CSS 4
- shadcn-style UI components backed by Base UI
- Tone.js for synthesized audio and transport
- OpenSheetMusicDisplay for sheet rendering
- vite-plugin-pwa / Workbox for the service worker and web app manifest

## Requirements and setup

Use a current Node.js release compatible with the installed Vite version. The repository includes `bun.lock`; Bun can be used as the package manager. npm also works with the package manifest.

```bash
# Bun
bun install
bun run dev

# Or npm
npm install
npm run dev
```

The development server listens on port `3000` and binds to `0.0.0.0`. Open `http://localhost:3000` in a browser. No `.env` file or API credentials are required.

Audio playback must be started from a user interaction in browsers that require a gesture to unlock Web Audio. Microphone recording requires a secure context (localhost is treated as secure) and browser microphone permission.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run lint` | Run ESLint across the repository. |
| `npm run build` | Type-check with project build mode and create the production PWA in `dist/`. |
| `npm run preview` | Serve the generated production build locally. Run `npm run build` first. |
| `npm run format` | Format TypeScript and TSX files with Prettier. This command writes files. |

There is currently no dedicated automated test script in `package.json`.

## Repository map

```text
src/
  App.tsx                       App shell, lab navigation, global maqam/audio state
  main.tsx                      React root, theme and language providers
  audio/
    audio-transport.ts          Shared audio readiness, sessions, timers, cancellation
    microtonal-audio.ts         Tone.js instruments, notes, sequences, drones
    metronome-engine.ts         Metronome scheduling and sound choices
  components/
    *Lab.tsx                    Individual learning and exploration labs
    ScoreViewer.tsx             MusicXML view, sheet rendering, export controls
    ui/                         Shared UI primitives
  core/
    pitch.ts                    ArabicPitch and 24-EDO arithmetic
    note-spine.ts               Note-spine and pitch reference data
  score/
    musicxml-exporter.ts        MusicXML generation, validation, parsing, round-trip helpers
  state/
    workspace-state.ts          Workspace schema, sanitization, local persistence, URL sync
    recording-storage.ts        IndexedDB store for practice recording blobs and metadata
    language.tsx                English/Arabic messages and document direction
  theory/
    jins.ts                     Jins definitions and pitch construction
    maqam.ts                    Maqam model, catalogue, families, transposition
    sayr.ts                     Sayr paths and modulation/Qafla analysis
    jins-detector.ts            Phrase-to-jins analysis
    melody-generator.ts         Sight-reading melody generation
    training-progress.ts        Practice XP, streak, badge and statistic persistence
  violin/
    ergonomics.ts               Violin register, string and fingering helpers
```

## Application architecture

`src/main.tsx` mounts the app in React Strict Mode and installs the `ThemeProvider` and `LanguageProvider`. `src/App.tsx` owns the selected maqam, active lab, instrument timbre, global audio settings, drone, and transport status. It passes the active maqam and callbacks into the lab components.

Lab selection and maqam selection are synchronized with the URL query string. For example:

```text
/?lab=training&maqam=rast
```

The supported lab IDs are `explorer`, `transposition`, `violin`, `sayr`, `score`, `tuning`, `detector`, and `training`. The maqam parameter is checked against the catalogue before use. Browser back/forward navigation restores valid lab and maqam selections.

Keep music-theory calculations in `core/`, `theory/`, `score/`, `audio/`, or `violin/` modules where practical. Lab components should focus on UI and coordinate shared operations through props or the shared state/engine modules.

## Domain model and pitch conventions

`ArabicPitch` in `src/core/pitch.ts` represents a diatonic note, a microtonal accidental, and an octave. Its absolute pitch unit is a quarter-tone:

- 24 quarter-tone steps equal one octave.
- Each step equals 50 cents.
- `toQuarterToneIndex()` gives the absolute index; `diffQuarterTones()` returns the directed interval from one pitch to another.
- `toFrequency()` maps the pitch to a frequency relative to A4, with 440 Hz as the default reference.
- Use `equals()` for pitch equivalence. Enharmonic spellings can have the same quarter-tone index.

The accidental set includes double-flat, flat, quarter-flat, natural, quarter-sharp, sharp, and double-sharp. When persisting pitches, use `serializePitch` and `deserializePitch` from `src/state/workspace-state.ts`; do not serialize class instances directly.

A `Jins` is a root plus an interval formula in quarter-tones. A `Maqam` combines lower and upper ajnas using an `Ittisal`, `Infisal`, or `Tadakhul` connection, and may include extension pitches. Use `MaqamatCatalogue` to find or create catalogue maqamat. Use `Maqam.transpose()` for transposition rather than rebuilding intervals in UI code.

## State and persistence

The app stores user data locally in the browser; there is no account sync or server-side storage.

- **Workspace:** `workspace-state.ts` stores selected maqam/lab, timbre, audio settings, metronome settings, and lab drafts in localStorage under `arabic_maqamat_workspace_v1`. It sanitizes values when loading and supports versioned state.
- **Training progress:** `training-progress.ts` stores XP, streak, counters, and unlocked badge IDs under `arabic_maqamat_training_stats_v1`.
- **Theme:** the theme provider uses localStorage key `theme`.
- **Language:** `language.tsx` stores `en` or `ar` under `arabic-maqamat-language` and sets the document `lang` and `dir` attributes.
- **Practice recordings:** `recording-storage.ts` uses IndexedDB database `arabic-maqamat-recordings`, version 1, object store `takes`. Each take includes its audio Blob and metadata. The UI creates temporary object URLs for playback/download and revokes them when takes are deleted or the lab unmounts.

When changing stored schemas, validate untrusted data, keep storage versions explicit, and preserve fallback behavior for unavailable or quota-limited browser storage. Never persist `Maqam`/`ArabicPitch` instances, Tone objects, Audio nodes, streams, MediaRecorder instances, or object URLs.

## Audio and transport

`MicrotonalAudioEngine` in `src/audio/microtonal-audio.ts` owns the Tone.js synthesizers, DSP chain, drone, and sequence playback. `MetronomeAudioEngine` owns metronome scheduling. Audio contexts may begin suspended until the user interacts with the page.

`AudioTransport` is the shared owner of named sessions and their timers/cancellation callbacks. Use unique, descriptive scopes for playback features. Finish a session when playback completes; stop its scope when playback is interrupted; register cancellation cleanup for resources such as MediaRecorder or microphone tracks. Avoid independent timers that can outlive a lab or continue after a maqam change.

Do not create a second long-lived audio engine inside a lab. For recording, stop media tracks and release analyser/animation resources when recording ends or the component unmounts.

## MusicXML

`MusicXMLExporter` in `src/score/musicxml-exporter.ts` generates and validates MusicXML and includes parsing/round-trip helpers. `ScoreViewer` shows the generated XML and, where available, renders sheet notation through OpenSheetMusicDisplay. Keep pitch and duration data intact when adding notation features. XML titles and other text values must be escaped before interpolation into XML.

The notation layer represents microtonal alteration in quarter-tone steps. Confirm quarter-tone accidentals in the target notation software because application support can vary.

## UI, language, and accessibility

- Use the shared primitives in `src/components/ui/` for buttons, dialogs, tabs, labels, inputs, and other common controls.
- The `@/` alias points to `src/` (for example, `@/components/ui/button`). `components.json` contains the shadcn configuration.
- English and Arabic messages live in `src/state/language.tsx`. Add keys to both language maps and use the language context for shared, translated UI.
- Arabic mode sets document direction to RTL. Prefer logical CSS properties such as `ms-*`, `me-*`, `text-start`, and `ps-*` where direction matters.
- Give icon-only controls accessible names. Preserve keyboard access, focus indication, and appropriate live/status semantics for state changes.
- Global design tokens and typography are defined in `src/index.css`; document metadata, font links, and initial language direction are in `index.html`.

## PWA and offline behavior

Vite PWA configuration is in `vite.config.ts`. A service worker is generated during builds and enabled in development. The manifest and selected static assets are precached; Google Fonts stylesheets and font files use runtime caching. The app can be installed where supported and can load cached assets offline after a successful online visit. External fonts may not be available until cached. Browser audio synthesis itself does not require downloaded audio samples.

Generated files under `dist/` and `dev-dist/` are build/service-worker output and should not be edited as source.

## Common development tasks

### Add or edit a maqam

1. Define or reuse a valid jins formula in `src/theory/jins.ts`.
2. Add the maqam structure/catalogue entry in `src/theory/maqam.ts`, including family, connection, ghammaz, and any extensions.
3. Use valid `ArabicPitch` instances and check that the connection constraints match the pitch intervals.
4. Confirm catalogue lookup and transposition behavior in the relevant UI.

### Add a lab

1. Create a focused component under `src/components/` and use shared UI primitives.
2. Add its `ValidLab` ID to `src/state/workspace-state.ts` (`ValidLab` and `VALID_LABS`).
3. Add the navigation item and render branch in `src/App.tsx`.
4. Persist only user preferences/drafts through `updateWorkspaceDraft`; use serializable values.
5. If the lab schedules audio, use `AudioTransport` and clean up its sessions when the lab stops or unmounts.
6. Add language keys for shared/translated controls and check RTL layout.

### Add a persisted workspace field

Update the `WorkspaceGlobalState` or `WorkspaceDrafts` type, default state, and `sanitizeWorkspaceState` validation together. Keep persisted data backward-compatible by supplying defaults for absent values. Increment the schema version when a migration is needed.

### Add a UI primitive

Use the configured shadcn CLI when appropriate:

```bash
npx shadcn@latest add dialog
```

Review the generated component and its dependencies before committing it. Prefer extending the existing primitives in `src/components/ui/` when the project already has the required behavior.

## Quality checks and troubleshooting

Before submitting a change, run the checks relevant to it:

```bash
npm run typecheck
npm run lint
npm run build
```

Common issues:

- **No sound:** click a playback control to unlock audio; check browser tab/device output and site audio permissions. Stop stale transport sessions before starting a replacement.
- **Microphone unavailable:** use localhost or HTTPS, grant microphone permission, and ensure another application/browser tab is not holding the device exclusively.
- **Sheet music blank:** inspect the generated MusicXML view first. Rendering depends on browser SVG support and OpenSheetMusicDisplay; the XML/download path is a useful fallback.
- **Workspace did not persist:** check browser storage/privacy settings and console errors. Local data is per browser origin and is not synchronized across devices.
- **Old UI after a PWA update:** reload after the service worker updates, or clear the site’s cached data during local debugging.
- **Build output is large:** the current app bundles substantial audio and notation dependencies. Check the Vite build report before introducing more large libraries.

## Deployment

The production build is a static site in `dist/` and can be served by any static host that supports SPA fallback to `index.html`. Build it with:

```bash
npm run build
```

Configure the host to serve the generated service worker and web manifest with the correct content types, and route application URLs (including query-string lab links) to `index.html`. HTTPS is required for production service workers and microphone access. No backend, secrets, or environment variables are needed by the current application.
