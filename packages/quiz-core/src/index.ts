/**
 * Quiz Engine — Core State Management
 *
 * Handles quiz sessions, answer tracking, navigation, scoring, and results.
 * This module is platform-agnostic and used by both web and mobile apps.
 * All state is held in memory only — no persistence.
 */

import type {
  Question,
  ScoringRules,
  QuestionFilter,
} from '@nptel-quiz/question-schema';
import { DEFAULT_SCORING } from '@nptel-quiz/question-schema';

// ─── Quiz Configuration ────────────────────────────────────────────────

export interface QuizConfig {
  /** Display title for this quiz */
  title: string;
  /** Course ID */
  courseId: string;
  /** Course name */
  courseName: string;
  /** Enable fast mode (auto-advance on answer) */
  fastMode: boolean;
  /** Enable result-on-spot (show correctness immediately) */
  resultOnSpot: boolean;
  /** Time limit in seconds, or null for untimed */
  timeLimit: number | null;
  /** Scoring rules */
  scoring: ScoringRules;
  /** Filter used to select these questions */
  filter?: QuestionFilter;
}

// ─── Question State ────────────────────────────────────────────────────

export type QuestionStatus = 'unanswered' | 'answered' | 'marked';

export interface QuestionState {
  questionId: string;
  selectedOption: string | null;
  markedForReview: boolean;
  /** Timestamp when the answer was first selected */
  answeredAt: number | null;
}

// ─── Quiz Session ──────────────────────────────────────────────────────

export interface QuizSession {
  /** Unique session identifier */
  sessionId: string;
  /** Quiz configuration */
  config: QuizConfig;
  /** Ordered questions for this session */
  questions: Question[];
  /** Per-question state, indexed by question ID */
  questionStates: Map<string, QuestionState>;
  /** Index of the currently displayed question (0-based) */
  currentIndex: number;
  /** Timestamp (ms) when the quiz started */
  startedAt: number;
  /** Deadline timestamp if timed, else null */
  deadline: number | null;
  /** Whether the quiz has been submitted */
  submitted: boolean;
  /** Timestamp when submitted */
  submittedAt: number | null;
}

// ─── Result Types ──────────────────────────────────────────────────────

export interface QuestionResult {
  question: Question;
  selectedOption: string | null;
  correctOption: string | null;
  isCorrect: boolean | null;
  isAnswered: boolean;
  markedForReview: boolean;
  earnedMarks: number;
}

export interface QuizResult {
  sessionId: string;
  config: QuizConfig;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  maxScore: number;
  accuracy: number | null; // null when no questions attempted
  timeTaken: number; // milliseconds
  questionResults: QuestionResult[];
}

export interface SubmissionSummary {
  total: number;
  answered: number;
  unanswered: number;
  markedForReview: number;
}

// ─── Quiz Engine Functions ─────────────────────────────────────────────

let sessionCounter = 0;

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  sessionCounter++;
  return `quiz-${Date.now()}-${sessionCounter}`;
}

/**
 * Fisher-Yates array shuffle (returns a new shuffled array).
 */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Jumble / shuffle options within a question (returns a new Question object).
 */
export function jumbleQuestionOptions(question: Question): Question {
  if (!question.options || question.options.length < 2) {
    return { ...question };
  }
  return {
    ...question,
    options: shuffleArray(question.options),
  };
}

/**
 * Jumble / shuffle both question order and the options within each question.
 */
export function jumbleQuestions(questions: Question[]): Question[] {
  const shuffled = shuffleArray(questions);
  return shuffled.map(q => jumbleQuestionOptions(q));
}

/**
 * Create a new quiz session from questions and config.
 * Optionally jumbles / shuffles question and option order.
 */
export function createQuizSession(
  questions: Question[],
  config: QuizConfig,
  sessionOptions?: { jumble?: boolean }
): QuizSession {
  const preparedQuestions = sessionOptions?.jumble ? jumbleQuestions(questions) : questions;
  const now = Date.now();
  const questionStates = new Map<string, QuestionState>();

  for (const q of preparedQuestions) {
    questionStates.set(q.id, {
      questionId: q.id,
      selectedOption: null,
      markedForReview: false,
      answeredAt: null,
    });
  }

  return {
    sessionId: generateSessionId(),
    config,
    questions: preparedQuestions,
    questionStates,
    currentIndex: 0,
    startedAt: now,
    deadline: config.timeLimit ? now + config.timeLimit * 1000 : null,
    submitted: false,
    submittedAt: null,
  };
}

/**
 * Select an answer for the current or specified question.
 * Returns a new session state (immutable update for React).
 */
export function selectAnswer(
  session: QuizSession,
  questionId: string,
  optionId: string
): QuizSession {
  if (session.submitted) return session;

  const newStates = new Map(session.questionStates);
  const existing = newStates.get(questionId);
  if (!existing) return session;

  newStates.set(questionId, {
    ...existing,
    selectedOption: optionId,
    answeredAt: existing.answeredAt ?? Date.now(),
  });

  return { ...session, questionStates: newStates };
}

/**
 * Clear the answer for a question.
 */
export function clearAnswer(
  session: QuizSession,
  questionId: string
): QuizSession {
  if (session.submitted) return session;

  const newStates = new Map(session.questionStates);
  const existing = newStates.get(questionId);
  if (!existing) return session;

  newStates.set(questionId, {
    ...existing,
    selectedOption: null,
    answeredAt: null,
  });

  return { ...session, questionStates: newStates };
}

/**
 * Toggle mark-for-review on a question.
 */
export function toggleMarkForReview(
  session: QuizSession,
  questionId: string
): QuizSession {
  if (session.submitted) return session;

  const newStates = new Map(session.questionStates);
  const existing = newStates.get(questionId);
  if (!existing) return session;

  newStates.set(questionId, {
    ...existing,
    markedForReview: !existing.markedForReview,
  });

  return { ...session, questionStates: newStates };
}

/**
 * Navigate to a specific question index.
 */
export function goToQuestion(
  session: QuizSession,
  index: number
): QuizSession {
  if (index < 0 || index >= session.questions.length) return session;
  return { ...session, currentIndex: index };
}

/**
 * Go to the next question.
 */
export function nextQuestion(session: QuizSession): QuizSession {
  return goToQuestion(session, session.currentIndex + 1);
}

/**
 * Go to the previous question.
 */
export function previousQuestion(session: QuizSession): QuizSession {
  return goToQuestion(session, session.currentIndex - 1);
}

/**
 * Get a submission summary before confirming submission.
 */
export function getSubmissionSummary(session: QuizSession): SubmissionSummary {
  let answered = 0;
  let unanswered = 0;
  let markedForReview = 0;

  for (const state of session.questionStates.values()) {
    if (state.selectedOption !== null) {
      answered++;
    } else {
      unanswered++;
    }
    if (state.markedForReview) {
      markedForReview++;
    }
  }

  return {
    total: session.questions.length,
    answered,
    unanswered,
    markedForReview,
  };
}

/**
 * Submit the quiz and calculate results.
 */
export function submitQuiz(session: QuizSession): QuizResult {
  const now = Date.now();
  const scoring = session.config.scoring;
  const questionResults: QuestionResult[] = [];

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let score = 0;
  let maxScore = 0;

  for (const question of session.questions) {
    const state = session.questionStates.get(question.id);
    const selectedOption = state?.selectedOption ?? null;
    const isAnswered = selectedOption !== null;
    const isVerifiable = question.correctOption !== null;
    const isCorrect = isVerifiable && isAnswered ? selectedOption === question.correctOption : null;
    const marks = question.marks ?? scoring.correctMarks;
    const negMarks = question.negativeMarks ?? scoring.incorrectMarks;

    let earnedMarks = 0;
    
    if (isVerifiable) {
      maxScore += marks;
      if (!isAnswered) {
        unanswered++;
        earnedMarks = scoring.unansweredMarks;
      } else if (isCorrect) {
        correct++;
        earnedMarks = marks;
      } else {
        incorrect++;
        earnedMarks = -negMarks; // negative marks are specified as positive values
      }
      score += earnedMarks;
    } else {
      // Unverified question
      if (!isAnswered) {
        unanswered++;
      }
    }

    questionResults.push({
      question,
      selectedOption,
      correctOption: question.correctOption,
      isCorrect,
      isAnswered,
      markedForReview: state?.markedForReview ?? false,
      earnedMarks,
    });
  }

  const attempted = correct + incorrect;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : null;
  const timeTaken = now - session.startedAt;

  return {
    sessionId: session.sessionId,
    config: session.config,
    totalQuestions: session.questions.length,
    attempted,
    correct,
    incorrect,
    unanswered,
    score,
    maxScore,
    accuracy,
    timeTaken,
    questionResults,
  };
}

/**
 * Check whether the quiz timer has expired.
 */
export function isTimeExpired(session: QuizSession): boolean {
  if (!session.deadline) return false;
  return Date.now() >= session.deadline;
}

/**
 * Get remaining time in milliseconds. Returns null for untimed quizzes.
 */
export function getRemainingTime(session: QuizSession): number | null {
  if (!session.deadline) return null;
  return Math.max(0, session.deadline - Date.now());
}

/**
 * Get the current question from the session.
 */
export function getCurrentQuestion(session: QuizSession): Question | null {
  return session.questions[session.currentIndex] ?? null;
}

/**
 * Get the state for the current question.
 */
export function getCurrentQuestionState(session: QuizSession): QuestionState | null {
  const q = getCurrentQuestion(session);
  if (!q) return null;
  return session.questionStates.get(q.id) ?? null;
}

/**
 * Get status of a question (for progress indicators).
 */
export function getQuestionStatus(
  session: QuizSession,
  questionId: string
): QuestionStatus {
  const state = session.questionStates.get(questionId);
  if (!state) return 'unanswered';
  if (state.markedForReview) return 'marked';
  if (state.selectedOption !== null) return 'answered';
  return 'unanswered';
}

/**
 * Filter questions based on criteria.
 */
export function filterQuestions(
  questions: Question[],
  filter: QuestionFilter
): Question[] {
  return questions.filter(q => {
    if (filter.courseId && q.courseId !== filter.courseId) return false;
    if (filter.week !== undefined && q.week !== filter.week) return false;
    if (filter.topic && q.topic !== filter.topic) return false;
    if (filter.sourceType && q.sourceType !== filter.sourceType) return false;
    if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
    if (filter.tags && filter.tags.length > 0) {
      if (!q.tags || !filter.tags.some(t => q.tags!.includes(t))) return false;
    }
    return true;
  });
}

/**
 * Extract incorrect questions from a quiz result for retry.
 */
export function getIncorrectQuestions(result: QuizResult): Question[] {
  return result.questionResults
    .filter(r => r.isAnswered && !r.isCorrect)
    .map(r => r.question);
}

/**
 * Format milliseconds to a human-readable time string.
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
