/**
 * Quiz Core Engine Tests
 *
 * Tests for session management, answer tracking, navigation,
 * scoring, and result calculations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createQuizSession,
  selectAnswer,
  clearAnswer,
  toggleMarkForReview,
  goToQuestion,
  nextQuestion,
  previousQuestion,
  getSubmissionSummary,
  submitQuiz,
  isTimeExpired,
  getRemainingTime,
  getCurrentQuestion,
  getCurrentQuestionState,
  getQuestionStatus,
  filterQuestions,
  getIncorrectQuestions,
  formatTime,
  shuffleArray,
  jumbleQuestionOptions,
  jumbleQuestions,
  type QuizConfig,
} from '../index.js';
import type { Question, ScoringRules } from '@nptel-quiz/question-schema';
import { DEFAULT_SCORING } from '@nptel-quiz/question-schema';

// ─── Test Data ─────────────────────────────────────────────────────────

function makeQuestion(id: string, correctOption: string = 'b'): Question {
  return {
    id,
    courseId: 'test',
    courseName: 'Test Course',
    questionText: `Question ${id}`,
    options: [
      { id: 'a', text: 'Option A' },
      { id: 'b', text: 'Option B' },
      { id: 'c', text: 'Option C' },
      { id: 'd', text: 'Option D' },
    ],
    correctOption,
    explanation: `Explanation for ${id}`,
  };
}

function makeConfig(overrides: Partial<QuizConfig> = {}): QuizConfig {
  return {
    title: 'Test Quiz',
    courseId: 'test',
    courseName: 'Test Course',
    fastMode: false,
    resultOnSpot: false,
    timeLimit: null,
    scoring: DEFAULT_SCORING,
    ...overrides,
  };
}

const questions = [
  makeQuestion('Q1', 'a'),
  makeQuestion('Q2', 'b'),
  makeQuestion('Q3', 'c'),
  makeQuestion('Q4', 'd'),
  makeQuestion('Q5', 'a'),
];

// ─── Tests ─────────────────────────────────────────────────────────────

describe('createQuizSession', () => {
  it('should create a session with correct initial state', () => {
    const session = createQuizSession(questions, makeConfig());
    expect(session.questions).toHaveLength(5);
    expect(session.currentIndex).toBe(0);
    expect(session.submitted).toBe(false);
    expect(session.deadline).toBeNull();
    expect(session.questionStates.size).toBe(5);
  });

  it('should set deadline for timed quizzes', () => {
    const session = createQuizSession(questions, makeConfig({ timeLimit: 600 }));
    expect(session.deadline).not.toBeNull();
    expect(session.deadline! - session.startedAt).toBe(600000);
  });

  it('should initialize all questions as unanswered', () => {
    const session = createQuizSession(questions, makeConfig());
    for (const state of session.questionStates.values()) {
      expect(state.selectedOption).toBeNull();
      expect(state.markedForReview).toBe(false);
    }
  });
});

describe('selectAnswer', () => {
  let session: ReturnType<typeof createQuizSession>;

  beforeEach(() => {
    session = createQuizSession(questions, makeConfig());
  });

  it('should set selected option', () => {
    const updated = selectAnswer(session, 'Q1', 'a');
    expect(updated.questionStates.get('Q1')!.selectedOption).toBe('a');
  });

  it('should allow changing answer', () => {
    let updated = selectAnswer(session, 'Q1', 'a');
    updated = selectAnswer(updated, 'Q1', 'c');
    expect(updated.questionStates.get('Q1')!.selectedOption).toBe('c');
  });

  it('should not modify other questions', () => {
    const updated = selectAnswer(session, 'Q1', 'a');
    expect(updated.questionStates.get('Q2')!.selectedOption).toBeNull();
  });

  it('should not modify submitted session', () => {
    const submitted = { ...session, submitted: true };
    const updated = selectAnswer(submitted, 'Q1', 'a');
    expect(updated.questionStates.get('Q1')!.selectedOption).toBeNull();
  });

  it('should ignore unknown question ID', () => {
    const updated = selectAnswer(session, 'UNKNOWN', 'a');
    expect(updated).toBe(session);
  });

  it('should set answeredAt timestamp', () => {
    const updated = selectAnswer(session, 'Q1', 'a');
    expect(updated.questionStates.get('Q1')!.answeredAt).not.toBeNull();
  });
});

describe('clearAnswer', () => {
  it('should clear the selected option', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a');
    session = clearAnswer(session, 'Q1');
    expect(session.questionStates.get('Q1')!.selectedOption).toBeNull();
    expect(session.questionStates.get('Q1')!.answeredAt).toBeNull();
  });
});

describe('toggleMarkForReview', () => {
  it('should toggle mark for review', () => {
    let session = createQuizSession(questions, makeConfig());
    session = toggleMarkForReview(session, 'Q1');
    expect(session.questionStates.get('Q1')!.markedForReview).toBe(true);
    session = toggleMarkForReview(session, 'Q1');
    expect(session.questionStates.get('Q1')!.markedForReview).toBe(false);
  });
});

describe('Navigation', () => {
  let session: ReturnType<typeof createQuizSession>;

  beforeEach(() => {
    session = createQuizSession(questions, makeConfig());
  });

  it('should navigate to specific question', () => {
    const updated = goToQuestion(session, 3);
    expect(updated.currentIndex).toBe(3);
  });

  it('should not navigate to negative index', () => {
    const updated = goToQuestion(session, -1);
    expect(updated.currentIndex).toBe(0);
  });

  it('should not navigate beyond last question', () => {
    const updated = goToQuestion(session, 10);
    expect(updated.currentIndex).toBe(0);
  });

  it('should go to next question', () => {
    const updated = nextQuestion(session);
    expect(updated.currentIndex).toBe(1);
  });

  it('should go to previous question', () => {
    let updated = goToQuestion(session, 3);
    updated = previousQuestion(updated);
    expect(updated.currentIndex).toBe(2);
  });

  it('should not go before first question', () => {
    const updated = previousQuestion(session);
    expect(updated.currentIndex).toBe(0);
  });

  it('should not go past last question', () => {
    let updated = goToQuestion(session, 4);
    updated = nextQuestion(updated);
    expect(updated.currentIndex).toBe(4);
  });
});

describe('getCurrentQuestion', () => {
  it('should return the current question', () => {
    const session = createQuizSession(questions, makeConfig());
    const q = getCurrentQuestion(session);
    expect(q?.id).toBe('Q1');
  });

  it('should return the correct question after navigation', () => {
    let session = createQuizSession(questions, makeConfig());
    session = goToQuestion(session, 2);
    expect(getCurrentQuestion(session)?.id).toBe('Q3');
  });
});

describe('getCurrentQuestionState', () => {
  it('should return state for current question', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'c');
    const state = getCurrentQuestionState(session);
    expect(state?.selectedOption).toBe('c');
  });
});

describe('getQuestionStatus', () => {
  it('should return unanswered by default', () => {
    const session = createQuizSession(questions, makeConfig());
    expect(getQuestionStatus(session, 'Q1')).toBe('unanswered');
  });

  it('should return answered when option selected', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a');
    expect(getQuestionStatus(session, 'Q1')).toBe('answered');
  });

  it('should return marked when marked for review', () => {
    let session = createQuizSession(questions, makeConfig());
    session = toggleMarkForReview(session, 'Q1');
    expect(getQuestionStatus(session, 'Q1')).toBe('marked');
  });

  it('should prioritize marked over answered', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a');
    session = toggleMarkForReview(session, 'Q1');
    expect(getQuestionStatus(session, 'Q1')).toBe('marked');
  });
});

describe('getSubmissionSummary', () => {
  it('should count answered and unanswered correctly', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a');
    session = selectAnswer(session, 'Q2', 'b');
    session = toggleMarkForReview(session, 'Q3');

    const summary = getSubmissionSummary(session);
    expect(summary.total).toBe(5);
    expect(summary.answered).toBe(2);
    expect(summary.unanswered).toBe(3);
    expect(summary.markedForReview).toBe(1);
  });
});

describe('submitQuiz', () => {
  it('should calculate correct results for all correct answers', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a'); // correct
    session = selectAnswer(session, 'Q2', 'b'); // correct
    session = selectAnswer(session, 'Q3', 'c'); // correct
    session = selectAnswer(session, 'Q4', 'd'); // correct
    session = selectAnswer(session, 'Q5', 'a'); // correct

    const result = submitQuiz(session);
    expect(result.correct).toBe(5);
    expect(result.incorrect).toBe(0);
    expect(result.unanswered).toBe(0);
    expect(result.score).toBe(5);
    expect(result.maxScore).toBe(5);
    expect(result.accuracy).toBe(100);
    expect(result.attempted).toBe(5);
  });

  it('should ignore unverified questions from score and accuracy calculations', () => {
    const unverifiedQ: Question = { ...questions[0], id: 'Q_UNV', correctOption: null };
    let session = createQuizSession([...questions, unverifiedQ], makeConfig());
    
    // Answer an unverified question
    session = selectAnswer(session, 'Q_UNV', 'a');
    
    const result = submitQuiz(session);
    
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(0);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(5); // 5 verifiable questions
    expect(result.attempted).toBe(0);
    expect(result.accuracy).toBe(null);
  });

  it('should calculate correct results for mixed answers', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a'); // correct
    session = selectAnswer(session, 'Q2', 'c'); // incorrect
    // Q3, Q4, Q5 unanswered

    const result = submitQuiz(session);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(1);
    expect(result.unanswered).toBe(3);
    expect(result.score).toBe(1);
    expect(result.attempted).toBe(2);
    expect(result.accuracy).toBe(50);
  });

  it('should handle no attempted questions (accuracy = null)', () => {
    const session = createQuizSession(questions, makeConfig());
    const result = submitQuiz(session);
    expect(result.attempted).toBe(0);
    expect(result.unanswered).toBe(5);
    expect(result.accuracy).toBeNull();
    expect(result.score).toBe(0);
  });

  it('should handle all incorrect answers', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'd'); // incorrect (correct: a)
    session = selectAnswer(session, 'Q2', 'a'); // incorrect (correct: b)

    const result = submitQuiz(session);
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(2);
    expect(result.accuracy).toBe(0);
    expect(result.score).toBe(0); // no negative marks by default
  });

  it('should respect custom scoring rules', () => {
    const scoring: ScoringRules = { correctMarks: 2, incorrectMarks: 0.5, unansweredMarks: 0 };
    let session = createQuizSession(
      [makeQuestion('Q1', 'a'), makeQuestion('Q2', 'b')],
      makeConfig({ scoring })
    );
    session = selectAnswer(session, 'Q1', 'a'); // correct: +2
    session = selectAnswer(session, 'Q2', 'c'); // incorrect: -0.5

    const result = submitQuiz(session);
    expect(result.score).toBe(1.5);
    expect(result.maxScore).toBe(4); // 2 × 2
  });

  it('should include question results in correct order', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a');

    const result = submitQuiz(session);
    expect(result.questionResults).toHaveLength(5);
    expect(result.questionResults[0].question.id).toBe('Q1');
    expect(result.questionResults[0].isCorrect).toBe(true);
    expect(result.questionResults[1].isAnswered).toBe(false);
  });

  it('should track marked-for-review in results', () => {
    let session = createQuizSession(questions, makeConfig());
    session = toggleMarkForReview(session, 'Q3');

    const result = submitQuiz(session);
    expect(result.questionResults[2].markedForReview).toBe(true);
    expect(result.questionResults[0].markedForReview).toBe(false);
  });

  it('should calculate timeTaken', () => {
    const session = createQuizSession(questions, makeConfig());
    const result = submitQuiz(session);
    expect(result.timeTaken).toBeGreaterThanOrEqual(0);
  });
});

describe('Timer functions', () => {
  it('isTimeExpired should return false for untimed quiz', () => {
    const session = createQuizSession(questions, makeConfig());
    expect(isTimeExpired(session)).toBe(false);
  });

  it('getRemainingTime should return null for untimed quiz', () => {
    const session = createQuizSession(questions, makeConfig());
    expect(getRemainingTime(session)).toBeNull();
  });

  it('isTimeExpired should detect expired deadline', () => {
    const session = createQuizSession(questions, makeConfig({ timeLimit: 1 }));
    // Manually set deadline to the past
    const expired = { ...session, deadline: Date.now() - 1000 };
    expect(isTimeExpired(expired)).toBe(true);
  });

  it('getRemainingTime should return positive for active quiz', () => {
    const session = createQuizSession(questions, makeConfig({ timeLimit: 600 }));
    const remaining = getRemainingTime(session);
    expect(remaining).not.toBeNull();
    expect(remaining!).toBeGreaterThan(0);
  });
});

describe('filterQuestions', () => {
  const mixed: Question[] = [
    { ...makeQuestion('Q1'), courseId: 'a', week: 1, sourceType: 'pyq', difficulty: 'easy' },
    { ...makeQuestion('Q2'), courseId: 'a', week: 2, sourceType: 'weekly_quiz', difficulty: 'medium' },
    { ...makeQuestion('Q3'), courseId: 'b', week: 1, sourceType: 'pyq', difficulty: 'hard' },
  ];

  it('should filter by courseId', () => {
    const result = filterQuestions(mixed, { courseId: 'a' });
    expect(result).toHaveLength(2);
  });

  it('should filter by week', () => {
    const result = filterQuestions(mixed, { week: 1 });
    expect(result).toHaveLength(2);
  });

  it('should filter by multiple weeks (weeks array)', () => {
    const resultAll = filterQuestions(mixed, { weeks: [1, 2] });
    expect(resultAll).toHaveLength(3);

    const resultOne = filterQuestions(mixed, { weeks: [2] });
    expect(resultOne).toHaveLength(1);
    expect(resultOne[0].id).toBe('Q2');

    const resultNone = filterQuestions(mixed, { weeks: [3, 4] });
    expect(resultNone).toHaveLength(0);
  });

  it('should filter by sourceType', () => {
    const result = filterQuestions(mixed, { sourceType: 'pyq' });
    expect(result).toHaveLength(2);
  });

  it('should filter by difficulty', () => {
    const result = filterQuestions(mixed, { difficulty: 'hard' });
    expect(result).toHaveLength(1);
  });

  it('should combine filters', () => {
    const result = filterQuestions(mixed, { courseId: 'a', sourceType: 'pyq' });
    expect(result).toHaveLength(1);
  });

  it('should return all when no filters', () => {
    const result = filterQuestions(mixed, {});
    expect(result).toHaveLength(3);
  });
});

describe('getIncorrectQuestions', () => {
  it('should return only incorrectly answered questions', () => {
    let session = createQuizSession(questions, makeConfig());
    session = selectAnswer(session, 'Q1', 'a'); // correct
    session = selectAnswer(session, 'Q2', 'c'); // incorrect
    session = selectAnswer(session, 'Q3', 'a'); // incorrect
    // Q4, Q5 unanswered

    const result = submitQuiz(session);
    const incorrect = getIncorrectQuestions(result);
    expect(incorrect).toHaveLength(2);
    expect(incorrect.map(q => q.id)).toEqual(['Q2', 'Q3']);
  });

  it('should return empty array when all correct', () => {
    let session = createQuizSession(
      [makeQuestion('Q1', 'a')],
      makeConfig()
    );
    session = selectAnswer(session, 'Q1', 'a');

    const result = submitQuiz(session);
    const incorrect = getIncorrectQuestions(result);
    expect(incorrect).toHaveLength(0);
  });

  it('should not include unanswered questions', () => {
    const session = createQuizSession(questions, makeConfig());
    const result = submitQuiz(session);
    const incorrect = getIncorrectQuestions(result);
    expect(incorrect).toHaveLength(0);
  });
});

describe('formatTime', () => {
  it('should format seconds', () => {
    expect(formatTime(5000)).toBe('5s');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(125000)).toBe('2m 05s');
  });

  it('should format hours', () => {
    expect(formatTime(3661000)).toBe('1h 01m 01s');
  });

  it('should handle zero', () => {
    expect(formatTime(0)).toBe('0s');
  });
});

describe('Jumble / Shuffle Functions', () => {
  it('shuffleArray should preserve all elements and length', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(arr);
    expect(shuffled).toHaveLength(10);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(arr);
  });

  it('shuffleArray should not mutate original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  it('jumbleQuestionOptions should shuffle options while preserving question data', () => {
    const q = makeQuestion('Q1', 'c');
    const jumbled = jumbleQuestionOptions(q);
    expect(jumbled.id).toBe('Q1');
    expect(jumbled.correctOption).toBe('c');
    expect(jumbled.options).toHaveLength(4);
    const optionTexts = jumbled.options.map(o => o.text).sort();
    expect(optionTexts).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
  });

  it('jumbleQuestionOptions should handle questions with fewer than 2 options', () => {
    const q = { ...makeQuestion('Q1'), options: [{ id: 'a', text: 'Only' }] };
    const jumbled = jumbleQuestionOptions(q);
    expect(jumbled.options).toHaveLength(1);
  });

  it('jumbleQuestions should shuffle both questions and options', () => {
    const qs = [
      makeQuestion('Q1'),
      makeQuestion('Q2'),
      makeQuestion('Q3'),
      makeQuestion('Q4'),
      makeQuestion('Q5'),
    ];
    const jumbled = jumbleQuestions(qs);
    expect(jumbled).toHaveLength(5);
    const ids = jumbled.map(q => q.id).sort();
    expect(ids).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5']);
    // Each question's options should be intact
    for (const q of jumbled) {
      expect(q.options).toHaveLength(4);
    }
  });

  it('createQuizSession with jumble: true should initialize question states for jumbled questions', () => {
    const qs = [makeQuestion('Q1'), makeQuestion('Q2'), makeQuestion('Q3')];
    const session = createQuizSession(qs, makeConfig(), { jumble: true });
    expect(session.questions).toHaveLength(3);
    for (const q of session.questions) {
      expect(session.questionStates.has(q.id)).toBe(true);
    }
  });
});

