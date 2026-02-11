import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart,
} from 'recharts';
import { BookOpen, Headphones, Target, Calendar, TrendingUp, PlusCircle } from 'lucide-react';
import { format, parseISO, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import ScoreCard from '../components/ScoreCard';
import ProbabilityGauge from '../components/ProbabilityGauge';
import { getSessions } from '../utils/storage';
import { calculateProbability, calculateGrowthRate, movingAverage } from '../utils/prediction';

export default function Dashboard() {
  const sessions = getSessions();
  const deadline = endOfMonth(new Date(2026, 2));

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    const reading = sessions.filter((s) => s.type === 'reading');
    const listening = sessions.filter((s) => s.type === 'listening');

    const lastReading = reading.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const lastListening = listening.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    const readingProb = calculateProbability(sessions, 'reading', 6.5, deadline);
    const listeningProb = calculateProbability(sessions, 'listening', 6.5, deadline);

    const readingGrowth = calculateGrowthRate(sessions, 'reading');
    const listeningGrowth = calculateGrowthRate(sessions, 'listening');

    const readingMA = movingAverage(sessions, 'reading');
    const listeningMA = movingAverage(sessions, 'listening');

    return {
      totalSessions: sessions.length,
      reading: {
        count: reading.length,
        lastBand: lastReading?.bandScore || '-',
        probability: readingProb,
        growth: readingGrowth,
        trend: readingMA,
      },
      listening: {
        count: listening.length,
        lastBand: lastListening?.bandScore || '-',
        probability: listeningProb,
        growth: listeningGrowth,
        trend: listeningMA,
      },
    };
  }, [sessions, deadline]);

  const chartData = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dateMap = {};

    for (const s of sorted) {
      const dateKey = s.date;
      if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey };
      if (s.type === 'reading') {
        dateMap[dateKey].reading = s.bandScore;
      }
      if (s.type === 'listening') {
        dateMap[dateKey].listening = s.bandScore;
      }
    }

    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="card-surface rounded-3xl border border-border/70 p-12">
          <Target size={64} className="mx-auto text-primary-light mb-6" />
          <h1 className="text-4xl font-semibold mb-3">IELTS Progress Tracker</h1>
          <p className="text-text-secondary mb-2 text-lg">3월 말까지 6.5~7.0 달성을 향한 여정을 시작하세요!</p>
          <p className="text-text-secondary mb-8">매일의 리딩/리스닝 연습을 기록하고, 성장을 한눈에 확인하세요.</p>
          <Link
            to="/add"
            className="elegant-button inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium no-underline hover:bg-primary-dark shadow-[0_8px_24px_rgba(0,92,115,0.24)]"
          >
            <PlusCircle size={20} />
            첫 번째 세션 기록하기
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = stats.reading.probability.daysLeft || stats.listening.probability.daysLeft || 0;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">대시보드</h1>
          <p className="text-text-secondary text-sm">
            목표: 3월 말까지 Reading & Listening 6.5~7.0
          </p>
        </div>
        <div className="card-surface flex items-center gap-2 rounded-xl px-4 py-2 border border-border/70">
          <Calendar size={16} className="text-primary-light" />
          <span className="text-sm font-medium">D-{Math.max(0, daysLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard
          title="최근 Reading"
          value={stats.reading.lastBand}
          subtitle={`총 ${stats.reading.count}회 연습`}
          icon={BookOpen}
          color="text-reading"
          trend={stats.reading.growth.rate}
        />
        <ScoreCard
          title="최근 Listening"
          value={stats.listening.lastBand}
          subtitle={`총 ${stats.listening.count}회 연습`}
          icon={Headphones}
          color="text-listening"
          trend={stats.listening.growth.rate}
        />
        <ScoreCard
          title="총 세션"
          value={stats.totalSessions}
          subtitle="기록된 연습"
          icon={Target}
          color="text-primary"
        />
        <ScoreCard
          title="성장 트렌드"
          value={
            stats.reading.growth.trend === 'fast-improving' || stats.listening.growth.trend === 'fast-improving'
              ? '급성장'
              : stats.reading.growth.trend === 'improving' || stats.listening.growth.trend === 'improving'
                ? '성장중'
                : stats.reading.growth.trend === 'stable' || stats.listening.growth.trend === 'stable'
                  ? '유지'
                  : '데이터 필요'
          }
          subtitle="전체 추세"
          icon={TrendingUp}
          color="text-success"
        />
      </div>

      <div className="card-surface rounded-2xl border border-border/70 p-6">
        <h2 className="text-2xl font-semibold mb-4">6.5 달성 확률 (3월 말 기준)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <ProbabilityGauge
              probability={stats.reading.probability.probability || 0}
              label="Reading 6.5"
              confidence={stats.reading.probability.confidence}
            />
            <p className="mt-3 text-sm text-text-secondary text-center max-w-xs">
              {stats.reading.probability.message}
            </p>
            {stats.reading.probability.predictedScore && (
              <p className="text-xs text-text-secondary mt-1">
                예상 점수: <span className="font-semibold text-reading">{stats.reading.probability.predictedScore}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-center">
            <ProbabilityGauge
              probability={stats.listening.probability.probability || 0}
              label="Listening 6.5"
              confidence={stats.listening.probability.confidence}
            />
            <p className="mt-3 text-sm text-text-secondary text-center max-w-xs">
              {stats.listening.probability.message}
            </p>
            {stats.listening.probability.predictedScore && (
              <p className="text-xs text-text-secondary mt-1">
                예상 점수: <span className="font-semibold text-listening">{stats.listening.probability.predictedScore}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card-surface rounded-2xl border border-border/70 p-6">
        <h2 className="text-2xl font-semibold mb-4">점수 추이</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbd7cf" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), 'M/d', { locale: ko })}
                fontSize={12}
                tick={{ fill: '#66645f' }}
                axisLine={{ stroke: '#cbc6bc' }}
                tickLine={{ stroke: '#cbc6bc' }}
              />
              <YAxis
                domain={[3, 9]}
                ticks={[3, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9]}
                fontSize={12}
                tick={{ fill: '#66645f' }}
                axisLine={{ stroke: '#cbc6bc' }}
                tickLine={{ stroke: '#cbc6bc' }}
              />
              <Tooltip
                contentStyle={{ background: '#f8f7f5', border: '1px solid #dfdcd6', borderRadius: '12px', color: '#333333' }}
                labelStyle={{ color: '#333333', fontWeight: 600 }}
                labelFormatter={(d) => format(parseISO(d), 'yyyy년 M월 d일', { locale: ko })}
                formatter={(value, name) => [value, name === 'reading' ? 'Reading' : 'Listening']}
              />
              <Legend formatter={(value) => (value === 'reading' ? 'Reading' : 'Listening')} />
              <ReferenceLine y={6.5} stroke="#d4af37" strokeDasharray="5 5" label={{ value: '목표 6.5', position: 'right', fontSize: 12 }} />
              <ReferenceLine y={7.0} stroke="#6b8b67" strokeDasharray="5 5" label={{ value: '목표 7.0', position: 'right', fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="reading"
                stroke="#375a7f"
                strokeWidth={2.8}
                dot={{ fill: '#375a7f', r: 4.5 }}
                activeDot={{ r: 6 }}
                connectNulls
                name="reading"
              />
              <Line
                type="monotone"
                dataKey="listening"
                stroke="#5b7c73"
                strokeWidth={2.8}
                dot={{ fill: '#5b7c73', r: 4.5 }}
                activeDot={{ r: 6 }}
                connectNulls
                name="listening"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          to="/add"
          className="elegant-button flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium no-underline hover:bg-primary-dark shadow-[0_8px_24px_rgba(0,92,115,0.22)]"
        >
          <PlusCircle size={18} />
          새 세션 기록
        </Link>
        <Link
          to="/analysis"
          className="elegant-button flex-1 flex items-center justify-center gap-2 card-surface border border-border/70 text-text py-3 rounded-xl font-medium no-underline hover:text-primary"
        >
          <TrendingUp size={18} />
          상세 분석 보기
        </Link>
      </div>
    </div>
  );
}
