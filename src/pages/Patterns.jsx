import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { AlertTriangle, BookOpen, Headphones, Repeat, ArrowRight } from 'lucide-react';
import { getSessions } from '../utils/storage';
import { ERROR_CATEGORIES } from '../utils/scoring';
import { analyzeErrorPatterns } from '../utils/prediction';

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6', '#84cc16', '#a855f7'];

export default function Patterns() {
  const sessions = getSessions();

  const patterns = useMemo(() => {
    const reading = analyzeErrorPatterns(sessions, 'reading');
    const listening = analyzeErrorPatterns(sessions, 'listening');

    const formatCategories = (cats) => {
      return Object.entries(cats)
        .map(([id, count]) => ({
          id,
          name: ERROR_CATEGORIES.find(c => c.id === id)?.label || id,
          nameEn: ERROR_CATEGORIES.find(c => c.id === id)?.labelEn || id,
          count,
        }))
        .sort((a, b) => b.count - a.count);
    };

    const formatQuestionTypes = (types) => {
      return Object.entries(types)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    // Collect all paraphrase examples
    const paraphrases = [];
    for (const s of sessions) {
      if (s.errors) {
        for (const e of s.errors) {
          if (e.originalText && e.paraphrasedText) {
            paraphrases.push({
              original: e.originalText,
              paraphrased: e.paraphrasedText,
              type: s.type,
              date: s.date,
              questionType: e.questionType,
            });
          }
        }
      }
    }

    return {
      reading: {
        categories: formatCategories(reading.categories),
        questionTypes: formatQuestionTypes(reading.questionTypes),
        recurring: reading.recurring,
        totalErrors: reading.totalErrors,
      },
      listening: {
        categories: formatCategories(listening.categories),
        questionTypes: formatQuestionTypes(listening.questionTypes),
        recurring: listening.recurring,
        totalErrors: listening.totalErrors,
      },
      paraphrases,
    };
  }, [sessions]);

  const hasData = patterns.reading.totalErrors > 0 || patterns.listening.totalErrors > 0;

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <AlertTriangle size={48} className="mx-auto text-text-secondary mb-4" />
        <h1 className="text-2xl font-bold mb-2">오답 패턴 분석</h1>
        <p className="text-text-secondary">오답 상세 데이터가 필요합니다. 세션 기록 시 오답 분석을 추가해주세요.</p>
      </div>
    );
  }

  const renderSection = (title, icon, data, color) => {
    if (data.totalErrors === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold">{title}</h2>
          <span className="text-sm text-text-secondary">({data.totalErrors}개 오답)</span>
        </div>

        {/* Recurring Warnings */}
        {data.recurring.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Repeat size={16} className="text-danger" />
              <span className="text-sm font-bold text-danger">반복 오답 경고!</span>
            </div>
            <div className="space-y-1">
              {data.recurring.map(r => (
                <div key={r.category} className="flex items-center justify-between text-sm">
                  <span>{ERROR_CATEGORIES.find(c => c.id === r.category)?.label || r.category}</span>
                  <span className="text-danger font-medium">세션의 {r.frequency}%에서 반복 ({r.count}회)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Error Category Pie Chart */}
          {data.categories.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold mb-3">오답 원인 분포</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#94a3b8' }}
                      fontSize={11}
                    >
                      {data.categories.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Question Type Bar Chart */}
          {data.questionTypes.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold mb-3">취약 문제 유형</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.questionTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={10} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill={color} name="오답 수" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Top Error Categories List */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold mb-3">오답 원인 순위</h3>
          <div className="space-y-2">
            {data.categories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-sm text-text-secondary">{cat.count}회</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(cat.count / data.totalErrors) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      <h1 className="text-2xl font-bold">오답 패턴 분석</h1>

      {renderSection(
        'Reading 오답 패턴',
        <BookOpen size={20} className="text-reading" />,
        patterns.reading,
        '#8b5cf6'
      )}

      {renderSection(
        'Listening 오답 패턴',
        <Headphones size={20} className="text-listening" />,
        patterns.listening,
        '#06b6d4'
      )}

      {/* Paraphrase Collection */}
      {patterns.paraphrases.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">패러프레이즈 모음</h2>
          <p className="text-sm text-text-secondary mb-4">
            지금까지 기록된 패러프레이즈 예시입니다. 반복적으로 확인하면 패러프레이즈 인식 능력이 향상됩니다.
          </p>
          <div className="space-y-2">
            {patterns.paraphrases.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <span className={`text-xs px-2 py-0.5 rounded ${p.type === 'reading' ? 'bg-reading/10 text-reading' : 'bg-listening/10 text-listening'}`}>
                  {p.type === 'reading' ? 'R' : 'L'}
                </span>
                <span className="text-sm font-medium">{p.original}</span>
                <ArrowRight size={14} className="text-text-secondary flex-shrink-0" />
                <span className="text-sm text-amber-700">{p.paraphrased}</span>
                {p.questionType && (
                  <span className="text-xs text-text-secondary bg-white px-2 py-0.5 rounded ml-auto flex-shrink-0">
                    {p.questionType}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
