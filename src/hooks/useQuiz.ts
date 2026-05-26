import { useState, useCallback, useMemo } from 'react';
import type { Question, QuizState, QuizRecord } from '../types';
import { buildRecord } from '../utils/quiz';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useQuiz(_questions: Question[]) {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: [],
    startTime: Date.now(),
    isFinished: false,
  });

  const startQuiz = useCallback((pool: Question[], count: number) => {
    const selected = shuffle(pool).slice(0, count);
    setState({
      questions: selected,
      currentIndex: 0,
      answers: selected.map(() => []),
      startTime: Date.now(),
      isFinished: false,
    });
  }, []);

  const current = state.questions[state.currentIndex] ?? null;
  const isFirst = state.currentIndex === 0;
  const isLast = state.currentIndex === state.questions.length - 1;

  const selectOption = useCallback(
    (optionIndex: number) => {
      if (state.isFinished || !current) return;
      setState((prev) => {
        const answers = [...prev.answers];
        const user = answers[prev.currentIndex];
        let next: number[];
        if (current.type === 'single' || current.type === 'judgment') {
          next = [optionIndex];
        } else {
          next = user.includes(optionIndex)
            ? user.filter((i) => i !== optionIndex)
            : [...user, optionIndex].sort();
        }
        answers[prev.currentIndex] = next;
        return { ...prev, answers };
      });
    },
    [state.isFinished, current],
  );

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex >= prev.questions.length - 1) return prev;
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const goPrev = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex <= 0) return prev;
      return { ...prev, currentIndex: prev.currentIndex - 1 };
    });
  }, []);

  const jumpTo = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.questions.length) return prev;
      return { ...prev, currentIndex: index };
    });
  }, []);

  const finish = useCallback(
    (mode: 'practice' | 'exam'): QuizRecord => {
      const record = buildRecord(state, mode);
      setState((prev) => ({ ...prev, isFinished: true }));
      return record;
    },
    [state],
  );

  const progress = useMemo(
    () => ({
      answered: state.answers.filter((a) => a.length > 0).length,
      total: state.questions.length,
      current: state.currentIndex + 1,
    }),
    [state.answers, state.questions.length, state.currentIndex],
  );

  return {
    state,
    current,
    isFirst,
    isLast,
    progress,
    startQuiz,
    selectOption,
    goNext,
    goPrev,
    jumpTo,
    finish,
  };
}
