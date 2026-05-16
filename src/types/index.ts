export type QuestionType = 'single' | 'multiple' | 'judgment';

export interface Question {
  id: string;
  type: QuestionType;
  chapter: string;
  difficulty: 1 | 2 | 3;
  question: string;
  options: string[];
  answer: number[];
  explanation: string;
}

export interface QuizRecord {
  id: string;
  date: string;
  mode: 'practice' | 'exam';
  questionIds: string[];
  answers: number[][];
  correct: boolean[];
  score: number;
  total: number;
  duration: number;
}

export interface ExamConfig {
  questionCount: number;
  timeLimit: number;
  chapters: string[];
  types: QuestionType[];
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: number[][];
  startTime: number;
  isFinished: boolean;
}
