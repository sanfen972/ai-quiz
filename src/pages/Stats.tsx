import { useMemo } from 'react';
import { questions } from '../data/questions';
import { useStorage } from '../hooks/useStorage';
import type { QuizRecord } from '../types';

export default function Stats() {
  const [records] = useStorage<QuizRecord[]>('quiz-records', []);

  const stats = useMemo(() => {
    if (records.length === 0) return null;

    const total = records.length;
    const practice = records.filter((r) => r.mode === 'practice');
    const exams = records.filter((r) => r.mode === 'exam');
    const avgScore = records.reduce((s, r) => s + (r.score / r.total) * 100, 0) / total;

    // Per chapter accuracy
    const chapterMap = new Map<string, { correct: number; total: number }>();
    records.forEach((r) => {
      r.questionIds.forEach((qid, i) => {
        const q = questions.find((q) => q.id === qid);
        if (!q) return;
        const entry = chapterMap.get(q.chapter) || { correct: 0, total: 0 };
        entry.total++;
        if (r.correct[i]) entry.correct++;
        chapterMap.set(q.chapter, entry);
      });
    });

    const chapterStats = [...chapterMap.entries()]
      .map(([ch, { correct, total }]) => ({ chapter: ch, pct: Math.round((correct / total) * 100), correct, total }))
      .sort((a, b) => a.pct - b.pct);

    // Recent trend (last 10)
    const recent = [...records].reverse().slice(0, 10).map((r) => ({
      date: r.date.slice(5, 16),
      score: Math.round((r.score / r.total) * 100),
      mode: r.mode,
    }));

    // Total time
    const totalSecs = records.reduce((s, r) => s + r.duration, 0);
    const totalMins = Math.floor(totalSecs / 60);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    const totalQuestions = records.reduce((s, r) => s + r.total, 0);
    const totalCorrect = records.reduce((s, r) => s + r.score, 0);

    return { total, practice: practice.length, exams: exams.length, avgScore, chapterStats, recent, hours, mins, totalQuestions, totalCorrect };
  }, [records]);

  if (!stats) {
    return (
      <div className="page">
        <h1>答题统计</h1>
        <div className="empty-state">
          <p>暂无数据</p>
          <p className="hint">完成一些练习或考试后，统计数据会显示在这里</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page stats-page">
      <h1>答题统计</h1>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">总答题次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.practice}</div>
          <div className="stat-label">练习次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.exams}</div>
          <div className="stat-label">考试次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.avgScore.toFixed(1)}%</div>
          <div className="stat-label">平均正确率</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.totalCorrect}/{stats.totalQuestions}</div>
          <div className="stat-label">正确/总题数</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.hours}h {stats.mins}m</div>
          <div className="stat-label">总学习时长</div>
        </div>
      </div>

      <div className="section">
        <h2>章节正确率</h2>
        <div className="chapter-stats">
          {stats.chapterStats.map(({ chapter, pct, correct, total }) => (
            <div key={chapter} className="chapter-row">
              <span className="chapter-name">{chapter}</span>
              <div className="chapter-bar-wrap">
                <div className="chapter-bar" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444' }} />
              </div>
              <span className="chapter-pct">{pct}% ({correct}/{total})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>最近答题趋势</h2>
        <div className="trend-list">
          {stats.recent.map((r, i) => (
            <div key={i} className="trend-item">
              <span className="trend-date">{r.date}</span>
              <span className="trend-mode">{r.mode === 'practice' ? '练习' : '考试'}</span>
              <div className="trend-bar-wrap">
                <div className="trend-bar" style={{ width: `${r.score}%`, backgroundColor: r.score >= 70 ? '#22c55e' : r.score >= 50 ? '#eab308' : '#ef4444' }} />
              </div>
              <span className="trend-score">{r.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
