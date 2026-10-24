/**
 * Quiz Store — In-memory state management for active session
 */
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Question } from '@nptel-quiz/question-schema';
import {
  createQuizSession, selectAnswer, clearAnswer, toggleMarkForReview,
  goToQuestion, nextQuestion, previousQuestion, submitQuiz,
  type QuizSession, type QuizConfig, type QuizResult
} from '@nptel-quiz/quiz-core';

interface QuizState {
  session: QuizSession | null;
  result: QuizResult | null;
  status: 'idle' | 'active' | 'submitted';
}

const initialState: QuizState = { session: null, result: null, status: 'idle' };

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
    case 'START_QUIZ': return { session: createQuizSession(action.questions, action.config, { jumble: true }), result: null, status: 'active' };
    case 'SELECT_ANSWER': return state.session && state.status === 'active' ? { ...state, session: selectAnswer(state.session, action.questionId, action.optionId) } : state;
    case 'CLEAR_ANSWER': return state.session && state.status === 'active' ? { ...state, session: clearAnswer(state.session, action.questionId) } : state;
    case 'TOGGLE_MARK': return state.session && state.status === 'active' ? { ...state, session: toggleMarkForReview(state.session, action.questionId) } : state;
    case 'GO_TO': return state.session ? { ...state, session: goToQuestion(state.session, action.index) } : state;
    case 'NEXT': return state.session ? { ...state, session: nextQuestion(state.session) } : state;
    case 'PREVIOUS': return state.session ? { ...state, session: previousQuestion(state.session) } : state;
    case 'SUBMIT': return state.session && state.status === 'active' ? { ...state, result: submitQuiz(state.session), status: 'submitted' } : state;
    case 'RESET': return initialState;
    default: return state;
  }
}

interface QuizContextValue {
  state: QuizState;
  startQuiz: (q: Question[], c: QuizConfig) => void;
  selectOption: (qId: string, optId: string) => void;
  clearOption: (qId: string) => void;
  toggleMark: (qId: string) => void;
  goTo: (i: number) => void;
  next: () => void;
  previous: () => void;
  submit: () => void;
  reset: () => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  
  const startQuiz = useCallback((questions: Question[], config: QuizConfig) => dispatch({ type: 'START_QUIZ', questions, config }), []);
  const selectOption = useCallback((questionId: string, optionId: string) => dispatch({ type: 'SELECT_ANSWER', questionId, optionId }), []);
  const clearOption = useCallback((questionId: string) => dispatch({ type: 'CLEAR_ANSWER', questionId }), []);
  const toggleMark = useCallback((questionId: string) => dispatch({ type: 'TOGGLE_MARK', questionId }), []);
  const goTo = useCallback((index: number) => dispatch({ type: 'GO_TO', index }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const previous = useCallback(() => dispatch({ type: 'PREVIOUS' }), []);
  const submit = useCallback(() => dispatch({ type: 'SUBMIT' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <QuizContext.Provider value={{ state, startQuiz, selectOption, clearOption, toggleMark, goTo, next, previous, submit, reset }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}
