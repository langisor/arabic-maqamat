import { ArabicPitch } from "../core/pitch"
import { calculateStaffY } from "./staff-layout"

export interface SVGStaffNote {
  pitch: ArabicPitch
  /** Optional precomputed vertical coordinate; otherwise derived from `pitch`. */
  staffY?: number
  /** Optional horizontal coordinate; otherwise notes use the component's 60-unit spacing. */
  staffX?: number
  /** Diatonic staff-step offset from C4, used for stems and ledger lines. */
  stepOffset?: number
  /** Marks a note outside the jins core, shown with the baggage color. */
  isBaggage?: boolean
  /** Marks the tonal root, which has its own color and zero-cent label. */
  isTonic?: boolean
  /** Pitch displacement from the tonic, in cents, for the note's annotation. */
  offsetCents?: number
  offsetQuarterTones?: number
  arabicName?: string
  roleLabel?: string
  degreeLabel?: string
  sectionLabel?: string
}

export interface SVGStaffBoundary {
  label: string
  /** Horizontal extents are in the SVG viewBox coordinate system. */
  startX: number
  endX: number
  /** Width of the covered span, used to size the shaded boundary box. */
  width: number
  /** Center of the span, used to center its label and bracket. */
  centerX: number
}

interface SVGStaffProps {
  notes: SVGStaffNote[]
  baggageBoundaries?: SVGStaffBoundary[]
  coreBoundary?: SVGStaffBoundary | null
  title?: string
  onNoteHover?: (note: SVGStaffNote | null) => void
  onNoteClick?: (pitch: ArabicPitch) => void
  hoveredNote?: SVGStaffNote | null
  activeSoundingPitch?: ArabicPitch | null
  selectedDefName?: string
  selectedDefSizeLabel?: string
}

export function SVGStaff({
  notes,
  baggageBoundaries = [],
  coreBoundary = null,
  title = "Interactive Musical Staff",
  onNoteHover,
  onNoteClick,
  hoveredNote = null,
  activeSoundingPitch = null,
  selectedDefName,
  selectedDefSizeLabel,
}: SVGStaffProps) {
  // Keep a useful minimum canvas size while extending the viewBox for long sequences.
  const staffWidth = Math.max(
    850,
    105 + Math.max(0, notes.length - 1) * 60 + 70
  )
  // Explicit staffX values allow callers to control spacing; the fallback keeps
  // the first note clear of the clef and places later notes at regular intervals.
  const noteXAt = (index: number) => notes[index].staffX ?? 105 + index * 60

  // Collapse adjacent notes with the same section label into a single bracket.
  // A later recurrence of a label starts a new section rather than joining across gaps.
  const sectionLabels = notes.reduce<
    { label: string; startX: number; endX: number }[]
  >((sections, note, index) => {
    if (!note.sectionLabel) return sections
    const noteX = noteXAt(index)
    const lastSection = sections[sections.length - 1]
    if (lastSection?.label === note.sectionLabel) {
      lastSection.endX = noteX
    } else {
      sections.push({
        label: note.sectionLabel,
        startX: noteX,
        endX: noteX,
      })
    }
    return sections
  }, [])

  return (
    <div className="relative touch-pan-x scrollbar-thin overflow-x-auto rounded-2xl border border-slate-800/80 bg-linear-to-b from-slate-950 to-slate-900 p-2 shadow-inner sm:p-5">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-slate-300">
        <span className="font-semibold tracking-[0.18em] text-purple-300 uppercase">
          {title}
        </span>
        {selectedDefName && (
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-200">
            {selectedDefName}
            {selectedDefSizeLabel ? ` • ${selectedDefSizeLabel}` : ""}
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${staffWidth} 270`}
        className="h-auto w-full min-w-180 overflow-visible select-none"
        style={{ width: `max(100%, ${staffWidth}px)` }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filters emphasize the currently highlighted tonic, baggage, or core notes. */}
          <filter id="purpleGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="amberGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="baggageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="tonicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        {/* The panel and five horizontal lines form the staff's fixed visual frame. */}
        <rect
          x="10"
          y="10"
          width={staffWidth - 20}
          height="252"
          rx="14"
          fill="#0b0f19"
          stroke="#1e293b"
          strokeWidth="1"
        />
        <line
          x1="30"
          y1="56"
          x2={staffWidth - 30}
          y2="56"
          stroke="#475569"
          strokeWidth="1.2"
        />
        <line
          x1="30"
          y1="72"
          x2={staffWidth - 30}
          y2="72"
          stroke="#475569"
          strokeWidth="1.2"
        />
        <line
          x1="30"
          y1="88"
          x2={staffWidth - 30}
          y2="88"
          stroke="#475569"
          strokeWidth="1.2"
        />
        <line
          x1="30"
          y1="104"
          x2={staffWidth - 30}
          y2="104"
          stroke="#475569"
          strokeWidth="1.2"
        />
        <line
          x1="30"
          y1="120"
          x2={staffWidth - 30}
          y2="120"
          stroke="#475569"
          strokeWidth="1.2"
        />
        <line
          x1="30"
          y1="56"
          x2="30"
          y2="120"
          stroke="#64748b"
          strokeWidth="2"
        />
        <line
          x1={staffWidth - 30}
          y1="56"
          x2={staffWidth - 30}
          y2="120"
          stroke="#64748b"
          strokeWidth="2"
        />
        <g transform="translate(42, 36) scale(0.68)">
          {/* Treble clef path, sized and positioned to align with the staff lines. */}
          <path
            d="M18.4,78.2 C18.1,76.5 17.5,74.7 16.7,73.1 C14.6,68.9 11.2,66.1 7.2,65.2 C5.8,64.9 4.3,64.9 2.9,65.3 C0.9,65.9 -0.6,67.4 -1.1,69.4 C-1.6,71.4 -0.9,73.5 0.7,74.9 C2.3,76.3 4.6,76.8 6.6,76.2 C7.9,75.8 8.8,74.9 9.3,73.7 C9.5,73.2 9.4,72.7 9.1,72.3 C8.8,71.9 8.2,71.7 7.7,71.9 C6.8,72.3 5.7,72.2 4.9,71.5 C4.3,71.0 4.1,70.3 4.3,69.5 C4.5,68.7 5.2,68.1 6.0,67.9 C7.9,67.6 9.8,68.8 10.6,70.6 C11.9,73.5 11.5,77.1 9.5,79.7 C7.6,82.2 4.5,83.7 1.4,83.6 C-2.4,83.5 -5.8,81.4 -7.5,78.0 C-9.3,74.4 -9.3,70.0 -7.4,66.3 C-4.8,61.1 0.3,57.5 5.9,56.5 C8.1,56.1 10.3,56.2 12.5,56.8 L12.5,33.5 C10.9,34.8 9.2,36.3 7.7,37.9 C6.3,39.4 5.2,40.9 4.3,42.5 C4.0,43.0 3.5,43.3 2.9,43.3 C2.3,43.3 1.8,43.0 1.5,42.5 C0.9,41.5 1.2,40.1 2.2,39.2 C3.5,38.0 5.0,36.5 6.6,35.0 C8.5,33.2 10.5,31.7 12.5,30.3 L12.5,18.0 C12.5,13.2 14.1,8.6 17.0,5.0 C19.9,1.4 23.9,-0.6 28.5,-0.6 C32.6,-0.6 36.3,1.1 38.8,4.1 C41.3,7.1 42.4,11.2 41.9,15.3 C41.2,21.5 37.6,26.9 32.2,30.2 C27.8,32.9 22.8,34.4 17.6,34.8 L17.6,58.8 C21.4,60.2 24.8,62.6 27.2,65.8 C29.7,69.2 31.0,73.3 30.7,77.6 C30.2,83.7 26.6,89.1 21.2,92.1 C18.3,93.7 15.1,94.6 11.9,94.7 L11.9,103.5 C11.9,106.6 10.7,109.6 8.5,111.8 C6.3,114.0 3.3,115.2 0.2,115.2 C-3.0,115.2 -6.0,114.0 -8.2,111.8 C-10.4,109.6 -11.6,106.6 -11.6,103.5 C-11.6,100.4 -10.4,97.4 -8.2,95.2 C-6.0,93.0 -3.0,91.8 0.2,91.8 C2.0,91.8 3.8,92.2 5.4,93.0 L5.4,85.2 C9.8,84.9 14.2,82.8 16.9,79.5 C17.7,78.5 18.2,77.3 18.4,76.1 Z"
            fill="#94a3b8"
          />
        </g>
        {/* Baggage regions are shaded spans with a lower bracket and centered label. */}
        {baggageBoundaries.map((boundary) => (
          <g key={boundary.label}>
            <rect
              x={boundary.startX - 32}
              y={22}
              width={boundary.width + 64}
              height={205}
              rx="8"
              fill="#a855f7"
              fillOpacity="0.06"
              stroke="#a855f7"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <path
              d={`M ${boundary.startX - 14} 228
                  L ${boundary.startX - 14} 236
                  L ${boundary.centerX - 10} 236
                  L ${boundary.centerX} 242
                  L ${boundary.centerX + 10} 236
                  L ${boundary.endX + 14} 236
                  L ${boundary.endX + 14} 228`}
              fill="none"
              stroke="#c084fc"
              strokeWidth="1.8"
            />
            <text
              x={boundary.centerX}
              y={255}
              textAnchor="middle"
              fill="#e9d5ff"
              fontSize="11"
              fontWeight="bold"
              letterSpacing="0.05em"
            >
              Baggage • {boundary.label}
            </text>
          </g>
        ))}
        {/* The upper bracket marks the core jins range, distinct from baggage spans. */}
        {coreBoundary && (
          <g>
            <path
              d={`M ${coreBoundary.startX - 14} 34 
                  L ${coreBoundary.startX - 14} 26 
                  L ${coreBoundary.centerX - 10} 26 
                  L ${coreBoundary.centerX} 20 
                  L ${coreBoundary.centerX + 10} 26 
                  L ${coreBoundary.endX + 14} 26 
                  L ${coreBoundary.endX + 14} 34`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
            />
            <text
              x={coreBoundary.centerX}
              y={15}
              textAnchor="middle"
              fill="#fef3c7"
              fontSize="11"
              fontWeight="bold"
              letterSpacing="0.05em"
            >
              Core Jins Structure ({selectedDefSizeLabel ?? "Scale"})
            </text>
          </g>
        )}
        {/* Connect notes in sequence; use resolved coordinates so overrides are respected. */}
        {notes.length > 1 && (
          <polyline
            points={notes
              .map((note, index) => {
                const noteY = note.staffY ?? calculateStaffY(note.pitch).y
                return `${noteXAt(index)},${noteY}`
              })
              .join(" ")}
            fill="none"
            stroke="#94a3b8"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
        )}
        {/* Section brackets identify labeled note groups beneath the staff. */}
        {sectionLabels.map((section) => (
          <g key={`${section.label}-${section.startX}`}>
            <path
              d={`M ${section.startX - 12} 230
                  L ${section.startX - 12} 236
                  L ${(section.startX + section.endX) / 2 - 8} 236
                  L ${(section.startX + section.endX) / 2} 241
                  L ${(section.startX + section.endX) / 2 + 8} 236
                  L ${section.endX + 12} 236
                  L ${section.endX + 12} 230`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.2"
            />
            <text
              x={(section.startX + section.endX) / 2}
              y="254"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="8"
              fontWeight="600"
            >
              {section.label}
            </text>
          </g>
        ))}
        {/* Each note is rendered as one interactive group with pitch, role, and interval data. */}
        {notes.map((note, index) => {
          const noteX = noteXAt(index)
          const noteY = note.staffY ?? calculateStaffY(note.pitch).y
          const stepOffset = note.stepOffset ?? calculateStaffY(note.pitch).step
          const isHovered = hoveredNote?.pitch.equals(note.pitch)
          const isSounding = activeSoundingPitch?.equals(note.pitch)

          // The staff spans diatonic steps 0 through 12; add ledger lines only
          // when notes extend beyond it, at every other step (line positions).
          const ledgerLines: number[] = []
          if (stepOffset <= 0) {
            ledgerLines.push(136)
            if (stepOffset <= -2) ledgerLines.push(152)
            if (stepOffset <= -4) ledgerLines.push(168)
            if (stepOffset <= -6) ledgerLines.push(184)
          } else if (stepOffset >= 12) {
            ledgerLines.push(40)
            if (stepOffset >= 14) ledgerLines.push(24)
          }

          // Keep stems to the conventional side of each note, switching direction
          // around the middle of the displayed staff to reduce visual collisions.
          const isStemDown = stepOffset >= 6
          const stemX = isStemDown ? noteX - 7 : noteX + 7
          const stemEndY = isStemDown ? noteY + 34 : noteY - 34

          // Tonic, baggage, and core notes use coordinated stroke, fill, and glow colors.
          const noteColor = note.isTonic
            ? "#10b981"
            : note.isBaggage
              ? "#a855f7"
              : "#f59e0b"
          const noteFilter = note.isTonic
            ? "url(#emeraldGlow)"
            : note.isBaggage
              ? "url(#purpleGlow)"
              : "url(#amberGlow)"
          const noteFill = note.isTonic
            ? "url(#tonicGrad)"
            : note.isBaggage
              ? "url(#baggageGrad)"
              : "url(#coreGrad)"
          const pitchPillY = isStemDown ? noteY - 14 : Math.max(26, noteY - 44)
          return (
            <g
              key={`${note.pitch.toString()}-${index}`}
              onMouseEnter={() =>
                onNoteHover?.({
                  ...note,
                  staffX: noteX,
                  staffY: noteY,
                  stepOffset,
                })
              }
              onMouseLeave={() => onNoteHover?.(null)}
              onClick={() => onNoteClick?.(note.pitch)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onNoteClick?.(note.pitch)
                }
              }}
              role={onNoteClick ? "button" : undefined}
              tabIndex={onNoteClick ? 0 : undefined}
              aria-label={onNoteClick ? `Play ${note.pitch.toString()}` : undefined}
              style={{ cursor: onNoteClick ? "pointer" : "default" }}
            >
              {/* Ledger lines are drawn before the notehead so the note remains legible. */}
              {ledgerLines.map((ledgerY) => (
                <line
                  key={`${ledgerY}-${index}`}
                  x1={noteX - 18}
                  y1={ledgerY}
                  x2={noteX + 18}
                  y2={ledgerY}
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              ))}
              <line
                x1={noteX}
                y1={noteY}
                x2={stemX}
                y2={stemEndY}
                stroke={isHovered || isSounding ? "#e2e8f0" : noteColor}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Notehead and curved accent mark the pitch at its staff coordinate. */}
              <ellipse
                cx={noteX}
                cy={noteY}
                rx="10.5"
                ry="7.5"
                fill={noteFill}
                stroke={isHovered || isSounding ? "#ffffff" : noteColor}
                strokeWidth="1.3"
                filter={noteFilter}
              />
              <g transform={`rotate(-22 ${noteX} ${noteY})`}>
                <path
                  d={`M ${noteX - 10} ${noteY - 4} Q ${noteX} ${noteY - 12} ${noteX + 10} ${noteY - 4}`}
                  fill="none"
                  stroke={noteColor}
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </g>
              {/* Keep the written pitch above the note; stems-down notes use a lower offset. */}
              <rect
                x={noteX - 17}
                y={pitchPillY - 9}
                width="34"
                height="15"
                rx="4"
                fill="#0b0f19"
                fillOpacity="0.94"
                stroke={isHovered || isSounding ? "#ffffff" : noteColor}
                strokeWidth="1"
              />
              <text
                x={noteX}
                y={pitchPillY + 2}
                textAnchor="middle"
                fill={isHovered || isSounding ? "#ffffff" : "#f8fafc"}
                fontSize="10.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {note.pitch.toString()}
              </text>
              {/* The remaining labels show its Arabic name, tonic-relative cents, and role. */}
              <text
                x={noteX}
                y={196}
                textAnchor="middle"
                fill={noteColor}
                fontSize="11"
                fontWeight="bold"
                className="font-arabic"
              >
                {note.arabicName || note.pitch.toDisplayString()}
              </text>
              <text
                x={noteX}
                y={210}
                textAnchor="middle"
                fill={note.isBaggage ? "#e9d5ff" : "#94a3b8"}
                fontSize="9"
                fontFamily="monospace"
              >
                {note.isTonic
                  ? "0¢"
                  : note.isBaggage
                    ? `${note.offsetCents ?? 0}¢`
                    : `+${note.offsetCents ?? 0}¢`}
              </text>
              <text
                x={noteX}
                y={222}
                textAnchor="middle"
                fill={
                  note.isTonic
                    ? "#34d399"
                    : note.isBaggage
                      ? "#c084fc"
                      : "#fbbf24"
                }
                fontSize="8"
                fontWeight="600"
              >
                {note.degreeLabel || note.roleLabel || "Note"}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
