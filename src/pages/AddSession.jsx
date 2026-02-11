import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, BookOpen, Headphones } from 'lucide-react';
import { format } from 'date-fns';
import { addSession } from '../utils/storage';
import { calculateSessionBand, ERROR_CATEGORIES, READING_QUESTION_TYPES, LISTENING_QUESTION_TYPES } from '../utils/scoring';

export default function AddSession() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'reading',
    date: format(new Date(), 'yyyy-MM-dd'),
    source: '',
    section: '',
    totalQuestions: 40,
    wrongAnswers: 0,
    notes: '',
    errors: [],
  });

  const questionTypes = form.type === 'reading' ? READING_QUESTION_TYPES : LISTENING_QUESTION_TYPES;

  const addError = () => {
    setForm(prev => ({
      ...prev,
      errors: [
        ...prev.errors,
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
    }));
  };

  const updateError = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      errors: prev.errors.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeError = (id) => {
    setForm(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bandScore = calculateSessionBand(form);
    addSession({ ...form, bandScore });
    navigate('/sessions');
  };

  const correct = form.totalQuestions - form.wrongAnswers;
  const previewBand = calculateSessionBand(form);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">새 세션 기록</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, type: 'reading' }))}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-medium border-2 transition-all cursor-pointer ${
              form.type === 'reading'
                ? 'border-reading bg-reading/5 text-reading'
                : 'border-border bg-card text-text-secondary hover:border-gray-300'
            }`}
          >
            <BookOpen size={20} />
            Reading
          </button>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, type: 'listening' }))}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-medium border-2 transition-all cursor-pointer ${
              form.type === 'listening'
                ? 'border-listening bg-listening/5 text-listening'
                : 'border-border bg-card text-text-secondary hover:border-gray-300'
            }`}
          >
            <Headphones size={20} />
            Listening
          </button>
        </div>

        {/* Basic Info */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-lg">기본 정보</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">출처 (교재/시험)</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                placeholder="예: Cambridge 18 Test 1"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">섹션/파트</label>
            <input
              type="text"
              value={form.section}
              onChange={(e) => setForm(prev => ({ ...prev, section: e.target.value }))}
              placeholder="예: Passage 1, Section 1-4, Full Test"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">총 문항 수</label>
              <input
                type="number"
                value={form.totalQuestions}
                onChange={(e) => setForm(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 0 }))}
                min="1"
                max="40"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">오답 수</label>
              <input
                type="number"
                value={form.wrongAnswers}
                onChange={(e) => setForm(prev => ({ ...prev, wrongAnswers: parseInt(e.target.value) || 0 }))}
                min="0"
                max={form.totalQuestions}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          {/* Live Score Preview */}
          <div className={`rounded-lg p-4 ${form.type === 'reading' ? 'bg-reading/5' : 'bg-listening/5'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">정답: {correct}/{form.totalQuestions}</p>
                <p className="text-sm text-text-secondary">정답률: {form.totalQuestions > 0 ? Math.round((correct / form.totalQuestions) * 100) : 0}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">예상 Band Score</p>
                <p className={`text-3xl font-bold ${form.type === 'reading' ? 'text-reading' : 'text-listening'}`}>
                  {previewBand}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">오답 상세 분석</h2>
            <button
              type="button"
              onClick={addError}
              className="flex items-center gap-1 text-sm bg-primary-light text-white px-3 py-1.5 rounded-lg hover:bg-primary transition-colors cursor-pointer"
            >
              <Plus size={14} />
              오답 추가
            </button>
          </div>

          {form.errors.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-6">
              오답을 추가하여 상세 분석을 기록하세요.<br />
              패러프레이즈 분석, 틀린 이유 등을 추적할 수 있습니다.
            </p>
          )}

          <div className="space-y-4">
            {form.errors.map((error, index) => (
              <div key={error.id} className="border border-border rounded-lg p-4 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">오답 #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeError(error.id)}
                    className="text-danger hover:text-red-700 cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">문제 번호</label>
                    <input
                      type="text"
                      value={error.questionNumber}
                      onChange={(e) => updateError(error.id, 'questionNumber', e.target.value)}
                      placeholder="Q.1"
                      className="w-full px-2 py-1.5 border border-border rounded text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">틀린 이유</label>
                    <select
                      value={error.category}
                      onChange={(e) => updateError(error.id, 'category', e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none bg-white"
                    >
                      <option value="">선택...</option>
                      {ERROR_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">문제 유형</label>
                    <select
                      value={error.questionType}
                      onChange={(e) => updateError(error.id, 'questionType', e.target.value)}
                      className="w-full px-2 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none bg-white"
                    >
                      <option value="">선택...</option>
                      {questionTypes.map(qt => (
                        <option key={qt} value={qt}>{qt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">내 답</label>
                    <input
                      type="text"
                      value={error.myAnswer}
                      onChange={(e) => updateError(error.id, 'myAnswer', e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">정답</label>
                    <input
                      type="text"
                      value={error.correctAnswer}
                      onChange={(e) => updateError(error.id, 'correctAnswer', e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Paraphrase Section */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 mb-2">패러프레이즈 분석</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">원문 표현</label>
                      <input
                        type="text"
                        value={error.originalText}
                        onChange={(e) => updateError(error.id, 'originalText', e.target.value)}
                        placeholder="지문의 원래 표현"
                        className="w-full px-2 py-1.5 border border-amber-200 rounded text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">패러프레이즈된 표현</label>
                      <input
                        type="text"
                        value={error.paraphrasedText}
                        onChange={(e) => updateError(error.id, 'paraphrasedText', e.target.value)}
                        placeholder="문제에서 변형된 표현"
                        className="w-full px-2 py-1.5 border border-amber-200 rounded text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">메모/설명</label>
                  <textarea
                    value={error.explanation}
                    onChange={(e) => updateError(error.id, 'explanation', e.target.value)}
                    placeholder="왜 틀렸는지 상세 설명..."
                    rows={2}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h2 className="font-semibold text-lg mb-3">전체 메모</h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="오늘의 컨디션, 느낀 점, 개선할 점..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-medium hover:bg-primary-dark transition-colors cursor-pointer text-lg border-none"
        >
          <Save size={20} />
          세션 저장
        </button>
      </form>
    </div>
  );
}
