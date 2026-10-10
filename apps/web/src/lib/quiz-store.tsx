/**
 * Quiz Store — In-memory state management for the active quiz session
 *
 * Uses React context for state sharing. No persistence.
 * All state is lost on page reload (by design).
 */

import { createContext, useContext, useReducer, type ReactNode, useCallback } from 'react';
import type { Question } from '@nptel-quiz/question-schema';
import {
  createQuizSession,
  selectAnswer,
  clearAnswer,
  toggleMarkForReview,
  goToQuestion,
  nextQuestion,
  previousQuestion,
  submitQuiz,
  type QuizSession,
  type QuizConfig,
  type QuizResult,
} from '@nptel-quiz/quiz-core';

// ─── State ─────────────────────────────────────────────────────

interface QuizState {
  session: QuizSession | null;
  result: QuizResult | null;
  status: 'idle' | 'active' | 'submitted';
}

const initialState: QuizState = {
  session: null,
  result: null,
  status: 'idle',
};

// ─── Actions ───────────────────────────────────────────────────

type QuizAction =
  | { type: 'START_QUIZ'; questions: Question[]; config: QuizConfig }
  | { type: 'SELECT_ANSWER'; questionId: string; optionId: string }
  | { type: 'CLEAR_ANSWER'; questionId: string }
  | { type: 'TOGGLE_MARK'; questionId: string }
  | { type: 'GO_TO'; index: number }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SUBMIT' }
  | { type: 'RESET' };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START_QUIZ': {
      const session = createQuizSession(action.questions, action.config);
      return { session, result: null, status: 'active' };
    }
    case 'SELECT_ANSWER': {
      if (!state.session || state.status !== 'active') return state;
      return {
        ...state,
        session: selectAnswer(state.session, action.questionId, action.optionId),
      };
    }
    case 'CLEAR_ANSWER': {
      if (!state.session || state.status !== 'active') return state;
      return {
        ...state,
        session: clearAnswer(state.session, action.questionId),
      };
    }
    case 'TOGGLE_MARK': {
      if (!state.session || state.status !== 'active') return state;
      return {
        ...state,
        session: toggleMarkForReview(state.session, action.questionId),
      };
    }
    case 'GO_TO': {
      if (!state.session) return state;
      return { ...state, session: goToQuestion(state.session, action.index) };
    }
    case 'NEXT': {
      if (!state.session) return state;
      return { ...state, session: nextQuestion(state.session) };
    }
    case 'PREVIOUS': {
      if (!state.session) return state;
      return { ...state, session: previousQuestion(state.session) };
    }
    case 'SUBMIT': {
      if (!state.session || state.status !== 'active') return state;
      const result = submitQuiz(state.session);
      return { ...state, result, status: 'submitted' };
    }
    case 'RESET': {
      return initialState;
    }
    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────

interface QuizContextValue {
  state: QuizState;
  startQuiz: (questions: Question[], config: QuizConfig) => void;
  selectOption: (questionId: string, optionId: string) => void;
  clearOption: (questionId: string) => void;
  toggleMark: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  submit: () => void;
  reset: () => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const startQuiz = useCallback((questions: Question[], config: QuizConfig) => {
    dispatch({ type: 'START_QUIZ', questions, config });
  }, []);

  const selectOption = useCallback((questionId: string, optionId: string) => {
    dispatch({ type: 'SELECT_ANSWER', questionId, optionId });
  }, []);

  const clearOption = useCallback((questionId: string) => {
    dispatch({ type: 'CLEAR_ANSWER', questionId });
  }, []);

  const toggleMark = useCallback((questionId: string) => {
    dispatch({ type: 'TOGGLE_MARK', questionId });
  }, []);

  const goTo = useCallback((index: number) => {
    dispatch({ type: 'GO_TO', index });
  }, []);

  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const previous = useCallback(() => dispatch({ type: 'PREVIOUS' }), []);
  const submit = useCallback(() => dispatch({ type: 'SUBMIT' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <QuizContext.Provider value={{
      state, startQuiz, selectOption, clearOption, toggleMark, goTo, next, previous, submit, reset,
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return ctx;
}
