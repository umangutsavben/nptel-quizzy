/**
 * QuizPage — Active Quiz Interface
 *
 * Full quiz experience with question display, answer selection,
 * navigation, progress tracking, mark for review, and submission.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../lib/quiz-store';
import {
  getCurrentQuestion,
  getCurrentQuestionState,
  getSubmissionSummary,
  getQuestionStatus,
  getRemainingTime,
  isTimeExpired,
  formatTime,
} from '@nptel-quiz/quiz-core';

export default function QuizPage() {
  const navigate = useNavigate();
  const { state, selectOption, clearOption, toggleMark, goTo, next, previous, submit } = useQuiz();
  const { session } = state;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const fastModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect if no active session
  useEffect(() => {
    if (!session && state.status === 'idle') {
      navigate('/', { replace: true });
    }
    if (state.status === 'submitted') {
      navigate('/result', { replace: true });
    }
  }, [session, state.status, navigate]);

  // Timer tick for timed quizzes
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!session?.deadline) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
      if (session && isTimeExpired(session)) {
        submit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.deadline, submit, session]);

  // Clean up fast mode timer
  useEffect(() => {
    return () => {
      if (fastModeTimerRef.current) {
        clearTimeout(fastModeTimerRef.current);
      }
    };
  }, []);

  const handleSelectOption = useCallback((questionId: string, optionId: string) => {
    if (!session) return;
    const currentState = session.questionStates.get(questionId);

    // Don't re-process if same option in result-on-spot mode after showing result
    if (session.config.resultOnSpot && currentState?.selectedOption === optionId) return;

    selectOption(questionId, optionId);

    // Fast mode: auto-advance after a short delay
    if (session.config.fastMode) {
      if (fastModeTimerRef.current) {
        clearTimeout(fastModeTimerRef.current);
      }

      const delay = session.config.resultOnSpot ? 1200 : 300;
      fastModeTimerRef.current = setTimeout(() => {
        if (session.currentIndex < session.questions.length - 1) {
          next();
        }
        fastModeTimerRef.current = null;
      }, delay);
    }
  }, [session, selectOption, next]);

  const handleSubmit = useCallback(() => {
    submit();
  }, [submit]);

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-surface-400">Loading quiz...</p>
      </div>
    );
  }

  const question = getCurrentQuestion(session);
  const qState = getCurrentQuestionState(session);
  const summary = getSubmissionSummary(session);
  const remaining = getRemainingTime(session);

  if (!question || !qState) return null;

  // Determine if we should reveal the answer (result on spot + answer selected)
  const revealAnswer = session.config.resultOnSpot && qState.selectedOption !== null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 page-enter">
      {/* Quiz Header */}
      <div className="glass-card px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-surface-300 truncate">
            {session.config.courseName}
          </h1>
          <p className="text-xs text-surface-500">{session.config.title}</p>
        </div>
        <div className="flex items-center gap-3">
          {remaining !== null && (
            <div className={`text-sm font-mono font-semibold px-3 py-1 rounded-lg ${
              remaining < 60000 ? 'bg-danger-700/20 text-danger-400' :
              remaining < 300000 ? 'bg-accent-600/20 text-accent-400' :
              'bg-surface-800 text-surface-300'
            }`}>
              ⏱ {formatTime(remaining)}
            </div>
          )}
          {session.config.fastMode && <span className="badge-accent text-xs">⚡ Fast</span>}
          {session.config.resultOnSpot && <span className="badge-brand text-xs">👁 Spot</span>}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Question Area */}
        <div className="flex-1 min-w-0">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-surface-400">
                Question <span className="text-surface-100 font-semibold">{session.currentIndex + 1}</span> of {session.questions.length}
              </span>
              <button
                onClick={() => setShowNav(!showNav)}
                className="btn-ghost text-xs sm:hidden"
              >
                {showNav ? 'Hide' : 'Show'} Nav
              </button>
            </div>
            <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-300"
                style={{ width: `${((session.currentIndex + 1) / session.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-card p-5 sm:p-6 mb-4" key={question.id}>
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {question.week && (
                <span className="badge-surface text-xs">Week {question.week}</span>
              )}
              {question.topic && (
                <span className="badge-surface text-xs">{question.topic}</span>
              )}
              {question.difficulty && (
                <span className={`text-xs badge ${
                  question.difficulty === 'easy' ? 'badge-success' :
                  question.difficulty === 'medium' ? 'badge-accent' :
                  'badge-danger'
                }`}>
                  {question.difficulty}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h2 className="text-lg font-medium text-surface-50 leading-relaxed mb-6">
              {question.questionText}
            </h2>

            {/* Options */}
            <div className="space-y-2.5">
              {question.options.map((opt, i) => {
                const isSelected = qState.selectedOption === opt.id;
                const isCorrect = opt.id === question.correctOption;

                let className = 'option-btn';
                let indicator = '';
                let ariaLabel = `Option ${String.fromCharCode(65 + i)}: ${opt.text}`;

                if (revealAnswer) {
                  if (isCorrect) {
                    className = 'option-btn correct';
                    indicator = '✓';
                  } else if (isSelected && !isCorrect) {
                    className = 'option-btn incorrect';
                    indicator = '✗';
                  }
                } else if (isSelected) {
                  className = 'option-btn selected';
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(question.id, opt.id)}
                    className={className}
                    disabled={revealAnswer && session.config.fastMode}
                    aria-label={ariaLabel}
                    aria-pressed={isSelected}
                    id={`option-${opt.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold ${
                        isSelected
                          ? revealAnswer
                            ? isCorrect ? 'bg-success-700 text-white' : 'bg-danger-700 text-white'
                            : 'bg-brand-600 text-white'
                          : revealAnswer && isCorrect
                          ? 'bg-success-700/30 text-success-400'
                          : 'bg-surface-700/60 text-surface-400'
                      }`}>
                        {indicator || String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-left pt-0.5">{opt.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation (result on spot) */}
            {revealAnswer && question.explanation && (
              <div className="mt-4 p-4 rounded-xl bg-brand-600/10 border border-brand-500/20 animate-fade-in">
                <p className="text-sm font-semibold text-brand-300 mb-1">💡 Explanation</p>
                <p className="text-sm text-surface-300 leading-relaxed">{question.explanation}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleMark(question.id)}
                className={`btn-ghost text-sm ${qState.markedForReview ? 'text-accent-400' : ''}`}
                aria-label={qState.markedForReview ? 'Unmark for review' : 'Mark for review'}
              >
                {qState.markedForReview ? '🔖 Marked' : '🏷️ Mark for Review'}
              </button>
              <button
                onClick={() => clearOption(question.id)}
                className="btn-ghost text-sm"
                disabled={qState.selectedOption === null}
              >
                ✕ Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => previous()}
                disabled={session.currentIndex === 0}
                className="btn-secondary text-sm px-4"
              >
                ← Prev
              </button>
              {session.currentIndex < session.questions.length - 1 ? (
                <button onClick={() => next()} className="btn-primary text-sm px-4">
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="btn-success text-sm px-4"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation Panel (desktop) */}
        <div className="hidden sm:block w-48 flex-shrink-0">
          <QuestionNav session={session} currentIndex={session.currentIndex} onGoTo={goTo} />
          <button
            onClick={() => setShowConfirm(true)}
            className="btn-success w-full text-sm mt-4"
          >
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Mobile Question Nav */}
      {showNav && (
        <div className="sm:hidden mt-4 animate-fade-in">
          <QuestionNav session={session} currentIndex={session.currentIndex} onGoTo={(i) => { goTo(i); setShowNav(false); }} />
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showConfirm && (
        <SubmitModal
          summary={summary}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function QuestionNav({
  session,
  currentIndex,
  onGoTo,
}: {
  session: ReturnType<typeof getCurrentQuestion> extends infer T ? any : any;
  currentIndex: number;
  onGoTo: (i: number) => void;
}) {
  return (
    <div className="glass-card p-3">
      <p className="text-xs text-surface-500 font-medium mb-2 px-1">Questions</p>
      <div className="grid grid-cols-5 gap-1.5">
        {session.questions.map((_: any, i: number) => {
          const qId = session.questions[i].id;
          const status = getQuestionStatus(session, qId);
          const isCurrent = i === currentIndex;
          return (
            <button
              key={qId}
              onClick={() => onGoTo(i)}
              className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-brand-600 text-white ring-2 ring-brand-400'
                  : status === 'answered'
                  ? 'bg-success-700/30 text-success-400 border border-success-500/30'
                  : status === 'marked'
                  ? 'bg-accent-600/30 text-accent-400 border border-accent-500/30'
                  : 'bg-surface-800/60 text-surface-400 border border-surface-600/30 hover:border-surface-500/50'
              }`}
              aria-label={`Go to question ${i + 1}, ${status}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 px-1 text-xs text-surface-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-success-700/30 border border-success-500/30" /> Answered
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-accent-600/30 border border-accent-500/30" /> Review
        </span>
      </div>
    </div>
  );
}

function SubmitModal({
  summary,
  onConfirm,
  onCancel,
}: {
  summary: ReturnType<typeof getSubmissionSummary>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 sm:p-8 max-w-md w-full animate-scale-in" role="dialog" aria-modal="true" aria-label="Submit quiz confirmation">
        <h2 className="text-xl font-bold text-surface-50 mb-4">Submit Quiz?</h2>
        <div className="space-y-3 mb-6">
          <SummaryRow label="Total Questions" value={summary.total} />
          <SummaryRow label="Answered" value={summary.answered} color="text-success-400" />
          <SummaryRow label="Unanswered" value={summary.unanswered} color={summary.unanswered > 0 ? 'text-accent-400' : 'text-surface-400'} />
          <SummaryRow label="Marked for Review" value={summary.markedForReview} color={summary.markedForReview > 0 ? 'text-accent-400' : 'text-surface-400'} />
        </div>
        {summary.unanswered > 0 && (
          <div className="p-3 rounded-lg bg-accent-600/10 border border-accent-500/20 mb-6">
            <p className="text-sm text-accent-300">
              ⚠️ You have {summary.unanswered} unanswered question{summary.unanswered !== 1 ? 's' : ''}.
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Go Back
          </button>
          <button onClick={onConfirm} className="btn-success flex-1" id="confirm-submit-btn">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-surface-400">{label}</span>
      <span className={`font-semibold ${color || 'text-surface-200'}`}>{value}</span>
    </div>
  );
}
