import QuestionCard from './QuestionCard';
import type { Question } from '../types';

interface Props {
  title: string;
  score: number;
  total: number;
  questions: Question[];
  answers: number[][];
  detailLine?: string;
  onBack: () => void;
  backLabel?: string;
  grade?: string;
}

export default function QuizResult({
  title, score, total, questions, answers,
  detailLine, onBack, backLabel = '返回', grade,
}: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="page quiz-page">
      <h1>{title}</h1>
      <div className="score-summary">
        <div className="big-score">{score} / {total}</div>
        <div className="score-pct">{pct} 分{grade ? ` — ${grade}` : ''}</div>
        {detailLine && <div className="score-detail">{detailLine}</div>}
      </div>
      <div className="result-cards">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            selected={answers[i] || []}
            onSelect={() => {}}
            showResult
          />
        ))}
      </div>
      <button className="btn primary" onClick={onBack} style={{ marginTop: 16 }}>
        {backLabel}
      </button>
    </div>
  );
}
