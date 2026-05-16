import { useState, useMemo } from 'react';
import { questions } from '../data/questions';
import { useStorage } from '../hooks/useStorage';
import { useQuiz } from '../hooks/useQuiz';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import type { QuizRecord, Question } from '../types';

type WrongQuestion = Question & { wrongCount: number };

export default function WrongBook() {
  const [records, setRecords] = useStorage<QuizRecord[]>('quiz-records', []);
  const [mastered, setMastered] = useStorage<string[]>('wrong-mastered', []);

  // Modes: list | review | retest-setup | retest-exam | retest-practice
  const [mode, setMode] = useState<'list' | 'review' | 'retest-setup' | 'retest-exam' | 'retest-practice'>('list');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [retestMode, setRetestMode] = useState<'exam' | 'practice'>('exam');
  const [timeLimit, setTimeLimit] = useState(15);
  const [examKey, setExamKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Collect wrong answers, excluding mastered ones
  const { wrongQuestions, allWrong } = useMemo(() => {
    const wrongMap = new Map<string, number>();
    records.forEach((r) => {
      r.correct.forEach((isCorrect, i) => {
        if (!isCorrect) {
          const qid = r.questionIds[i];
          wrongMap.set(qid, (wrongMap.get(qid) || 0) + 1);
        }
      });
    });

    const all: WrongQuestion[] = [...wrongMap.entries()]
      .map(([qid, count]) => {
        const q = questions.find((q) => q.id === qid);
        return q ? { ...q, wrongCount: count } : null;
      })
      .filter(Boolean) as WrongQuestion[];

    const unmastered = all.filter((q) => !mastered.includes(q.id));
    return { wrongQuestions: unmastered, allWrong: all };
  }, [records, mastered]);

  const {
    current, isFirst, isLast, progress,
    startQuiz, selectOption, goNext, goPrev, state, jumpTo,
  } = useQuiz(wrongQuestions as Question[]);

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
          <button className="btn" onClick={() => { setMastered(mastered.includes(q.id) ? mastered.filter((id) => id !== q.id) : [...mastered, q.id]); }}>
            {mastered.includes(q.id) ? '取消掌握' : '标记已掌握'}
          </button>
          <button className="btn primary" onClick={() => setReviewIndex(reviewIndex + 1)} disabled={reviewIndex === allWrong.length - 1}>下一题</button>
        </div>
      </div>
    );
  }

  // -- Retest Setup --
  if (mode === 'retest-setup') {
    return (
      <div className="page setup-page">
        <h1>{retestMode === 'exam' ? '错题重考' : '错题练习'}</h1>
        <p className="desc">
          共 <strong>{wrongQuestions.length}</strong> 道未掌握错题，全量计入考试
          {allWrong.length > wrongQuestions.length && (
            <span className="hint">（另有 {allWrong.length - wrongQuestions.length} 道已掌握）</span>
          )}
        </p>
        <div className="setup-form">
          {retestMode === 'exam' && (
            <>
              <label>时间限制：{timeLimit} 分钟</label>
              <input type="range" min={3} max={60} step={1} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} />
            </>
          )}
          <button className="btn" onClick={() => { setMode('list'); }}>返回</button>
          <button
            className="btn primary"
            onClick={() => {
              if (wrongQuestions.length === 0) return;
              startQuiz(wrongQuestions as Question[], wrongQuestions.length);
              setSubmitted(false);
              setExamKey((k) => k + 1);
              setMode(retestMode === 'exam' ? 'retest-exam' : 'retest-practice');
            }}
            disabled={wrongQuestions.length === 0}
          >
            开始{retestMode === 'exam' ? '错题重考' : '错题练习'}
          </button>
        </div>
      </div>
    );
  }

  // -- Retest Practice --
  if (mode === 'retest-practice') {
    const handlePracticeNext = () => {
      if (isLast) {
        // Save record
        const correct = state.questions.map((q, i) => {
          const userAns = state.answers[i] || [];
          return userAns.length === q.answer.length && userAns.every((a) => q.answer.includes(a));
        });
        const record: QuizRecord = {
          id: Date.now().toString(),
          date: new Date().toLocaleString('zh-CN'),
          mode: 'practice',
          questionIds: state.questions.map((q) => q.id),
          answers: state.answers,
          correct,
          score: correct.filter(Boolean).length,
          total: state.questions.length,
          duration: Math.floor((Date.now() - state.startTime) / 1000),
        };
        setRecords([...records, record]);
        // Mark correct ones as mastered
        const newMastered = state.questions.filter((_, i) => correct[i]).map((q) => q.id);
        setMastered([...new Set([...mastered, ...newMastered])]);
        setMode('list');
      } else {
        goNext();
      }
    };

    if (submitted) {
      return (
        <div className="page quiz-page">
          <h1>错题练习完成</h1>
          <div className="result-cards">
            {state.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                selected={state.answers[i] || []}
                onSelect={() => {}}
                showResult
              />
            ))}
          </div>
          <button className="btn primary" onClick={() => setMode('list')}>返回错题本</button>
        </div>
      );
    }

    return (
      <div className="page quiz-page">
        <div className="quiz-top">
          <div className="progress-info">第 {progress.current} / {progress.total} 题</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress.answered / progress.total) * 100}%` }} />
          </div>
        </div>
        {current && (
          <QuestionCard
            question={current}
            selected={state.answers[state.currentIndex]}
            onSelect={(i) => selectOption(i)}
          />
        )}
        <div className="quiz-nav">
          <button className="btn" onClick={goPrev} disabled={isFirst}>上一题</button>
          {isLast ? (
            <button className="btn primary" onClick={() => { setSubmitted(true); handlePracticeNext(); }}>完成</button>
          ) : (
            <button className="btn primary" onClick={handlePracticeNext}>下一题</button>
          )}
        </div>
      </div>
    );
  }

  // -- Retest Exam --
  if (mode === 'retest-exam') {
    const buildRecord = (): QuizRecord => {
      const correct = state.questions.map((q, i) => {
        const userAns = state.answers[i] || [];
        return userAns.length === q.answer.length && userAns.every((a) => q.answer.includes(a));
      });
      return {
        id: Date.now().toString(),
        date: new Date().toLocaleString('zh-CN'),
        mode: 'exam',
        questionIds: state.questions.map((q) => q.id),
        answers: state.answers,
        correct,
        score: correct.filter(Boolean).length,
        total: state.questions.length,
        duration: Math.floor((Date.now() - state.startTime) / 1000),
      };
    };

    const handleSubmit = () => {
      const record = buildRecord();
      setRecords([...records, record]);
      // Mark correct ones as mastered
      const newMastered = state.questions.filter((_, i) => record.correct[i]).map((q) => q.id);
      setMastered([...new Set([...mastered, ...newMastered])]);
      setSubmitted(true);
    };

    const handleTimeout = () => {
      const record = buildRecord();
      setRecords([...records, record]);
      const newMastered = state.questions.filter((_, i) => record.correct[i]).map((q) => q.id);
      setMastered([...new Set([...mastered, ...newMastered])]);
      setSubmitted(true);
    };

    if (submitted) {
      const lastRecord = records[records.length - 1];
      const score = lastRecord?.score ?? 0;
      const total = lastRecord?.total ?? 0;
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      const duration = lastRecord?.duration ?? 0;
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const grade = pct >= 90 ? '优秀' : pct >= 70 ? '良好' : pct >= 60 ? '及格' : '不及格';
      const stillWrong = state.questions.filter((_, i) => !(lastRecord?.correct[i] ?? false)).length;

      return (
        <div className="page quiz-page">
          <h1>错题重考结果</h1>
          <div className="score-summary">
            <div className="big-score">{score} / {total}</div>
            <div className="score-pct">{pct} 分 — {grade}</div>
            <div className="score-detail">
              用时 {mins} 分 {secs} 秒 · 新掌握 {total - stillWrong} 题
              {stillWrong > 0 && <span style={{ color: 'var(--danger)' }}> · 仍有 {stillWrong} 题未掌握</span>}
            </div>
          </div>
          <div className="result-cards">
            {state.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                selected={lastRecord?.answers[i] || []}
                onSelect={() => {}}
                showResult
              />
            ))}
          </div>
          <button className="btn primary" onClick={() => { setMode('list'); setSubmitted(false); }} style={{ marginTop: 16 }}>返回错题本</button>
        </div>
      );
    }

    return (
      <div className="page quiz-page">
        <div className="quiz-top">
          <div className="quiz-top-row">
            <div className="progress-info">错题重考 · 第 {progress.current} / {progress.total} 题</div>
            <Timer key={examKey} seconds={timeLimit * 60} onTimeout={handleTimeout} running={!submitted} />
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress.answered / progress.total) * 100}%` }} />
          </div>
        </div>
        {current && (
          <QuestionCard
            question={current}
            selected={state.answers[state.currentIndex]}
            onSelect={(i) => selectOption(i)}
          />
        )}
        <div className="quiz-nav">
          <button className="btn" onClick={goPrev} disabled={isFirst}>上一题</button>
          <div className="answer-indicator">
            {state.answers.map((a, i) => (
              <button
                key={i}
                className={`dot ${a.length > 0 ? 'answered' : ''} ${i === state.currentIndex ? 'current' : ''}`}
                onClick={() => jumpTo(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {isLast ? (
            <button className="btn primary" onClick={handleSubmit}>交卷</button>
          ) : (
            <button className="btn primary" onClick={goNext}>下一题</button>
          )}
        </div>
      </div>
    );
  }

  // -- Default: list view --
  return (
    <div className="page">
      <div className="page-header">
        <h1>错题本</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {wrongQuestions.length > 0 && (
            <>
              <button className="btn danger" onClick={clearWrong}>清空记录</button>
            </>
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
                <button className="btn primary" onClick={() => { setRetestMode('exam'); setMode('retest-setup'); }}>
                  错题重考（限时）
                </button>
                <button className="btn" onClick={() => { setRetestMode('practice'); setMode('retest-setup'); }}>
                  错题练习（不限时）
                </button>
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
