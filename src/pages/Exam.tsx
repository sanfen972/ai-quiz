import { useState, useMemo, useCallback } from 'react';
import { questions } from '../data/questions';
import { useQuiz } from '../hooks/useQuiz';
import { useStorage } from '../hooks/useStorage';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import type { QuestionType, QuizRecord } from '../types';

const chapters = [...new Set(questions.map((q) => q.chapter))].sort(
  (a, b) => questions.findIndex((q) => q.chapter === a) - questions.findIndex((q) => q.chapter === b),
);

export default function Exam() {
  const [records, setRecords] = useStorage<QuizRecord[]>('quiz-records', []);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [selectedChapters, setSelectedChapters] = useState<string[]>(chapters);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['single', 'multiple', 'judgment']);
  const [examKey, setExamKey] = useState(0);

  const filteredPool = useMemo(
    () => questions.filter((q) => selectedChapters.includes(q.chapter) && selectedTypes.includes(q.type)),
    [selectedChapters, selectedTypes],
  );

  const {
    current, isFirst, isLast, progress,
    startQuiz, selectOption, goNext, goPrev, state, jumpTo,
  } = useQuiz(filteredPool);

  const toggleChapter = (ch: string) =>
    setSelectedChapters((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));

  const toggleType = (t: QuestionType) =>
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleStart = () => {
    if (selectedChapters.length === 0 || selectedTypes.length === 0 || filteredPool.length === 0) return;
    const count = Math.min(questionCount, filteredPool.length);
    startQuiz(filteredPool, count);
    setStarted(true);
    setSubmitted(false);
    setExamKey((k) => k + 1);
  };

  const buildRecord = useCallback((): QuizRecord => {
    const correct = state.questions.map((q, i) => {
      const userAns = state.answers[i] || [];
      return userAns.length === q.answer.length && userAns.every((a) => q.answer.includes(a));
    });
    const score = correct.filter(Boolean).length;
    return {
      id: Date.now().toString(),
      date: new Date().toLocaleString('zh-CN'),
      mode: 'exam',
      questionIds: state.questions.map((q) => q.id),
      answers: state.answers,
      correct,
      score,
      total: state.questions.length,
      duration: Math.floor((Date.now() - state.startTime) / 1000),
    };
  }, [state]);

  const handleSubmit = () => {
    const record = buildRecord();
    setRecords([...records, record]);
    setSubmitted(true);
  };

  const handleTimeout = () => {
    const record = buildRecord();
    setRecords([...records, record]);
    setSubmitted(true);
  };

  if (!started) {
    return (
      <div className="page setup-page">
        <h1>考试模式</h1>
        <p className="desc">限时答题，统一交卷后查看成绩和解析，模拟真实考试场景</p>
        <div className="setup-form">
          <label>题目数量：{Math.min(questionCount, filteredPool.length)} 题（可用 {filteredPool.length} 题）</label>
          <input type="range" min={3} max={Math.max(3, filteredPool.length)} value={Math.min(questionCount, filteredPool.length)} onChange={(e) => setQuestionCount(+e.target.value)} />
          <label>时间限制：{timeLimit} 分钟</label>
          <input type="range" min={3} max={60} step={1} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} />
          <label>选择章节：</label>
          <div className="checkbox-group">
            {chapters.map((ch, i) => (
              <label key={ch} className="checkbox">
                <input type="checkbox" checked={selectedChapters.includes(ch)} onChange={() => toggleChapter(ch)} />
                {i + 1}. {ch}
              </label>
            ))}
          </div>
          <label>题目类型：</label>
          <div className="checkbox-group">
            {(['single', 'multiple', 'judgment'] as QuestionType[]).map((t) => (
              <label key={t} className="checkbox">
                <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                {{ single: '单选题', multiple: '多选题', judgment: '判断题' }[t]}
              </label>
            ))}
          </div>
          <button className="btn primary" onClick={handleStart} disabled={filteredPool.length === 0}>开始考试</button>
        </div>
      </div>
    );
  }

  // Show result after submit
  if (submitted) {
    const lastRecord = records[records.length - 1];
    const score = lastRecord?.score ?? 0;
    const total = lastRecord?.total ?? 0;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const duration = lastRecord?.duration ?? 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const grade = pct >= 90 ? '优秀' : pct >= 70 ? '良好' : pct >= 60 ? '及格' : '不及格';

    return (
      <div className="page quiz-page">
        <h1>考试结果</h1>
        <div className="score-summary">
          <div className="big-score">{score} / {total}</div>
          <div className="score-pct">{pct} 分 — {grade}</div>
          <div className="score-detail">用时 {mins} 分 {secs} 秒</div>
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
        <button className="btn primary" onClick={() => { setStarted(false); setSubmitted(false); }} style={{ marginTop: 16 }}>返回设置</button>
      </div>
    );
  }

  return (
    <div className="page quiz-page">
      <div className="quiz-top">
        <div className="quiz-top-row">
          <div className="progress-info">第 {progress.current} / {progress.total} 题</div>
          <Timer key={examKey} seconds={timeLimit * 60} onTimeout={handleTimeout} running={started && !submitted} />
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
