// IELTS Reading band score conversion (Academic)
// Based on approximate raw score to band score mapping
const READING_BAND_TABLE = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 15, max: 18, band: 5.0 },
  { min: 13, max: 14, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 6, max: 9, band: 3.5 },
  { min: 4, max: 5, band: 3.0 },
  { min: 0, max: 3, band: 2.0 },
];

// IELTS Listening band score conversion
const LISTENING_BAND_TABLE = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6.0 },
  { min: 18, max: 22, band: 5.5 },
  { min: 16, max: 17, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 6, max: 9, band: 3.5 },
  { min: 4, max: 5, band: 3.0 },
  { min: 0, max: 3, band: 2.0 },
];

export function rawToBand(correct, totalQuestions, type) {
  const table = type === 'reading' ? READING_BAND_TABLE : LISTENING_BAND_TABLE;
  // Scale to 40 if total questions differ
  const scaled = totalQuestions !== 40
    ? Math.round((correct / totalQuestions) * 40)
    : correct;

  for (const row of table) {
    if (scaled >= row.min && scaled <= row.max) {
      return row.band;
    }
  }
  return 2.0;
}

export function bandToCorrectRange(targetBand, type) {
  const table = type === 'reading' ? READING_BAND_TABLE : LISTENING_BAND_TABLE;
  const row = table.find(r => r.band === targetBand);
  return row ? { min: row.min, max: row.max } : null;
}

// Calculate estimated band from session data
export function calculateSessionBand(session) {
  const correct = session.totalQuestions - session.wrongAnswers;
  return rawToBand(correct, session.totalQuestions, session.type);
}

// Error reason categories
export const ERROR_CATEGORIES = [
  { id: 'vocabulary', label: '어휘력 부족', labelEn: 'Vocabulary Gap' },
  { id: 'paraphrase', label: '패러프레이즈 못 알아봄', labelEn: 'Paraphrase Miss' },
  { id: 'time', label: '시간 부족', labelEn: 'Time Pressure' },
  { id: 'trap', label: '함정 선택지', labelEn: 'Trap Answer' },
  { id: 'skim', label: '스키밍/스캐닝 실패', labelEn: 'Skim/Scan Fail' },
  { id: 'concentration', label: '집중력 저하', labelEn: 'Lost Focus' },
  { id: 'misread', label: '문제 잘못 읽음', labelEn: 'Misread Question' },
  { id: 'logic', label: '논리적 추론 실패', labelEn: 'Logic Error' },
  { id: 'spelling', label: '스펠링 실수', labelEn: 'Spelling Mistake' },
  { id: 'grammar', label: '문법 구조 이해 부족', labelEn: 'Grammar Issue' },
  { id: 'other', label: '기타', labelEn: 'Other' },
];

// IELTS question types
export const READING_QUESTION_TYPES = [
  'True/False/Not Given',
  'Yes/No/Not Given',
  'Matching Headings',
  'Matching Information',
  'Matching Features',
  'Matching Sentence Endings',
  'Summary Completion',
  'Note Completion',
  'Table Completion',
  'Flow-chart Completion',
  'Diagram Label Completion',
  'Short Answer',
  'Multiple Choice',
  'List Selection',
];

export const LISTENING_QUESTION_TYPES = [
  'Multiple Choice',
  'Matching',
  'Map/Plan/Diagram Labelling',
  'Form Completion',
  'Note Completion',
  'Table Completion',
  'Flow-chart Completion',
  'Summary Completion',
  'Sentence Completion',
  'Short Answer',
];
