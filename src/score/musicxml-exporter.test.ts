// src/score/musicxml-exporter.test.ts
import { ArabicPitch } from '../core/pitch';
import { MaqamatCatalogue } from '../theory/maqam';
import {
  MusicXMLExporter,
  escapeXmlText,
  escapeXmlAttribute,
} from './musicxml-exporter';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

export function runMusicXMLTests() {
  console.log('--- Starting MusicXML Fidelity & Hardening Tests ---');

  // 1. Test XML Escaping
  console.log('1. Testing XML Escaping...');
  const unsafeText = 'Maqam & Sons <Special> "Edition" & \'Variants\'';
  const escapedText = escapeXmlText(unsafeText);
  assert(
    escapedText === 'Maqam &amp; Sons &lt;Special&gt; "Edition" &amp; \'Variants\'',
    `escapeXmlText incorrect: ${escapedText}`
  );

  const escapedAttr = escapeXmlAttribute(unsafeText);
  assert(
    escapedAttr === 'Maqam &amp; Sons &lt;Special&gt; &quot;Edition&quot; &amp; &apos;Variants&apos;',
    `escapeXmlAttribute incorrect: ${escapedAttr}`
  );
  console.log('✓ XML Escaping verified.');

  // 2. Test Scale MusicXML generation for Maqam Rast (has E𝄳 and B𝄳 quarter-tones)
  console.log('2. Testing Scale Export for Rast & Escaping...');
  const rast = MaqamatCatalogue.findById('rast')!;
  const rastXml = MusicXMLExporter.generateScaleMusicXML(rast);
  assert(rastXml.includes('<step>E</step>'), 'Missing E in Rast XML');
  assert(rastXml.includes('<alter>-0.5</alter>'), 'Missing alter -0.5 in Rast XML');
  assert(rastXml.includes('<accidental>quarter-flat</accidental>'), 'Missing accidental quarter-flat in Rast XML');
  assert(rastXml.includes('version="4.0"'), 'Missing MusicXML 4.0 header');
  console.log('✓ Rast Scale MusicXML generation verified.');

  // 3. Test Phrase Export with real durations (16th, 8th, dotted 8th, quarter, half)
  console.log('3. Testing Melodic Phrase Export with Rhythmic Durations...');
  const testNotes = [
    { pitch: new ArabicPitch('D', '♮', 4), durationQuarter: 0.5, arabicName: 'Dukah' }, // eighth
    { pitch: new ArabicPitch('E', '𝄳', 4), durationQuarter: 0.5, arabicName: 'Sikah' }, // eighth quarter-flat
    { pitch: new ArabicPitch('F', '♮', 4), durationQuarter: 1.0, arabicName: 'Jaharkah' }, // quarter
    { pitch: new ArabicPitch('G', '♮', 4), durationQuarter: 0.75, arabicName: 'Nawa' }, // dotted eighth
    { pitch: new ArabicPitch('A', '♮', 4), durationQuarter: 0.25, arabicName: 'Husayni' }, // sixteenth
    { pitch: new ArabicPitch('B', '𝄳', 4), durationQuarter: 1.0, arabicName: 'Awj' }, // quarter quarter-flat
    { pitch: new ArabicPitch('C', '♮', 5), durationQuarter: 2.0, arabicName: 'Kirdan' }, // half
  ];

  const phraseXml = MusicXMLExporter.generatePhraseMusicXML('Test <Rast> & Sikah Phrase', testNotes, {
    timeSignature: '4/4',
    tempoBpm: 92,
  });

  assert(phraseXml.includes('<work-title>Test &lt;Rast&gt; &amp; Sikah Phrase</work-title>'), 'Title not properly escaped');
  assert(phraseXml.includes('<type>eighth</type>'), 'Missing eighth note type');
  assert(phraseXml.includes('<type>16th</type>'), 'Missing 16th note type');
  assert(phraseXml.includes('<type>half</type>'), 'Missing half note type');
  assert(phraseXml.includes('<dot/>'), 'Missing dot for dotted eighth note');
  assert(phraseXml.includes('<sound tempo="92"/>'), 'Missing tempo sound tag');
  console.log('✓ Melodic phrase with rhythmic durations verified.');

  // 4. Test Validation: Empty phrase, unsupported pitch, unusual durations
  console.log('4. Testing Validation Suite...');
  const emptyValidation = MusicXMLExporter.validatePhrase([]);
  assert(!emptyValidation.isValid, 'Empty phrase should be invalid');
  assert(!emptyValidation.canExport, 'Empty phrase should not be exportable');
  assert(emptyValidation.errors.length > 0, 'Empty phrase should produce errors');

  const invalidPitchValidation = MusicXMLExporter.validatePhrase([
    { pitch: { diatonic: 'Z' as unknown as ArabicPitch['diatonic'], accidental: '♮', octave: 4 } as ArabicPitch, durationQuarter: 1 },
  ]);
  assert(!invalidPitchValidation.isValid, 'Invalid diatonic base should be invalid');

  const unusualDurationValidation = MusicXMLExporter.validatePhrase([
    { pitch: new ArabicPitch('C', '♮', 4), durationQuarter: 0 },
  ]);
  assert(!unusualDurationValidation.isValid, '0 duration should be invalid');

  const warningValidation = MusicXMLExporter.validatePhrase(
    [{ pitch: new ArabicPitch('C', '♮', 4), durationQuarter: 6.0 }],
    { timeSignature: '4/4' }
  );
  assert(warningValidation.isValid, 'Duration overflow is a warning, not fatal error');
  assert(warningValidation.warnings.length > 0, 'Duration overflow should produce warning');
  console.log('✓ Validation suite verified.');

  // 5. Test Roundtrip Fidelity: verify quarter-tones & pitch spelling survive export and re-import
  console.log('5. Testing Roundtrip Fidelity for Quarter-Tones and Pitch Spelling...');
  const roundtripNotes = [
    { pitch: new ArabicPitch('C', '♮', 4), durationQuarter: 1.0 },
    { pitch: new ArabicPitch('D', '𝄵', 4), durationQuarter: 0.5 }, // quarter-sharp
    { pitch: new ArabicPitch('E', '𝄳', 4), durationQuarter: 0.5 }, // quarter-flat (Sikah)
    { pitch: new ArabicPitch('F', '♯', 4), durationQuarter: 1.0 }, // sharp
    { pitch: new ArabicPitch('G', '♮', 4), durationQuarter: 1.5 }, // dotted quarter
    { pitch: new ArabicPitch('A', '♭', 4), durationQuarter: 0.5 }, // flat
    { pitch: new ArabicPitch('B', '𝄳', 4), durationQuarter: 1.0 }, // quarter-flat (Awj)
    { pitch: new ArabicPitch('C', '♮', 5), durationQuarter: 2.0 }, // half note
  ];

  const exportedPhrase = MusicXMLExporter.generatePhraseMusicXML('Roundtrip Test Suite', roundtripNotes, {
    timeSignature: '4/4',
    tempoBpm: 88,
  });

  const report = MusicXMLExporter.verifyRoundTrip(roundtripNotes, exportedPhrase);
  assert(report.success, `Roundtrip failed: ${report.failures.join('; ')}`);
  assert(report.exactPitchMatches === roundtripNotes.length, 'All pitches should match exactly');
  assert(report.quarterTonesPreserved === 3, `Expected 3 quarter-tones preserved, got ${report.quarterTonesPreserved}`);
  assert(report.exactDurationMatches === roundtripNotes.length, 'All durations should match');
  console.log(`✓ Roundtrip verified: ${report.exactPitchMatches}/${report.notesTested} pitches matched, ${report.quarterTonesPreserved} quarter-tones preserved!`);

  // 6. Test Scale Roundtrip Fidelity across ALL Maqamat in Catalogue
  console.log('6. Testing Catalogue-wide Scale Roundtrip Fidelity...');
  const allMaqamat = MaqamatCatalogue.getAllMaqamat();
  for (const m of allMaqamat) {
    const scale = m.getScale();
    const xml = MusicXMLExporter.generateScaleMusicXML(m);
    // Ascending + descending without duplicate peak
    const expectedPitches = [...scale, ...[...scale].reverse().slice(1)];
    const scaleReport = MusicXMLExporter.verifyRoundTrip(expectedPitches, xml);
    assert(
      scaleReport.success,
      `Scale roundtrip failed for ${m.name}: ${scaleReport.failures.join('; ')}`
    );
    console.log(`  ✓ ${m.name} (${scale.length} degrees): 100% roundtrip fidelity verified.`);
  }

  console.log('--- All MusicXML Base Unit Tests Passed ---');
  return true;
}
