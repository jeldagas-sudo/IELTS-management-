import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Headphones, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSessions, deleteSession } from '../utils/storage';
import { ERROR_CATEGORIES } from '../utils/scoring';

export default function Sessions() {
  const [sessions, setSessions] = useState(getSessions());
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    const list = filter === 'all' ? sessions : sessions.filter(s => s.type === filter);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sessions, filter]);

  const handleDelete = (id) => {
    if (window.confirm('이 세션을 삭제하시겠습니까?')) {
      deleteSession(id);
      setSessions(getSessions());
    }
  };

  const getCategoryLabel = (catId) => {
    const cat = ERROR_CATEGORIES.find(c => c.id === catId);
    return cat ? cat.label : catId;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">세션 기록</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'reading', 'listening'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer border-none ${
                filter === f ? 'bg-white text-text shadow-sm' : 'text-text-secondary hover:text-text'
              }`}
            >
              {f === 'all' ? '전체' : f === 'reading' ? 'Reading' : 'Listening'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p>기록된 세션이 없습니다.</p>
          <Link to="/add" className="text-primary-light mt-2 inline-block no-underline hover:underline">
            첫 세션 기록하기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => (
            <div
              key={session.id}
              className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
            >
              {/* Session Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              >
                <div className={`p-2 rounded-lg ${session.type === 'reading' ? 'bg-reading/10' : 'bg-listening/10'}`}>
                  {session.type === 'reading' ? (
                    <BookOpen size={20} className="text-reading" />
                  ) : (
                    <Headphones size={20} className="text-listening" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.type === 'reading' ? 'Reading' : 'Listening'}</span>
                    <span className="text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded">
                      {session.source || '소스 미입력'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {format(parseISO(session.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                    {session.section && ` · ${session.section}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${session.type === 'reading' ? 'text-reading' : 'text-listening'}`}>
                    {session.bandScore}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {session.totalQuestions - session.wrongAnswers}/{session.totalQuestions} 정답
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                    className="p-1.5 rounded hover:bg-red-50 text-text-secondary hover:text-danger transition-colors cursor-pointer bg-transparent border-none"
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedId === session.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === session.id && (
                <div className="border-t border-border p-4 bg-gray-50/50 space-y-4">
                  {session.notes && (
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">메모</p>
                      <p className="text-sm">{session.notes}</p>
                    </div>
                  )}

                  {session.errors && session.errors.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-2">
                        오답 분석 ({session.errors.length}개)
                      </p>
                      <div className="space-y-2">
                        {session.errors.map((error, i) => (
                          <div key={error.id || i} className="bg-white rounded-lg border border-border p-3 text-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {error.questionNumber && (
                                  <span className="bg-gray-100 text-text-secondary px-2 py-0.5 rounded text-xs font-medium">
                                    Q.{error.questionNumber}
                                  </span>
                                )}
                                {error.category && (
                                  <span className="bg-red-50 text-danger px-2 py-0.5 rounded text-xs">
                                    {getCategoryLabel(error.category)}
                                  </span>
                                )}
                                {error.questionType && (
                                  <span className="bg-blue-50 text-primary px-2 py-0.5 rounded text-xs">
                                    {error.questionType}
                                  </span>
                                )}
                              </div>
                            </div>
                            {(error.myAnswer || error.correctAnswer) && (
                              <div className="flex gap-4 mb-2">
                                {error.myAnswer && (
                                  <span className="text-danger text-xs">내 답: <span className="line-through">{error.myAnswer}</span></span>
                                )}
                                {error.correctAnswer && (
                                  <span className="text-success text-xs">정답: <strong>{error.correctAnswer}</strong></span>
                                )}
                              </div>
                            )}
                            {(error.originalText || error.paraphrasedText) && (
                              <div className="bg-amber-50 rounded p-2 mb-2">
                                <p className="text-xs text-amber-700 font-medium mb-1">패러프레이즈</p>
                                {error.originalText && (
                                  <p className="text-xs"><span className="text-text-secondary">원문:</span> {error.originalText}</p>
                                )}
                                {error.paraphrasedText && (
                                  <p className="text-xs"><span className="text-text-secondary">변형:</span> {error.paraphrasedText}</p>
                                )}
                              </div>
                            )}
                            {error.explanation && (
                              <p className="text-xs text-text-secondary">{error.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
