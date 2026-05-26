import { useState, useMemo, useCallback } from 'react';
import { questions } from '../data/questions';
import { getChapters } from '../utils/quiz';
import { useQuiz } from '../hooks/useQuiz';
import { useStorage } from '../hooks/useStorage';
import QuestionCard from '../components/QuestionCard';
import QuizSetup from '../components/QuizSetup';
import QuizResult from '../components/QuizResult';
import type { QuizRecord } from '../types';

const chapters = getChapters(questions);

export default function Practice() {
  const [records, setRecords] = useStorage<QuizRecord[]>('quiz-records', []);
  const [started, setStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedChapters, setSelectedChapters] = useState<string[]>(chapters);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const filteredPool = useMemo(
    () => questions.filter((q) => selectedChapters.includes(q.chapter)),
    [selectedChapters],
  );

  const { current, isFirst, isLast, progress, startQuiz, selectOption, goNext, goPrev, state, finish } = useQuiz(filteredPool);

  const toggleChapter = useCallback((ch: string) =>
    setSelectedChapters((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch])),
  []);

  const handleStart = () => {
    if (selectedChapters.length === 0 || filteredPool.length === 0) return;
    startQuiz(filteredPool, Math.min(questionCount, filteredPool.length));
    setStarted(true);
    setShowResult(false);
    setFinished(false);
  };

  const handleSelect = useCallback(
    (i: number) => { if (!showResult) selectOption(i); },
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

  const hasAnswered = current ? (state.answers[state.currentIndex] || []).length > 0 : false;

  if (!started) {
    return (
      <QuizSetup
        title="练习模式"
        description="不限时，每题提交后即时显示答案和解析，适合日常学习巩固"
        questionCount={questionCount}
        maxQuestions={filteredPool.length}
        onQuestionCountChange={setQuestionCount}
        chapters={chapters}
        selectedChapters={selectedChapters}
        onToggleChapter={toggleChapter}
        onStart={handleStart}
        startLabel="开始练习"
      />
    );
  }

  if (finished) {
    const lastRecord = records[records.length - 1];
    return (
      <QuizResult
        title="练习完成！"
        score={lastRecord?.score ?? 0}
        total={lastRecord?.total ?? 0}
        questions={state.questions}
        answers={state.answers}
        onBack={() => setStarted(false)}
        backLabel="返回设置"
      />
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
            <button className="btn primary" onClick={() => setShowResult(true)} disabled={!hasAnswered}>
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
