import { useState, useMemo, useCallback } from 'react';
import { questions } from '../data/questions';
import { useQuiz } from '../hooks/useQuiz';
import { useStorage } from '../hooks/useStorage';
import QuestionCard from '../components/QuestionCard';
import type { QuestionType, QuizRecord } from '../types';

const chapters = [...new Set(questions.map((q) => q.chapter))].sort(
  (a, b) => questions.findIndex((q) => q.chapter === a) - questions.findIndex((q) => q.chapter === b),
);

export default function Practice() {
  const [records, setRecords] = useStorage<QuizRecord[]>('quiz-records', []);
  const [started, setStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedChapters, setSelectedChapters] = useState<string[]>(chapters);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['single', 'multiple', 'judgment']);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const filteredPool = useMemo(
    () => questions.filter((q) => selectedChapters.includes(q.chapter) && selectedTypes.includes(q.type)),
    [selectedChapters, selectedTypes],
  );

  const { current, isFirst, isLast, progress, startQuiz, selectOption, goNext, goPrev, state, finish } = useQuiz(filteredPool);

  const toggleChapter = (ch: string) =>
    setSelectedChapters((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));

  const toggleType = (t: QuestionType) =>
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleStart = () => {
    if (selectedChapters.length === 0 || selectedTypes.length === 0 || filteredPool.length === 0) return;
    const count = Math.min(questionCount, filteredPool.length);
    startQuiz(filteredPool, count);
    setStarted(true);
    setShowResult(false);
    setFinished(false);
  };

  const handleSelect = useCallback(
    (i: number) => {
      if (showResult) return;
      selectOption(i);
    },
    [showResult, selectOption],
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      const record = finish('practice');
      setRecords([...records, record]);
      setFinished(true);
    } else {
      setShowResult(false);
      goNext();
    }
  }, [isLast, finish, records, setRecords, goNext]);

  const handleCheck = () => {
    setShowResult(true);
  };

  const hasAnswered = current ? (state.answers[state.currentIndex] || []).length > 0 : false;

  if (!started) {
    return (
      <div className="page setup-page">
        <h1>练习模式</h1>
        <p className="desc">不限时，每题提交后即时显示答案和解析，适合日常学习巩固</p>
        <div className="setup-form">
          <label>题目数量：{Math.min(questionCount, filteredPool.length)} 题（可用 {filteredPool.length} 题）</label>
          <input type="range" min={3} max={Math.max(3, filteredPool.length)} value={Math.min(questionCount, filteredPool.length)} onChange={(e) => setQuestionCount(+e.target.value)} />
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
          <button className="btn primary" onClick={handleStart} disabled={filteredPool.length === 0}>开始练习</button>
        </div>
      </div>
    );
  }

  if (finished) {
    const lastRecord = records[records.length - 1];
    const score = lastRecord?.score ?? 0;
    const total = lastRecord?.total ?? 0;

    return (
      <div className="page quiz-page">
        <h1>练习完成！</h1>
        <div className="score-summary">
          <div className="big-score">{score} / {total}</div>
          <div className="score-pct">{total > 0 ? Math.round((score / total) * 100) : 0} 分</div>
        </div>
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
        <button className="btn primary" onClick={() => setStarted(false)} style={{ marginTop: 16 }}>返回设置</button>
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
          onSelect={handleSelect}
          showResult={showResult}
        />
      )}

      <div className="quiz-nav">
        <button className="btn" onClick={goPrev} disabled={isFirst || showResult}>上一题</button>
        <div>
          {!showResult ? (
            <button className="btn primary" onClick={handleCheck} disabled={!hasAnswered}>
              提交答案
            </button>
          ) : (
            <button className="btn primary" onClick={handleNext}>
              {isLast ? '完成练习' : '下一题'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
