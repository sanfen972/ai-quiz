import { useState } from 'react';
import { buildRecord } from '../utils/quiz';
import { useQuiz } from '../hooks/useQuiz';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import QuizResult from '../components/QuizResult';
import type { QuizRecord, Question } from '../types';

interface Props {
  wrongQuestions: Question[];
  allWrongLength: number;
  records: QuizRecord[];
  onSaveRecord: (records: QuizRecord[]) => void;
  onMarkMastered: (ids: string[]) => void;
  onBack: () => void;
}

export default function WrongBookRetest({ wrongQuestions, allWrongLength, records, onSaveRecord, onMarkMastered, onBack }: Props) {
  const [mode, setMode] = useState<'setup' | 'exam' | 'practice'>('setup');
  const [submitted, setSubmitted] = useState(false);
  const [retestMode, setRetestMode] = useState<'exam' | 'practice'>('exam');
  const [timeLimit, setTimeLimit] = useState(15);
  const [examKey, setExamKey] = useState(0);

  const {
    current, isFirst, isLast, progress,
    startQuiz, selectOption, goNext, goPrev, state, jumpTo,
  } = useQuiz(wrongQuestions);

  const handleStart = (kind: 'exam' | 'practice') => {
    if (wrongQuestions.length === 0) return;
    startQuiz(wrongQuestions, wrongQuestions.length);
    setSubmitted(false);
    setExamKey((k) => k + 1);
    setRetestMode(kind);
    setMode(kind);
  };

  const saveAndMark = (record: QuizRecord) => {
    onSaveRecord([...records, record]);
    const masteredIds = state.questions.filter((_, i) => record.correct[i]).map((q) => q.id);
    onMarkMastered(masteredIds);
  };

  const handleSubmit = () => {
    const record = buildRecord(state, 'exam');
    saveAndMark(record);
    setSubmitted(true);
  };

  const handlePracticeFinish = () => {
    const record = buildRecord(state, 'practice');
    saveAndMark(record);
    onBack();
  };

  // -- Setup --
  if (mode === 'setup') {
    return (
      <div className="page setup-page">
        <h1>错题重考</h1>
        <p className="desc">
          共 <strong>{wrongQuestions.length}</strong> 道未掌握错题，全量计入考试
          {allWrongLength > wrongQuestions.length && (
            <span className="hint">（另有 {allWrongLength - wrongQuestions.length} 道已掌握）</span>
          )}
        </p>
        <div className="setup-form">
          <label>选择模式：</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${retestMode === 'exam' ? 'primary' : ''}`}
              onClick={() => setRetestMode('exam')}
            >
              限时重考
            </button>
            <button
              className={`btn ${retestMode === 'practice' ? 'primary' : ''}`}
              onClick={() => setRetestMode('practice')}
            >
              不限时练习
            </button>
          </div>
          {retestMode === 'exam' && (
            <>
              <label>时间限制：{timeLimit} 分钟</label>
              <input type="range" min={3} max={60} step={1} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} />
            </>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onBack}>返回</button>
            <button className="btn primary" onClick={() => handleStart(retestMode)} disabled={wrongQuestions.length === 0}>
              开始{retestMode === 'exam' ? '重考' : '练习'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -- Practice mode --
  if (mode === 'practice') {
    const handleNext = () => {
      if (isLast) {
        handlePracticeFinish();
      } else {
        goNext();
      }
    };

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
            <button className="btn primary" onClick={handleNext}>完成</button>
          ) : (
            <button className="btn primary" onClick={handleNext}>下一题</button>
          )}
        </div>
      </div>
    );
  }

  // -- Exam mode --
  if (submitted) {
    const lastRecord = records[records.length - 1];
    const score = lastRecord?.score ?? 0;
    const total = lastRecord?.total ?? 0;
    const duration = lastRecord?.duration ?? 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const stillWrong = state.questions.filter((_, i) => !(lastRecord?.correct[i] ?? false)).length;

    return (
      <QuizResult
        title="错题重考结果"
        score={score}
        total={total}
        questions={state.questions}
        answers={lastRecord?.answers ?? []}
        detailLine={`用时 ${mins} 分 ${secs} 秒 · 新掌握 ${total - stillWrong} 题${stillWrong > 0 ? ` · 仍有 ${stillWrong} 题未掌握` : ''}`}
        onBack={() => { onBack(); setSubmitted(false); }}
        backLabel="返回错题本"
      />
    );
  }

  return (
    <div className="page quiz-page">
      <div className="quiz-top">
        <div className="quiz-top-row">
          <div className="progress-info">错题重考 · 第 {progress.current} / {progress.total} 题</div>
          <Timer key={examKey} seconds={timeLimit * 60} onTimeout={handleSubmit} running={!submitted} />
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
