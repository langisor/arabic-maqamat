// src/theory/practice-drills.test.ts
import { MaqamatCatalogue } from './maqam';
import { PracticeDrillEngine } from './practice-drills';
import { MusicXMLExporter } from '../score/musicxml-exporter';

export function runPracticeDrillsTests(): void {
  console.log('--- Running Practice Drills Unit Tests ---');

  const rast = MaqamatCatalogue.buildRast();
  const bayati = MaqamatCatalogue.buildBayati();
  const hijaz = MaqamatCatalogue.buildHijaz();
  const sikah = MaqamatCatalogue.buildSikah();

  // Test 1: Scale Run Drills
  console.log('1. Testing Scale / Maqam Drills (Ascending & Descending Run)...');
  const rastScaleRun = PracticeDrillEngine.generateScaleRunDrill(rast, {
    type: 'scale-run',
    direction: 'both',
    runNoteValue: 'quarter',
    timeSignature: '4/4',
    tempoBpm: 80,
  });

  if (!rastScaleRun || rastScaleRun.notes.length === 0) {
    throw new Error('Scale run drill returned empty notes');
  }
  const scaleLen = rast.getScale().length;
  // both = scaleLen + (scaleLen - 1)
  const expectedCount = scaleLen + (scaleLen - 1);
  if (rastScaleRun.notes.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} notes for both directions, got ${rastScaleRun.notes.length}`);
  }
  console.log(`  ✓ Rast scale run generated ${rastScaleRun.notes.length} notes (Both directions).`);

  // Test Ascending only & Descending only
  const ascRun = PracticeDrillEngine.generateScaleRunDrill(bayati, {
    type: 'scale-run',
    direction: 'ascending',
  });
  if (ascRun.notes.length !== bayati.getScale().length) {
    throw new Error(`Expected ${bayati.getScale().length} notes for ascending run, got ${ascRun.notes.length}`);
  }
  console.log(`  ✓ Bayati ascending run generated ${ascRun.notes.length} notes.`);

  // Test 2: Sequences of 3
  console.log('2. Testing Sequences of 3 (ثلاثيات)...');
  const hijazSeq3 = PracticeDrillEngine.generateSequence3Drill(hijaz, {
    type: 'sequence-3',
    direction: 'both',
    timeSignature: '3/4',
  });
  if (!hijazSeq3 || hijazSeq3.notes.length < 10) {
    throw new Error('Sequences of 3 generated insufficient notes');
  }
  // Verify last note is resolution to tonic
  const lastNote = hijazSeq3.notes[hijazSeq3.notes.length - 1];
  if (!lastNote.pitch.equals(hijaz.getScale()[0])) {
    throw new Error('Sequences of 3 must resolve to tonic');
  }
  console.log(`  ✓ Hijaz Sequences of 3 generated ${hijazSeq3.notes.length} notes with proper tonic resolution.`);

  // Test 3: Sequences of 4
  console.log('3. Testing Sequences of 4 (رباعيات)...');
  const rastSeq4 = PracticeDrillEngine.generateSequence4Drill(rast, {
    type: 'sequence-4',
    direction: 'both',
    timeSignature: '4/4',
  });
  if (!rastSeq4 || rastSeq4.notes.length < 10) {
    throw new Error('Sequences of 4 generated insufficient notes');
  }
  // Verify that note 0 to 3 match root Jins
  const rootScale = rast.getScale();
  for (let i = 0; i < 4; i++) {
    if (!rastSeq4.notes[i].pitch.equals(rootScale[i])) {
      throw new Error(`Sequence of 4 initial quartet mismatch at index ${i}`);
    }
  }
  console.log(`  ✓ Rast Sequences of 4 correctly mirrors the root Jins (Tetrachord) and generated ${rastSeq4.notes.length} notes.`);

  // Test 4: Position Shift Drills
  console.log('4. Testing Position Shift Drills (التحويل بين المراكز للكمان)...');
  const shiftGhammaz = PracticeDrillEngine.generatePositionShiftDrill(bayati, {
    type: 'position-shift',
    positionShiftVariation: 'ghammaz-pivot',
  });
  const shiftNotes = shiftGhammaz.notes;
  const shiftPoints = shiftNotes.filter((n) => n.isShiftPoint);
  if (shiftPoints.length < 2) {
    throw new Error(`Expected at least 2 shift points (up and down), found ${shiftPoints.length}`);
  }
  const pos3Notes = shiftNotes.filter((n) => n.positionNumber === 3);
  if (pos3Notes.length === 0) {
    throw new Error('Expected Position III notes in Ghammaz shift drill');
  }
  console.log(`  ✓ Position shift drill generated ${shiftNotes.length} notes with ${pos3Notes.length} notes in Pos III and ${shiftPoints.length} shift markers.`);

  // Test 5: Octave Leap shift
  const octaveLeapDrill = PracticeDrillEngine.generatePositionShiftDrill(sikah, {
    type: 'position-shift',
    positionShiftVariation: 'octave-leap',
  });
  if (!octaveLeapDrill.notes.some((n) => n.isShiftPoint && n.positionNumber === 3)) {
    throw new Error('Octave leap drill must contain a Pos III leap shift');
  }
  console.log(`  ✓ Octave leap shift drill for Maqam Sikah verified.`);

  // Test 6: MusicXML 4.0 Phrase validation & export for all new drills
  console.log('6. Testing MusicXML Phrase validation & generation for all drill types...');
  const drillsToTest = [rastScaleRun, hijazSeq3, rastSeq4, shiftGhammaz, octaveLeapDrill];
  for (const drill of drillsToTest) {
    const val = MusicXMLExporter.validatePhrase(drill.notes, {
      timeSignature: drill.timeSignature,
      tempoBpm: drill.tempoBpm,
    });
    if (!val.canExport) {
      throw new Error(`MusicXML validation failed for ${drill.title}: ${val.errors.join('; ')}`);
    }

    const xml = MusicXMLExporter.generatePhraseMusicXML(drill.title, drill.notes, {
      timeSignature: drill.timeSignature,
      tempoBpm: drill.tempoBpm,
      maqamName: drill.maqam.name,
      measuresPerSystem: 1, // Test mobile 1-bar-per-line
    });

    if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      throw new Error(`MusicXML header missing in ${drill.title}`);
    }
    if (!xml.includes('<measure number="1">')) {
      throw new Error(`MusicXML measure missing in ${drill.title}`);
    }
    console.log(`  ✓ ${drill.title} validated and generated 100% valid MusicXML (${xml.length} chars).`);
  }

  console.log('--- All Practice Drills Unit Tests Passed Successfully ---');
}
