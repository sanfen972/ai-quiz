import { useMemo, useRef, useCallback } from 'react';
import { questions } from '../data/questions';
import { useStorage } from '../hooks/useStorage';
import type { QuizRecord } from '../types';

export default function Stats() {
  const [records] = useStorage<QuizRecord[]>('quiz-records', []);
  const fileInput = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    if (records.length === 0) return null;

    const total = records.length;
    const practice = records.filter((r) => r.mode === 'practice');
    const exams = records.filter((r) => r.mode === 'exam');
    const avgScore = records.reduce((s, r) => s + (r.score / r.total) * 100, 0) / total;

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

    const recent = [...records].reverse().slice(0, 10).map((r) => ({
      date: r.date.slice(5, 16),
      score: Math.round((r.score / r.total) * 100),
      mode: r.mode,
    }));

    const totalSecs = records.reduce((s, r) => s + r.duration, 0);
    const totalMins = Math.floor(totalSecs / 60);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    const totalQuestions = records.reduce((s, r) => s + r.total, 0);
    const totalCorrect = records.reduce((s, r) => s + r.score, 0);

    return { total, practice: practice.length, exams: exams.length, avgScore, chapterStats, recent, hours, mins, totalQuestions, totalCorrect };
  }, [records]);

  const handleExport = useCallback(() => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === 'quiz-records' || key === 'wrong-mastered')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-quiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    fileInput.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let imported = 0;
        for (const [key, value] of Object.entries(data)) {
          if ((key === 'quiz-records' || key === 'wrong-mastered') && typeof value === 'string') {
            if (key === 'quiz-records') {
              const existing = JSON.parse(localStorage.getItem(key) || '[]');
              const incoming = JSON.parse(value);
              localStorage.setItem(key, JSON.stringify(existing.concat(incoming)));
              imported += incoming.length;
            } else {
              const existing = JSON.parse(localStorage.getItem(key) || '[]');
              const incoming = JSON.parse(value);
              localStorage.setItem(key, JSON.stringify([...new Set([...existing, ...incoming])]));
              imported++;
            }
          }
        }
        alert(`导入成功！已合并 ${imported > 0 ? imported + ' 条记录' : '数据'}。即将刷新页面。`);
        window.location.reload();
      } catch {
        alert('导入失败：文件格式不正确，请选择有效的备份文件。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  return (
    <div className="page stats-page">
      <h1>答题统计</h1>

      {!stats ? (
        <div className="empty-state">
          <p>暂无数据</p>
          <p className="hint">完成一些练习或考试后，统计数据会显示在这里</p>
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className="sync-section">
        <div className="sync-divider"><span>数据同步</span></div>
        <p className="sync-hint">在不同设备间手动同步答题记录和错题进度</p>
        <div className="sync-buttons">
          <button className="btn" onClick={handleExport}>📤 导出数据</button>
          <button className="btn" onClick={handleImport}>📥 导入数据</button>
          <input ref={fileInput} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
}
