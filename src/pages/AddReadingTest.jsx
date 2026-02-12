import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { addSession } from '../utils/storage';
import { rawToBand, ERROR_CATEGORIES, READING_QUESTION_TYPES } from '../utils/scoring';

const DEFAULT_PASSAGE = (num) => ({
  passage: num,
  questions: num === 3 ? 14 : 13,
  wrongAnswers: 0,
  errors: [],
});

export default function AddReadingTest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    source: '',
    notes: '',
    passages: [DEFAULT_PASSAGE(1), DEFAULT_PASSAGE(2), DEFAULT_PASSAGE(3)],
  });
  const [expandedPassage, setExpandedPassage] = useState(0);

  const totalQuestions = form.passages.reduce((s, p) => s + p.questions, 0);
  const totalWrong = form.passages.reduce((s, p) => s + p.wrongAnswers, 0);
  const totalCorrect = totalQuestions - totalWrong;
  const overallBand = rawToBand(totalCorrect, totalQuestions, 'reading');

  const updatePassage = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      passages: prev.passages.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }));
  };

  const addError = (passageIdx) => {
    setForm(prev => ({
      ...prev,
      passages: prev.passages.map((p, i) =>
        i === passageIdx
          ? {
              ...p,
              errors: [
                ...p.errors,
                {
                  id: Date.now(),
                  questionNumber: '',
                  category: '',
                  questionType: '',
                  originalText: '',
                  paraphrasedText: '',
                  myAnswer: '',
                  correctAnswer: '',
                  explanation: '',
                },
              ],
            }
          : p
      ),
    }));
  };

  const updateError = (passageIdx, errorId, field, value) => {
    setForm(prev => ({
      ...prev,
      passages: prev.passages.map((p, i) =>
        i === passageIdx
          ? { ...p, errors: p.errors.map(e => e.id === errorId ? { ...e, [field]: value } : e) }
          : p
      ),
    }));
  };

  const removeError = (passageIdx, errorId) => {
    setForm(prev => ({
      ...prev,
      passages: prev.passages.map((p, i) =>
        i === passageIdx
          ? { ...p, errors: p.errors.filter(e => e.id !== errorId) }
          : p
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allErrors = form.passages.flatMap((p, idx) =>
      p.errors.map(err => ({ ...err, passage: idx + 1 }))
    );
    addSession({
      type: 'reading',
      date: form.date,
      source: form.source,
      section: 'Full Test (Passage 1-3)',
      totalQuestions,
      wrongAnswers: totalWrong,
      bandScore: overallBand,
      notes: form.notes,
      errors: allErrors,
      passages: form.passages.map(p => ({
        passage: p.passage,
        questions: p.questions,
        wrongAnswers: p.wrongAnswers,
        correct: p.questions - p.wrongAnswers,
      })),
    });
    navigate('/sessions');
  };

  const passageDifficulty = (passageNum) => {
    const labels = { 1: '쉬움', 2: '보통', 3: '어려움' };
    const colors = { 1: 'text-success', 2: 'text-primary', 3: 'text-danger' };
    return { label: labels[passageNum], color: colors[passageNum] };
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-reading/10">
          <BookOpen size={24} className="text-reading" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Reading 풀 테스트</h1>
          <p className="text-sm text-text-secondary">Passage 1, 2, 3을 한번에 기록</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-lg">기본 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">출처 (교재/시험)</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                placeholder="예: Cambridge 18 Test 1"
                className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Overall Score Preview */}
        <div className="bg-reading/5 border border-reading/20 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">전체 결과</p>
              <p className="text-sm text-text-secondary">정답: {totalCorrect}/{totalQuestions}</p>
              <p className="text-sm text-text-secondary">정답률: {totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Overall Band Score</p>
              <p className="text-5xl font-bold text-reading">{overallBand}</p>
            </div>
          </div>
          {/* Per-passage summary bar */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {form.passages.map((p, idx) => {
              const correct = p.questions - p.wrongAnswers;
              const pct = p.questions > 0 ? Math.round((correct / p.questions) * 100) : 0;
              const diff = passageDifficulty(p.passage);
              return (
                <div key={idx} className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-secondary">Passage {p.passage}</p>
                  <p className={`text-xs ${diff.color}`}>{diff.label}</p>
                  <p className="text-lg font-bold text-reading">{correct}/{p.questions}</p>
                  <p className="text-xs text-text-secondary">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passages */}
        {form.passages.map((passage, pIdx) => {
          const isExpanded = expandedPassage === pIdx;
          const diff = passageDifficulty(passage.passage);
          const correct = passage.questions - passage.wrongAnswers;

          return (
            <div key={pIdx} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {/* Passage Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedPassage(isExpanded ? -1 : pIdx)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                  pIdx === 0 ? 'bg-success' : pIdx === 1 ? 'bg-primary' : 'bg-danger'
                }`}>
                  {passage.passage}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Passage {passage.passage}</span>
                    <span className={`text-xs ${diff.color}`}>({diff.label})</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {correct}/{passage.questions} 정답 · 오답 {passage.wrongAnswers}개
                    {passage.errors.length > 0 && ` · 분석 ${passage.errors.length}건`}
                  </p>
                </div>
                <div className="text-right mr-2">
                  <p className="text-lg font-bold text-reading">
                    {passage.questions > 0 ? Math.round((correct / passage.questions) * 100) : 0}%
                  </p>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {/* Passage Details */}
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">문항 수</label>
                      <input
                        type="number"
                        value={passage.questions}
                        onChange={(e) => updatePassage(pIdx, 'questions', parseInt(e.target.value) || 0)}
                        min="1"
                        max="20"
                        className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none text-center text-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">오답 수</label>
                      <input
                        type="number"
                        value={passage.wrongAnswers}
                        onChange={(e) => updatePassage(pIdx, 'wrongAnswers', parseInt(e.target.value) || 0)}
                        min="0"
                        max={passage.questions}
                        className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none text-center text-lg font-semibold"
                      />
                    </div>
                  </div>

                  {/* Error Details */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm">오답 상세 분석</h3>
                      <button
                        type="button"
                        onClick={() => addError(pIdx)}
                        className="flex items-center gap-1.5 bg-primary-light text-white px-3 py-2 rounded-lg active:bg-primary transition-colors cursor-pointer text-xs font-medium"
                      >
                        <Plus size={14} />
                        오답 추가
                      </button>
                    </div>

                    {passage.errors.length === 0 && (
                      <p className="text-text-secondary text-xs text-center py-4">
                        오답 추가 버튼을 눌러 상세 분석을 기록하세요.
                      </p>
                    )}

                    <div className="space-y-3">
                      {passage.errors.map((error, eIdx) => (
                        <div key={error.id} className="border border-border rounded-xl p-3 bg-gray-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-secondary">오답 #{eIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeError(pIdx, error.id)}
                              className="text-danger p-1.5 rounded-lg active:bg-red-50 cursor-pointer bg-transparent border-none"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">문제 번호</label>
                              <input
                                type="text"
                                value={error.questionNumber}
                                onChange={(e) => updateError(pIdx, error.id, 'questionNumber', e.target.value)}
                                placeholder="Q.1"
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">틀린 이유</label>
                              <select
                                value={error.category}
                                onChange={(e) => updateError(pIdx, error.id, 'category', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none bg-white text-sm"
                              >
                                <option value="">선택...</option>
                                {ERROR_CATEGORIES.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">문제 유형</label>
                              <select
                                value={error.questionType}
                                onChange={(e) => updateError(pIdx, error.id, 'questionType', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none bg-white text-sm"
                              >
                                <option value="">선택...</option>
                                {READING_QUESTION_TYPES.map(qt => (
                                  <option key={qt} value={qt}>{qt}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">내 답</label>
                              <input
                                type="text"
                                value={error.myAnswer}
                                onChange={(e) => updateError(pIdx, error.id, 'myAnswer', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">정답</label>
                              <input
                                type="text"
                                value={error.correctAnswer}
                                onChange={(e) => updateError(pIdx, error.id, 'correctAnswer', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none text-sm"
                              />
                            </div>
                          </div>

                          {/* Paraphrase */}
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <p className="text-xs font-semibold text-amber-700 mb-2">패러프레이즈 분석</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-text-secondary mb-1">원문 표현</label>
                                <input
                                  type="text"
                                  value={error.originalText}
                                  onChange={(e) => updateError(pIdx, error.id, 'originalText', e.target.value)}
                                  placeholder="지문의 원래 표현"
                                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-text-secondary mb-1">패러프레이즈된 표현</label>
                                <input
                                  type="text"
                                  value={error.paraphrasedText}
                                  onChange={(e) => updateError(pIdx, error.id, 'paraphrasedText', e.target.value)}
                                  placeholder="문제에서 변형된 표현"
                                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">메모/설명</label>
                            <textarea
                              value={error.explanation}
                              onChange={(e) => updateError(pIdx, error.id, 'explanation', e.target.value)}
                              placeholder="왜 틀렸는지 상세 설명..."
                              rows={2}
                              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none resize-none text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Notes */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h2 className="font-semibold text-lg mb-3">전체 메모</h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="오늘의 컨디션, 느낀 점, 개선할 점..."
            rows={3}
            className="w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-reading text-white py-4 rounded-xl font-semibold active:opacity-90 transition-colors cursor-pointer text-lg border-none"
        >
          <Save size={22} />
          풀 테스트 저장 (Band {overallBand})
        </button>
      </form>
    </div>
  );
}
