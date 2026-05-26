import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { questions } from '../data/questions';
import { getChapters, buildRecord } from '../utils/quiz';
import { useQuiz } from '../hooks/useQuiz';
import { useStorage } from '../hooks/useStorage';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import QuizSetup from '../components/QuizSetup';
import QuizResult from '../components/QuizResult';
import type { QuizRecord } from '../types';

const chapters = getChapters(questions);

export default function Exam() {
  const [records, setRecords] = useStorage<QuizRecord[]>('quiz-records', []);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [selectedChapters, setSelectedChapters] = useState<string[]>(chapters);
  const [examKey, setExamKey] = useState(0);

  const filteredPool = useMemo(
    () => questions.filter((q) => selectedChapters.includes(q.chapter)),
    [selectedChapters],
  );

  const {
    current, isFirst, isLast, progress,
    startQuiz, selectOption, goNext, goPrev, state, jumpTo,
  } = useQuiz(filteredPool);

  const toggleChapter = useCallback((ch: string) =>
    setSelectedChapters((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch])),
  []);

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleOptionSelect = useCallback((i: number) => {
    selectOption(i);
    if (current && (current.type === 'single' || current.type === 'judgment') && !isLast) {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = setTimeout(() => goNext(), 400);
    }
  }, [selectOption, current, isLast, goNext]);

  useEffect(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, [state.currentIndex]);

  useEffect(() => () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
  }, []);

  const handleStart = () => {
    if (selectedChapters.length === 0 || filteredPool.length === 0) return;
    startQuiz(filteredPool, Math.min(questionCount, filteredPool.length));
    setStarted(true);
    setSubmitted(false);
    setExamKey((k) => k + 1);
  };

  const saveRecord = useCallback(() => {
    const record = buildRecord(state, 'exam');
    setRecords([...records, record]);
    setSubmitted(true);
  }, [state, records, setRecords]);

  if (!started) {
    return (
      <QuizSetup
        title="考试模式"
        description="限时答题，统一交卷后查看成绩和解析，模拟真实考试场景"
        questionCount={questionCount}
        maxQuestions={filteredPool.length}
        onQuestionCountChange={setQuestionCount}
        chapters={chapters}
        selectedChapters={selectedChapters}
        onToggleChapter={toggleChapter}
        timeLimit={timeLimit}
        onTimeLimitChange={setTimeLimit}
        onStart={handleStart}
        startLabel="开始考试"
      />
    );
  }

  if (submitted) {
    const lastRecord = records[records.length - 1];
    const score = lastRecord?.score ?? 0;
    const total = lastRecord?.total ?? 0;
    const duration = lastRecord?.duration ?? 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const grade = pct >= 90 ? '优秀' : pct >= 70 ? '良好' : pct >= 60 ? '及格' : '不及格';

    return (
      <QuizResult
        title="考试结果"
        score={score}
        total={total}
        questions={state.questions}
        answers={lastRecord?.answers ?? []}
        detailLine={`用时 ${mins} 分 ${secs} 秒`}
        grade={grade}
        onBack={() => { setStarted(false); setSubmitted(false); }}
        backLabel="返回设置"
      />
    );
  }

  const DOT_WINDOW = 10;
  const totalDots = state.questions.length;
  const useWindowing = totalDots > DOT_WINDOW;
  const halfWindow = Math.floor(DOT_WINDOW / 2);
  let dotStart = 0;
  let dotEnd = totalDots;
  if (useWindowing) {
    dotStart = Math.max(0, state.currentIndex - halfWindow);
    dotEnd = Math.min(totalDots, dotStart + DOT_WINDOW);
    if (dotEnd - dotStart < DOT_WINDOW) {
      dotStart = Math.max(0, dotEnd - DOT_WINDOW);
    }
  }

  return (
    <div className="page quiz-page">
      <div className="quiz-top">
        <div className="quiz-top-row">
          <div className="progress-info">第 {progress.current} / {progress.total} 题</div>
          <Timer key={examKey} seconds={timeLimit * 60} onTimeout={saveRecord} running={started && !submitted} />
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(progress.answered / progress.total) * 100}%` }} />
        </div>
      </div>

      {current && (
        <QuestionCard
          question={current}
          selected={state.answers[state.currentIndex]}
          onSelect={handleOptionSelect}
        />
      )}

      <div className="quiz-nav">
        <button className="btn" onClick={goPrev} disabled={isFirst}>上一题</button>
        <div className="answer-indicator">
          {useWindowing && dotStart > 0 && (
            <button className="dot dot-nav" onClick={() => jumpTo(Math.max(0, dotStart - DOT_WINDOW))} title="前一页">
              «
            </button>
          )}
          {state.answers.slice(dotStart, dotEnd).map((a, i) => {
            const realIndex = dotStart + i;
            return (
              <button
                key={realIndex}
                className={`dot ${a.length > 0 ? 'answered' : ''} ${realIndex === state.currentIndex ? 'current' : ''}`}
                onClick={() => jumpTo(realIndex)}
              >
                {realIndex + 1}
              </button>
            );
          })}
          {useWindowing && dotEnd < totalDots && (
            <button className="dot dot-nav" onClick={() => jumpTo(Math.min(totalDots - 1, dotEnd))} title="后一页">
              »
            </button>
          )}
        </div>
        {isLast ? (
          <button className="btn primary" onClick={saveRecord}>交卷</button>
        ) : (
          <button className="btn primary" onClick={goNext}>下一题</button>
        )}
      </div>
    </div>
  );
}
