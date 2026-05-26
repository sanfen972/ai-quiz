interface Props {
  title: string;
  description: string;
  questionCount: number;
  maxQuestions: number;
  onQuestionCountChange: (n: number) => void;
  chapters: string[];
  selectedChapters: string[];
  onToggleChapter: (ch: string) => void;
  timeLimit?: number;
  onTimeLimitChange?: (n: number) => void;
  onStart: () => void;
  startLabel: string;
}

export default function QuizSetup({
  title, description, questionCount, maxQuestions,
  onQuestionCountChange, chapters, selectedChapters,
  onToggleChapter, timeLimit, onTimeLimitChange,
  onStart, startLabel,
}: Props) {
  return (
    <div className="page setup-page">
      <h1>{title}</h1>
      <p className="desc">{description}</p>
      <div className="setup-form">
        <label>题目数量：{Math.min(questionCount, maxQuestions)} 题（可用 {maxQuestions} 题）</label>
        <input
          type="range"
          min={3}
          max={Math.max(3, maxQuestions)}
          value={Math.min(questionCount, maxQuestions)}
          onChange={(e) => onQuestionCountChange(+e.target.value)}
        />
        {timeLimit !== undefined && onTimeLimitChange && (
          <>
            <label>时间限制：{timeLimit} 分钟</label>
            <input
              type="range"
              min={3}
              max={60}
              step={1}
              value={timeLimit}
              onChange={(e) => onTimeLimitChange(+e.target.value)}
            />
          </>
        )}
        <label>选择章节：</label>
        <div className="checkbox-group">
          {chapters.map((ch, i) => (
            <label key={ch} className="checkbox">
              <input
                type="checkbox"
                checked={selectedChapters.includes(ch)}
                onChange={() => onToggleChapter(ch)}
              />
              {i + 1}. {ch}
            </label>
          ))}
        </div>
        <button className="btn primary" onClick={onStart} disabled={maxQuestions === 0}>
          {startLabel}
        </button>
      </div>
    </div>
  );
}
