// src/audio/pitch-detector.test.ts
import { MicrotonalPitchDetector } from './pitch-detector';
import { ArabicPitch } from '../core/pitch';
import { MaqamatCatalogue } from '../theory/maqam';

export function runPitchDetectorTests(): void {
  console.log('--- Running Microtonal Pitch Detector Unit Tests ---');

  const sampleRate = 44100;
  const bufferSize = 2048;
  const detector = new MicrotonalPitchDetector(sampleRate, bufferSize);
  const rast = MaqamatCatalogue.buildRast();

  // Helper to generate a pure sine wave buffer
  function generateSineWave(freq: number, amplitude: number = 0.5): Float32Array {
    const buffer = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      buffer[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }
    return buffer;
  }

  // Test 1: Exact A440 Hz
  console.log('1. Testing exact A4 (440 Hz)...');
  const bufferA440 = generateSineWave(440.0);
  const resultA440 = detector.detectPitch(bufferA440, rast);
  if (!resultA440) {
    throw new Error('Failed to detect pitch for pure A440 sine wave');
  }
  if (resultA440.closestPitch.toDisplayString() !== 'A') {
    throw new Error(`Expected pitch A, got ${resultA440.closestPitch.toDisplayString()}`);
  }
  if (Math.abs(resultA440.centsDeviation) > 2.0) {
    throw new Error(`Expected < 2 cents deviation for exact 440 Hz, got ${resultA440.centsDeviation}`);
  }
  if (!resultA440.inTune) {
    throw new Error('Expected inTune = true for 440 Hz');
  }
  console.log(`  ✓ A4 detected: ${resultA440.frequency} Hz (${resultA440.centsDeviation} cents), inTune = ${resultA440.inTune}`);

  // Test 2: Quarter-tone Sikah E𝄳4
  const sikahPitch = new ArabicPitch('E', '𝄳', 4);
  const freqSikah = sikahPitch.toFrequency(440);
  console.log(`2. Testing 24-EDO Quarter-tone Sikah E𝄳4 (${freqSikah.toFixed(2)} Hz)...`);
  detector.reset();
  const bufferSikah = generateSineWave(freqSikah);
  const resultSikah = detector.detectPitch(bufferSikah, rast);
  if (!resultSikah) {
    throw new Error('Failed to detect pitch for Sikah E𝄳4');
  }
  if (resultSikah.closestPitch.diatonic !== 'E' || resultSikah.closestPitch.accidental !== '𝄳') {
    throw new Error(`Expected E𝄳, got ${resultSikah.closestPitch.toDisplayString()}`);
  }
  if (Math.abs(resultSikah.centsDeviation) > 2.0) {
    throw new Error(`Expected < 2 cents deviation for Sikah E𝄳4, got ${resultSikah.centsDeviation}`);
  }
  if (!resultSikah.isMaqamNote) {
    throw new Error('Sikah E𝄳4 must belong to Maqam Rast');
  }
  console.log(`  ✓ Quarter-tone E𝄳4 detected: ${resultSikah.frequency} Hz, Maqam note = ${resultSikah.isMaqamNote}, degree = ${resultSikah.maqamDegreeIndex}`);

  // Test 3: Maqam Role Matching (Qarar C4 and Ghammaz G4)
  console.log('3. Testing Maqam role detection for C4 (Qarar) and G4 (Ghammaz)...');
  detector.reset();
  const bufferC4 = generateSineWave(261.63);
  const resultC4 = detector.detectPitch(bufferC4, rast);
  if (!resultC4 || resultC4.maqamRole !== 'Qarar') {
    throw new Error(`Expected role 'Qarar' for C4 in Rast, got ${resultC4?.maqamRole}`);
  }

  detector.reset();
  const bufferG4 = generateSineWave(392.0);
  const resultG4 = detector.detectPitch(bufferG4, rast);
  if (!resultG4 || resultG4.maqamRole !== 'Ghammaz') {
    throw new Error(`Expected role 'Ghammaz' for G4 in Rast, got ${resultG4?.maqamRole}`);
  }
  console.log(`  ✓ Role detection verified: C4 is ${resultC4.maqamRole}, G4 is ${resultG4.maqamRole}`);

  // Test 4: Slightly sharp pitch detection (+9 cents)
  console.log('4. Testing sharp pitch deviation detection...');
  detector.reset();
  const sharpA = 440.0 * Math.pow(2, 9 / 1200); // +9 cents sharp
  const bufferSharp = generateSineWave(sharpA);
  const resultSharp = detector.detectPitch(bufferSharp, rast);
  if (!resultSharp) {
    throw new Error('Failed to detect sharp pitch');
  }
  if (resultSharp.status !== 'sharp' || resultSharp.centsDeviation < 5) {
    throw new Error(`Expected sharp status (>5 cents), got ${resultSharp.centsDeviation} cents, status=${resultSharp.status}`);
  }
  console.log(`  ✓ Sharp pitch correctly evaluated: +${resultSharp.centsDeviation} cents (${resultSharp.status})`);

  // Test 5: Silence / noise floor rejection
  console.log('5. Testing noise gate rejection below volume threshold...');
  detector.reset();
  const bufferSilent = generateSineWave(440.0, 0.002); // very low amplitude
  const resultSilent = detector.detectPitch(bufferSilent, rast);
  if (resultSilent !== null) {
    throw new Error('Expected silence to be rejected by volume threshold');
  }
  console.log(`  ✓ Silence correctly filtered out by noise gate.`);

  console.log('--- All Microtonal Pitch Detector Unit Tests Passed Successfully ---');
}
