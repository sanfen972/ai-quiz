import type { Question, QuizState, QuizRecord } from '../types';

export function getChapters(questions: Question[]): string[] {
  return [...new Set(questions.map((q) => q.chapter))].sort(
    (a, b) => questions.findIndex((q) => q.chapter === a) - questions.findIndex((q) => q.chapter === b),
  );
}

export function checkAnswer(question: Question, userAnswer: number[]): boolean {
  return userAnswer.length === question.answer.length && userAnswer.every((a) => question.answer.includes(a));
}

export function buildRecord(state: QuizState, mode: 'practice' | 'exam'): QuizRecord {
  const correct = state.questions.map((q, i) => {
    const userAns = state.answers[i] || [];
    return checkAnswer(q, userAns);
  });
  const score = correct.filter(Boolean).length;
  return {
    id: Date.now().toString(),
    date: new Date().toLocaleString('zh-CN'),
    mode,
    questionIds: state.questions.map((q) => q.id),
    answers: state.answers,
    correct,
    score,
    total: state.questions.length,
    duration: Math.floor((Date.now() - state.startTime) / 1000),
  };
}
