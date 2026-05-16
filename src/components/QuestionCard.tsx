import type { Question } from '../types';

interface Props {
  question: Question;
  selected: number[];
  onSelect: (index: number) => void;
  showResult?: boolean;
}

const typeLabel: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  judgment: '判断题',
};

export default function QuestionCard({ question, selected, onSelect, showResult }: Props) {
  const isCorrect =
    showResult &&
    selected.length === question.answer.length &&
    selected.every((a) => question.answer.includes(a));


  return (
    <div className={`question-card ${showResult ? (isCorrect ? 'correct' : 'wrong') : ''}`}>
      <div className="question-header">
        <span className={`type-badge ${question.type}`}>{typeLabel[question.type]}</span>
        <span className="chapter-badge">{question.chapter}</span>
        <span className="difficulty">{'★'.repeat(question.difficulty)}</span>
      </div>

      <div className="question-body">{question.question}</div>

      <div className="options">
        {question.options.map((opt, i) => {
          const isSelected = selected.includes(i);
          const isCorrectAns = question.answer.includes(i);
          let cls = 'option';
          if (showResult) {
            if (isCorrectAns) cls += ' correct';
            else if (isSelected && !isCorrectAns) cls += ' wrong';
          } else if (isSelected) {
            cls += ' selected';
          }
          return (
            <button key={i} className={cls} onClick={() => !showResult && onSelect(i)} disabled={showResult}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{opt}</span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="explanation">
          <strong>{isCorrect ? '✓ 回答正确' : '✗ 回答错误'}</strong>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
