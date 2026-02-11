import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, ComposedChart, Area,
} from 'recharts';
import { format, parseISO, endOfMonth, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TrendingUp, Target, Zap, Award } from 'lucide-react';
import ProbabilityGauge from '../components/ProbabilityGauge';
import { getSessions } from '../utils/storage';
import { calculateProbability, calculateGrowthRate, movingAverage, predictScoreAtDate } from '../utils/prediction';

export default function Analysis() {
  const sessions = getSessions();
  const deadline = endOfMonth(new Date(2026, 2));

  const analysis = useMemo(() => {
    if (sessions.length === 0) return null;

    const readingGrowth = calculateGrowthRate(sessions, 'reading');
    const listeningGrowth = calculateGrowthRate(sessions, 'listening');

    const readingProb65 = calculateProbability(sessions, 'reading', 6.5, deadline);
    const readingProb70 = calculateProbability(sessions, 'reading', 7.0, deadline);
    const listeningProb65 = calculateProbability(sessions, 'listening', 6.5, deadline);
    const listeningProb70 = calculateProbability(sessions, 'listening', 7.0, deadline);

    const readingMA = movingAverage(sessions, 'reading');
    const listeningMA = movingAverage(sessions, 'listening');

    // Accuracy trend
    const accuracyData = [...sessions]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        date: s.date,
        type: s.type,
        accuracy: Math.round(((s.totalQuestions - s.wrongAnswers) / s.totalQuestions) * 100),
        wrongAnswers: s.wrongAnswers,
      }));

    // Weekly aggregation
    const weeklyMap = {};
    for (const s of sessions) {
      const date = parseISO(s.date);
      const weekStart = format(addDays(date, -date.getDay()), 'yyyy-MM-dd');
      if (!weeklyMap[weekStart]) weeklyMap[weekStart] = { week: weekStart, readingErrors: 0, listeningErrors: 0, readingSessions: 0, listeningSessions: 0 };
      if (s.type === 'reading') {
        weeklyMap[weekStart].readingErrors += s.wrongAnswers;
        weeklyMap[weekStart].readingSessions += 1;
      } else {
        weeklyMap[weekStart].listeningErrors += s.wrongAnswers;
        weeklyMap[weekStart].listeningSessions += 1;
      }
    }
    const weeklyErrors = Object.values(weeklyMap)
      .map(w => ({
        ...w,
        readingAvgErrors: w.readingSessions > 0 ? Math.round(w.readingErrors / w.readingSessions * 10) / 10 : null,
        listeningAvgErrors: w.listeningSessions > 0 ? Math.round(w.listeningErrors / w.listeningSessions * 10) / 10 : null,
      }))
      .sort((a, b) => new Date(a.week) - new Date(b.week));

    return {
      readingGrowth,
      listeningGrowth,
      readingProb65,
      readingProb70,
      listeningProb65,
      listeningProb70,
      readingMA,
      listeningMA,
      accuracyData,
      weeklyErrors,
    };
  }, [sessions]);

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <TrendingUp size={48} className="mx-auto text-text-secondary mb-4" />
        <h1 className="text-2xl font-bold mb-2">성장 분석</h1>
        <p className="text-text-secondary">세션 데이터가 필요합니다. 먼저 연습 세션을 기록해주세요.</p>
      </div>
    );
  }

  // Combined trend data for chart
  const trendData = [];
  const dateSet = new Set();
  [...analysis.readingMA, ...analysis.listeningMA].forEach(d => dateSet.add(d.date));
  for (const date of [...dateSet].sort()) {
    const r = analysis.readingMA.find(d => d.date === date);
    const l = analysis.listeningMA.find(d => d.date === date);
    trendData.push({
      date,
      readingBand: r?.bandScore,
      readingMA: r?.movingAvg,
      listeningBand: l?.bandScore,
      listeningMA: l?.movingAvg,
    });
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">성장 분석</h1>

      {/* Target Probability - 6.5 and 7.0 */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6">목표 달성 확률 (3월 말 기준)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center">
            <ProbabilityGauge
              probability={analysis.readingProb65.probability}
              label="Reading 6.5"
              confidence={analysis.readingProb65.confidence}
            />
          </div>
          <div className="flex flex-col items-center">
            <ProbabilityGauge
              probability={analysis.readingProb70.probability}
              label="Reading 7.0"
              confidence={analysis.readingProb70.confidence}
            />
          </div>
          <div className="flex flex-col items-center">
            <ProbabilityGauge
              probability={analysis.listeningProb65.probability}
              label="Listening 6.5"
              confidence={analysis.listeningProb65.confidence}
            />
          </div>
          <div className="flex flex-col items-center">
            <ProbabilityGauge
              probability={analysis.listeningProb70.probability}
              label="Listening 7.0"
              confidence={analysis.listeningProb70.confidence}
            />
          </div>
        </div>
      </div>

      {/* Growth Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-reading" />
            <h3 className="font-semibold">Reading 성장률</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">일일 성장률:</span>
              <span className={`font-medium ${analysis.readingGrowth.rate > 0 ? 'text-success' : 'text-danger'}`}>
                {analysis.readingGrowth.rate > 0 ? '+' : ''}{(analysis.readingGrowth.rate).toFixed(3)} band/일
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">추세:</span>
              <span className="font-medium">
                {analysis.readingGrowth.trend === 'fast-improving' ? '급성장 중' :
                 analysis.readingGrowth.trend === 'improving' ? '성장 중' :
                 analysis.readingGrowth.trend === 'stable' ? '유지 중' :
                 analysis.readingGrowth.trend === 'declining' ? '하락 중' : '데이터 부족'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">현재 평균:</span>
              <span className="font-bold text-reading">{analysis.readingProb65.currentAvg}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">3월 말 예상:</span>
              <span className="font-bold">{analysis.readingProb65.predictedScore || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-listening" />
            <h3 className="font-semibold">Listening 성장률</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">일일 성장률:</span>
              <span className={`font-medium ${analysis.listeningGrowth.rate > 0 ? 'text-success' : 'text-danger'}`}>
                {analysis.listeningGrowth.rate > 0 ? '+' : ''}{(analysis.listeningGrowth.rate).toFixed(3)} band/일
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">추세:</span>
              <span className="font-medium">
                {analysis.listeningGrowth.trend === 'fast-improving' ? '급성장 중' :
                 analysis.listeningGrowth.trend === 'improving' ? '성장 중' :
                 analysis.listeningGrowth.trend === 'stable' ? '유지 중' :
                 analysis.listeningGrowth.trend === 'declining' ? '하락 중' : '데이터 부족'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">현재 평균:</span>
              <span className="font-bold text-listening">{analysis.listeningProb65.currentAvg}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">3월 말 예상:</span>
              <span className="font-bold">{analysis.listeningProb65.predictedScore || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Band Score Trend with Moving Average */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Band Score 추이 (이동평균 포함)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), 'M/d')}
                fontSize={12}
              />
              <YAxis domain={[3, 9]} ticks={[4, 5, 5.5, 6, 6.5, 7, 7.5, 8]} fontSize={12} />
              <Tooltip
                labelFormatter={(d) => format(parseISO(d), 'yyyy년 M월 d일', { locale: ko })}
              />
              <Legend />
              <ReferenceLine y={6.5} stroke="#f59e0b" strokeDasharray="5 5" />
              <ReferenceLine y={7.0} stroke="#10b981" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="readingBand" stroke="#8b5cf6" strokeWidth={1} dot={{ r: 3 }} connectNulls name="Reading" />
              <Line type="monotone" dataKey="readingMA" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} connectNulls name="Reading (이동평균)" />
              <Line type="monotone" dataKey="listeningBand" stroke="#06b6d4" strokeWidth={1} dot={{ r: 3 }} connectNulls name="Listening" />
              <Line type="monotone" dataKey="listeningMA" stroke="#06b6d4" strokeWidth={2.5} strokeDasharray="5 5" dot={false} connectNulls name="Listening (이동평균)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Error Trend */}
      {analysis.weeklyErrors.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">주간 평균 오답 수 추이</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.weeklyErrors}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="week"
                  tickFormatter={(d) => format(parseISO(d), 'M/d')}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip
                  labelFormatter={(d) => `${format(parseISO(d), 'M월 d일')} 주`}
                />
                <Legend />
                <Bar dataKey="readingAvgErrors" fill="#8b5cf6" name="Reading 평균 오답" radius={[4, 4, 0, 0]} />
                <Bar dataKey="listeningAvgErrors" fill="#06b6d4" name="Listening 평균 오답" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-accent" />
          <h2 className="text-lg font-bold">학습 권장사항</h2>
        </div>
        <div className="space-y-3">
          {analysis.readingGrowth.rate < 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-danger font-bold">!</span>
              <p className="text-sm">Reading 점수가 하락 추세입니다. 학습 방법을 점검해보세요.</p>
            </div>
          )}
          {analysis.listeningGrowth.rate < 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-danger font-bold">!</span>
              <p className="text-sm">Listening 점수가 하락 추세입니다. 학습 방법을 점검해보세요.</p>
            </div>
          )}
          {analysis.readingProb65.consistency > 1.0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-warning font-bold">!</span>
              <p className="text-sm">Reading 점수 편차가 큽니다. 컨디션 관리와 일관된 연습이 필요합니다.</p>
            </div>
          )}
          {(analysis.readingProb65.probability >= 50 || analysis.listeningProb65.probability >= 50) && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-success font-bold">+</span>
              <p className="text-sm">현재 성장세가 좋습니다! 꾸준히 유지하면 목표 달성이 가능합니다.</p>
            </div>
          )}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-primary font-bold">i</span>
            <p className="text-sm">
              매일 최소 1세션씩 기록하면 예측 정확도가 높아집니다.
              집중력이 떨어지는 날에도 기록하여 컨디션 패턴을 파악하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
