/**
 * Question Schema Types
 *
 * Core type definitions for the NPTEL Quiz question bank.
 * Used by both web and mobile applications.
 */

/** Difficulty levels for questions */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Source type indicating origin of question */
export type SourceType = 'pyq' | 'weekly_quiz' | 'practice';

/** A single answer option */
export interface QuestionOption {
  /** Unique identifier for this option within its question, e.g. "a", "b", "c", "d" */
  id: string;
  /** Display text for the option */
  text: string;
}

/** A single quiz question */
export interface Question {
  /** Globally unique question identifier, e.g. "PSY-W01-Q001" */
  id: string;
  /** Course identifier this question belongs to */
  courseId: string;
  /** Human-readable course name */
  courseName: string;
  /** Week number (1-based) for weekly quizzes */
  week?: number;
  /** Topic or subject area */
  topic?: string;
  /** The question text (supports markdown) */
  questionText: string;
  /** Available answer options (typically 4) */
  options: QuestionOption[];
  /** ID of the correct option (must match one of options[].id) */
  correctOption: string;
  /** Explanation shown after answering */
  explanation: string;
  /** Difficulty level */
  difficulty?: Difficulty;
  /** Tags for categorization */
  tags?: string[];
  /** Source type */
  sourceType?: SourceType;
  /** Reference info (e.g. "NPTEL Jan 2024 Exam") */
  sourceReference?: string;
  /** Marks awarded for correct answer (default: 1) */
  marks?: number;
  /** Marks deducted for incorrect answer (default: 0) */
  negativeMarks?: number;
}

/** Metadata for a week's quiz within a course */
export interface WeekMeta {
  week: number;
  title?: string;
  questionCount: number;
}

/** Metadata for a course in the manifest */
export interface CourseMeta {
  id: string;
  name: string;
  description?: string;
  instructor?: string;
  totalQuestions: number;
  pyqCount: number;
  weeklyQuizCount: number;
  weeks: WeekMeta[];
  tags?: string[];
  /** Relative path to the course question file */
  questionFile: string;
}

/** The top-level manifest describing all available courses */
export interface QuestionBankManifest {
  version: string;
  lastUpdated: string;
  totalQuestions: number;
  courses: CourseMeta[];
}

/** Filter criteria for selecting questions */
export interface QuestionFilter {
  courseId?: string;
  week?: number;
  topic?: string;
  sourceType?: SourceType;
  difficulty?: Difficulty;
  tags?: string[];
}

/** Scoring rules for a quiz session */
export interface ScoringRules {
  correctMarks: number;
  incorrectMarks: number;
  unansweredMarks: number;
}

/** Default scoring: +1 correct, 0 incorrect, 0 unanswered */
export const DEFAULT_SCORING: ScoringRules = {
  correctMarks: 1,
  incorrectMarks: 0,
  unansweredMarks: 0,
};
