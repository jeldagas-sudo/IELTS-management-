import { differenceInDays, parseISO } from 'date-fns';

// Calculate linear regression for trend
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const ssRes = points.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const ssTot = points.reduce((acc, p) => acc + Math.pow(p.y - sumY / n, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// Calculate growth rate (band points per day)
export function calculateGrowthRate(sessions, type) {
  const filtered = sessions
    .filter(s => s.type === type)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length < 2) return { rate: 0, r2: 0, trend: 'insufficient' };

  const baseDate = parseISO(filtered[0].date);
  const points = filtered.map(s => ({
    x: differenceInDays(parseISO(s.date), baseDate),
    y: s.bandScore,
  }));

  const { slope, r2 } = linearRegression(points);

  let trend = 'stable';
  if (slope > 0.02) trend = 'improving';
  if (slope > 0.05) trend = 'fast-improving';
  if (slope < -0.02) trend = 'declining';

  return { rate: slope, r2, trend };
}

// Predict score at a future date
export function predictScoreAtDate(sessions, type, targetDate) {
  const filtered = sessions
    .filter(s => s.type === type)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length < 2) return null;

  const baseDate = parseISO(filtered[0].date);
  const points = filtered.map(s => ({
    x: differenceInDays(parseISO(s.date), baseDate),
    y: s.bandScore,
  }));

  const { slope, intercept } = linearRegression(points);
  const targetDays = differenceInDays(targetDate, baseDate);
  const predicted = slope * targetDays + intercept;

  return Math.min(9.0, Math.max(0, predicted));
}

// Calculate probability of reaching target band by deadline
export function calculateProbability(sessions, type, targetBand, deadline) {
  const filtered = sessions
    .filter(s => s.type === type)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length < 2) {
    return { probability: 0, message: '데이터가 부족합니다. 최소 2개 이상의 세션이 필요합니다.', confidence: 'low' };
  }

  const baseDate = parseISO(filtered[0].date);
  const points = filtered.map(s => ({
    x: differenceInDays(parseISO(s.date), baseDate),
    y: s.bandScore,
  }));

  const { slope, intercept, r2 } = linearRegression(points);
  const targetDays = differenceInDays(deadline, baseDate);
  const predictedScore = slope * targetDays + intercept;

  // Current average of last 3 sessions
  const recent = filtered.slice(-3);
  const currentAvg = recent.reduce((sum, s) => sum + s.bandScore, 0) / recent.length;

  // Gap analysis
  const gap = targetBand - currentAvg;
  const daysLeft = differenceInDays(deadline, new Date());

  // Standard deviation of scores
  const scores = filtered.map(s => s.bandScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Probability calculation using multiple factors
  let probability = 0;

  if (gap <= 0) {
    // Already at or above target
    probability = 85 + Math.min(15, filtered.length * 2);
  } else {
    // Base probability from trend
    const trendProbability = predictedScore >= targetBand ? 60 :
      Math.max(5, 60 - (targetBand - predictedScore) * 40);

    // Consistency bonus (low variance = more reliable)
    const consistencyBonus = stdDev < 0.3 ? 10 : stdDev < 0.5 ? 5 : 0;

    // Growth rate bonus
    const growthBonus = slope > 0.05 ? 15 : slope > 0.02 ? 10 : slope > 0 ? 5 : -10;

    // Practice frequency bonus
    const practiceDays = filtered.length;
    const totalDaySpan = differenceInDays(new Date(), baseDate) || 1;
    const frequency = practiceDays / totalDaySpan;
    const frequencyBonus = frequency > 0.7 ? 10 : frequency > 0.4 ? 5 : 0;

    probability = Math.min(95, Math.max(5,
      trendProbability + consistencyBonus + growthBonus + frequencyBonus
    ));
  }

  const confidence = r2 > 0.7 ? 'high' : r2 > 0.4 ? 'medium' : 'low';

  let message = '';
  if (probability >= 80) {
    message = '현재 추세라면 목표 달성 가능성이 높습니다!';
  } else if (probability >= 50) {
    message = '꾸준히 연습하면 달성 가능합니다. 약한 부분에 집중하세요.';
  } else if (probability >= 30) {
    message = '더 많은 노력이 필요합니다. 매일 집중 연습을 권장합니다.';
  } else {
    message = '목표를 조정하거나 학습 방법을 크게 바꿔야 할 수 있습니다.';
  }

  return {
    probability: Math.round(probability),
    predictedScore: Math.round(predictedScore * 2) / 2, // Round to nearest 0.5
    currentAvg: Math.round(currentAvg * 2) / 2,
    gap,
    daysLeft,
    growthRate: slope,
    consistency: stdDev,
    confidence,
    message,
    r2,
  };
}

// Analyze error patterns to find recurring mistakes
export function analyzeErrorPatterns(sessions, type) {
  const filtered = sessions.filter(s => s.type === type && s.errors && s.errors.length > 0);

  if (filtered.length === 0) return { categories: {}, questionTypes: {}, recurring: [] };

  // Count error categories
  const categories = {};
  const questionTypes = {};
  const errorDetails = [];

  for (const session of filtered) {
    for (const error of session.errors) {
      // Category counts
      if (error.category) {
        categories[error.category] = (categories[error.category] || 0) + 1;
      }
      // Question type counts
      if (error.questionType) {
        questionTypes[error.questionType] = (questionTypes[error.questionType] || 0) + 1;
      }
      errorDetails.push({
        ...error,
        sessionDate: session.date,
        sessionId: session.id,
      });
    }
  }

  // Find recurring patterns (categories that appear in >40% of sessions)
  const totalSessions = filtered.length;
  const recurring = Object.entries(categories)
    .filter(([, count]) => count / totalSessions > 0.4)
    .map(([category, count]) => ({
      category,
      count,
      frequency: Math.round((count / totalSessions) * 100),
    }))
    .sort((a, b) => b.frequency - a.frequency);

  return { categories, questionTypes, recurring, totalErrors: errorDetails.length };
}

// Calculate moving average for smoother trend visualization
export function movingAverage(sessions, type, window = 3) {
  const filtered = sessions
    .filter(s => s.type === type)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return filtered.map((session, i) => {
    const start = Math.max(0, i - window + 1);
    const windowSessions = filtered.slice(start, i + 1);
    const avg = windowSessions.reduce((sum, s) => sum + s.bandScore, 0) / windowSessions.length;
    return {
      date: session.date,
      bandScore: session.bandScore,
      movingAvg: Math.round(avg * 10) / 10,
    };
  });
}
