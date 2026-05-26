import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useWrongBook } from '../hooks/useWrongBook';
import QuestionCard from '../components/QuestionCard';
import WrongBookRetest from '../components/WrongBookRetest';
import type { QuizRecord } from '../types';

export default function WrongBook() {
  const [records, setRecords] = useStorage<QuizRecord[]>('quiz-records', []);
  const [mastered, setMastered] = useStorage<string[]>('wrong-mastered', []);

  const { wrongQuestions, allWrong, toggleMastered } = useWrongBook(records, mastered, setMastered);

  const [mode, setMode] = useState<'list' | 'review' | 'retest'>('list');
  const [reviewIndex, setReviewIndex] = useState(0);

  const clearWrong = () => {
    if (confirm('确定清空所有答题记录？这将清除错题本和掌握状态。')) {
      localStorage.removeItem('quiz-records');
      localStorage.removeItem('wrong-mastered');
      window.location.reload();
    }
  };

  const resetMastered = () => {
    if (confirm('确定重置掌握状态？所有错题将重新显示。')) {
      setMastered([]);
    }
  };

  if (mode === 'retest') {
    return (
      <WrongBookRetest
        wrongQuestions={wrongQuestions}
        allWrongLength={allWrong.length}
        records={records}
        onSaveRecord={setRecords}
        onMarkMastered={(ids) => setMastered([...new Set([...mastered, ...ids])])}
        onBack={() => setMode('list')}
      />
    );
  }

  // -- Review mode --
  if (mode === 'review' && allWrong[reviewIndex]) {
    const q = allWrong[reviewIndex];
    return (
      <div className="page quiz-page">
        <div className="page-header">
          <h1>错题复习</h1>
          <button className="btn" onClick={() => { setMode('list'); setReviewIndex(0); }}>返回列表</button>
        </div>
        <div className="quiz-top">
          <div className="progress-info">
            第 {reviewIndex + 1} / {allWrong.length} 题（错 {q.wrongCount} 次）
            {mastered.includes(q.id) && <span className="mastered-tag">已掌握</span>}
          </div>
        </div>
        <QuestionCard question={q} selected={[]} onSelect={() => {}} showResult />
        <div className="quiz-nav">
          <button className="btn" onClick={() => setReviewIndex(reviewIndex - 1)} disabled={reviewIndex === 0}>上一题</button>
          <button className="btn" onClick={() => toggleMastered(q.id)}>
            {mastered.includes(q.id) ? '取消掌握' : '标记已掌握'}
          </button>
          <button className="btn primary" onClick={() => setReviewIndex(reviewIndex + 1)} disabled={reviewIndex === allWrong.length - 1}>下一题</button>
        </div>
      </div>
    );
  }

  // -- List view --
  return (
    <div className="page">
      <div className="page-header">
        <h1>错题本</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {wrongQuestions.length > 0 && (
            <button className="btn danger" onClick={clearWrong}>清空记录</button>
          )}
        </div>
      </div>

      {allWrong.length === 0 ? (
        <div className="empty-state">
          <p>暂无错题</p>
          <p className="hint">去做一些练习或考试吧，错题会自动收集到这里</p>
        </div>
      ) : (
        <>
          {wrongQuestions.length > 0 && (
            <>
              <p className="desc">共 <strong>{wrongQuestions.length}</strong> 道未掌握错题，选择模式进行复习巩固</p>
              <div className="wrong-actions">
                <button className="btn primary" onClick={() => setMode('retest')}>错题重考 / 练习</button>
              </div>
              <div className="wrong-list" style={{ marginTop: 16 }}>
                {wrongQuestions.map((q, i) => (
                  <div key={q.id} className="wrong-item" onClick={() => { setReviewIndex(i); setMode('review'); }}>
                    <span className="wrong-count">错{q.wrongCount}次</span>
                    <span className="wrong-chapter">{q.chapter}</span>
                    <span className="wrong-q">{q.question}</span>
                    <span className="wrong-arrow">›</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {allWrong.length > wrongQuestions.length && (
            <div style={{ marginTop: 24 }}>
              <div className="page-header">
                <h2 style={{ fontSize: 16, margin: 0 }}>已掌握错题（{allWrong.length - wrongQuestions.length} 道）</h2>
                <button className="btn" onClick={resetMastered}>重置掌握状态</button>
              </div>
              <div className="wrong-list" style={{ marginTop: 8 }}>
                {allWrong.filter((q) => mastered.includes(q.id)).map((q) => (
                  <div key={q.id} className="wrong-item mastered" onClick={() => {
                    const i = allWrong.findIndex((x) => x.id === q.id);
                    setReviewIndex(i >= 0 ? i : 0);
                    setMode('review');
                  }}>
                    <span className="wrong-count mastered-tag-count">已掌握</span>
                    <span className="wrong-chapter">{q.chapter}</span>
                    <span className="wrong-q">{q.question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
