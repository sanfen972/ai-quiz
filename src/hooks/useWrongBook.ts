import { useMemo, useCallback } from 'react';
import { questions } from '../data/questions';
import type { QuizRecord, Question } from '../types';

export type WrongQuestion = Question & { wrongCount: number };

export function useWrongBook(
  records: QuizRecord[],
  mastered: string[],
  setMastered: (ids: string[]) => void,
) {
  const { wrongQuestions, allWrong } = useMemo(() => {
    const wrongMap = new Map<string, number>();
    records.forEach((r) => {
      r.correct.forEach((isCorrect, i) => {
        if (!isCorrect) {
          const qid = r.questionIds[i];
          wrongMap.set(qid, (wrongMap.get(qid) || 0) + 1);
        }
      });
    });

    const all: WrongQuestion[] = [...wrongMap.entries()]
      .map(([qid, count]) => {
        const q = questions.find((q) => q.id === qid);
        return q ? { ...q, wrongCount: count } : null;
      })
      .filter(Boolean) as WrongQuestion[];

    const unmastered = all.filter((q) => !mastered.includes(q.id));
    return { wrongQuestions: unmastered, allWrong: all };
  }, [records, mastered]);

  const toggleMastered = useCallback((qid: string) => {
    setMastered(
      mastered.includes(qid)
        ? mastered.filter((id) => id !== qid)
        : [...mastered, qid],
    );
  }, [mastered, setMastered]);

  const markCorrectAsMastered = useCallback((correctQuestionIds: string[]) => {
    const newIds = correctQuestionIds.filter((id) => !mastered.includes(id));
    if (newIds.length > 0) {
      setMastered([...mastered, ...newIds]);
    }
  }, [mastered, setMastered]);

  return { wrongQuestions, allWrong, toggleMastered, markCorrectAsMastered };
}
