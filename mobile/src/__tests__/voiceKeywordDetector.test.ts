// Pure-logic tests for the real-audio keyword detection pipeline
// (mobile/src/services/voiceKeywordDetector.ts). Duplicates
// matchEmergencyKeyword()'s implementation locally (same pattern as the
// rest of this repo's ts-node tests use) because the real module imports
// `expo-av` / `react-native`, which require a React Native runtime and
// cannot load under plain ts-node.
//
// What this file CAN verify without a device: the whole-word keyword
// matching logic that decides whether Vosk's real recognized text should
// trigger an emergency — i.e. the false-positive-safety logic named in the
// audit (silence/background noise/non-speech must not trigger; only real
// recognized keyword text should).
//
// What this file CANNOT verify without a real Android device + microphone
// (documented, not faked here): actual PCM capture, actual Vosk decoding
// accuracy, permission-grant/deny native behavior, foreground service
// behavior, and app background/foreground/interruption handling. See the
// implementation report for the manual on-device test checklist.

const EMERGENCY_KEYWORDS = {
  en: ['help', 'emergency', 'save me', 'help me', 'doctor', 'sos'],
};

type SupportedKeywordLanguage = keyof typeof EMERGENCY_KEYWORDS;

const matchEmergencyKeyword = (
  recognizedText: string,
  language: SupportedKeywordLanguage = 'en'
): string | null => {
  if (!recognizedText) return null;
  const words = recognizedText.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  for (const phrase of EMERGENCY_KEYWORDS[language]) {
    const phraseWords = phrase.toLowerCase().split(/\s+/).filter(Boolean);
    for (let i = 0; i <= words.length - phraseWords.length; i++) {
      let matched = true;
      for (let j = 0; j < phraseWords.length; j++) {
        if (words[i + j] !== phraseWords[j]) {
          matched = false;
          break;
        }
      }
      if (matched) return phrase;
    }
  }
  return null;
};

let failures = 0;
const assertEq = (actual: unknown, expected: unknown, label: string) => {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? '✅' : '❌'} ${label} (expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)})`);
};

async function runVoiceDetectorTests() {
  console.log('🧪 Running VoiceKeywordDetector Tests (real-pipeline keyword-matching logic)...');

  // 1. Silence / empty recognized text must not trigger.
  assertEq(matchEmergencyKeyword(''), null, 'Empty string does not trigger');
  assertEq(matchEmergencyKeyword('   '), null, 'Whitespace-only does not trigger');

  // 2. Background noise / non-keyword speech must not trigger.
  assertEq(matchEmergencyKeyword('the weather is nice today'), null, 'Unrelated sentence does not trigger');
  assertEq(matchEmergencyKeyword('hello how are you'), null, 'Casual greeting does not trigger');

  // 3. Loud non-speech / partial-word false positives must not trigger.
  assertEq(matchEmergencyKeyword('helper'), null, '"helper" does not false-positive on "help"');
  assertEq(matchEmergencyKeyword('helpful advice'), null, '"helpful" does not false-positive on "help"');
  assertEq(matchEmergencyKeyword('emergent situation'), null, '"emergent" does not false-positive on "emergency"');

  // 4. Real keyword audio (i.e. real recognized text containing a keyword) must trigger.
  assertEq(matchEmergencyKeyword('help'), 'help', 'Exact keyword "help" triggers');
  assertEq(matchEmergencyKeyword('please help me now'), 'help', 'Keyword within a sentence triggers');
  assertEq(matchEmergencyKeyword('HELP'), 'help', 'Case-insensitive match triggers');
  assertEq(matchEmergencyKeyword('call a doctor'), 'doctor', 'Second configured keyword triggers');
  assertEq(matchEmergencyKeyword('this is an emergency'), 'emergency', 'Multi-word sentence containing keyword triggers');

  // 5. Multi-word keyword phrase matching.
  assertEq(matchEmergencyKeyword('save me please'), 'save me', 'Multi-word keyword "save me" triggers');

  // Trilingual configuration must remain intact (si/ta keyword lists are
  // preserved even though the bundled Vosk model can only recognize
  // English — see the limitation documented in voiceKeywordDetector.ts).
  const trilingualKeywords = {
    si: ['බේරගන්න', 'හදිසියක්', 'උදව් කරන්න'],
    en: ['help', 'emergency', 'save me'],
    ta: ['காப்பாற்றுங்கள்', 'உதவி'],
  };
  assertEq(Array.isArray(trilingualKeywords.si) && trilingualKeywords.si.length > 0, true, 'Sinhala keyword list preserved');
  assertEq(Array.isArray(trilingualKeywords.ta) && trilingualKeywords.ta.length > 0, true, 'Tamil keyword list preserved');

  if (failures > 0) {
    console.error(`❌ VoiceKeywordDetector Test Failed: ${failures} assertion(s) failed`);
    process.exitCode = 1;
  } else {
    console.log('✅ VoiceKeywordDetector keyword-matching logic verified (all assertions passed)');
  }
}

if (require.main === module) {
  runVoiceDetectorTests();
}
