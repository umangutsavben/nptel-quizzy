/**
 * ResultPage — Quiz Results & Review
 *
 * Shows score summary, accuracy, time taken, and question-by-question review.
 * Provides retry incorrect, retake, and navigation actions.
 */

import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuiz } from '../lib/quiz-store';
import { getIncorrectQuestions, formatTime, type QuizConfig } from '@nptel-quiz/quiz-core';
import { DEFAULT_SCORING } from '@nptel-quiz/question-schema';

export default function ResultPage() {
  const navigate = useNavigate();
  const { state, startQuiz, reset } = useQuiz();
  const { result, session } = state;

  // Redirect if no result
  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center page-enter">
        <div className="glass-card p-8">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-xl font-semibold text-surface-200 mb-2">No results to display</h2>
          <p className="text-surface-400 mb-4">Start a quiz to see your results here.</p>
          <Link to="/" className="btn-primary">Go to Courses</Link>
        </div>
      </div>
    );
  }

  const incorrectQuestions = useMemo(() => getIncorrectQuestions(result), [result]);

  const handleRetryIncorrect = () => {
    if (incorrectQuestions.length === 0) return;
    const config: QuizConfig = {
      ...result.config,
      title: `${result.config.title} — Retry Incorrect`,
    };
    startQuiz(incorrectQuestions, config);
    navigate('/quiz');
  };

  const handleRetake = () => {
    if (!session) return;
    const config = result.config;
    startQuiz(session.questions, config);
    navigate('/quiz');
  };

  const handleBackToCourse = () => {
    reset();
    navigate(`/course/${result.config.courseId}`);
  };

  const handleHome = () => {
    reset();
    navigate('/');
  };

  const scorePercent = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      {/* Score Summary Card */}
      <div className="glass-card p-6 sm:p-8 mb-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-50 mb-1">Quiz Complete!</h1>
          <p className="text-surface-400">{result.config.title} — {result.config.courseName}</p>
        </div>

        {/* Score Circle */}
        <div className="flex justify-center mb-8">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-800" />
              <circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - scorePercent / 100)}`}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${
                  scorePercent >= 70 ? 'text-success-500' :
                  scorePercent >= 40 ? 'text-accent-500' :
                  'text-danger-500'
                }`}
                stroke="currentColor"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-surface-50">{result.score}</span>
              <span className="text-sm text-surface-400">/ {result.maxScore}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Correct" value={result.correct} icon="✓" color="text-success-400" bgColor="bg-success-700/15" />
          <StatCard label="Incorrect" value={result.incorrect} icon="✗" color="text-danger-400" bgColor="bg-danger-700/15" />
          <StatCard label="Unanswered" value={result.unanswered} icon="—" color="text-surface-400" bgColor="bg-surface-700/20" />
          <StatCard
            label="Accuracy"
            value={result.accuracy !== null ? `${result.accuracy.toFixed(1)}%` : 'N/A'}
            icon="🎯"
            color={result.accuracy !== null && result.accuracy >= 70 ? 'text-success-400' : 'text-surface-300'}
            bgColor="bg-brand-600/10"
          />
        </div>

        <div className="flex justify-center mt-4">
          <span className="text-sm text-surface-500">
            ⏱ Time taken: {formatTime(result.timeTaken)} •
            Attempted: {result.attempted}/{result.totalQuestions}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="glass-card p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleRetryIncorrect}
            disabled={incorrectQuestions.length === 0}
            className="btn-primary text-sm"
            title={incorrectQuestions.length === 0 ? 'No incorrect questions to retry' : `Retry ${incorrectQuestions.length} incorrect questions`}
          >
            🔄 Retry Incorrect ({incorrectQuestions.length})
          </button>
          <button onClick={handleRetake} className="btn-secondary text-sm">
            🔁 Retake Quiz
          </button>
          <button onClick={handleBackToCourse} className="btn-secondary text-sm">
            📚 Back to Course
          </button>
          <button onClick={handleHome} className="btn-ghost text-sm">
            🏠 Home
          </button>
        </div>
        {incorrectQuestions.length === 0 && result.attempted > 0 && result.incorrect === 0 && (
          <p className="text-sm text-success-400 text-center mt-3">🎉 No incorrect answers — great job!</p>
        )}
      </div>

      {/* Question-by-Question Review */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-surface-50 mb-4">Question Review</h2>
        <div className="space-y-4">
          {result.questionResults.map((qr, i) => (
            <div
              key={qr.question.id}
              className={`glass-card p-5 border-l-4 ${
                !qr.isAnswered ? 'border-l-surface-600' :
                qr.isCorrect ? 'border-l-success-500' :
                'border-l-danger-500'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-surface-400">Q{i + 1}</span>
                  {qr.isAnswered ? (
                    qr.isCorrect ? (
                      <span className="badge-success">Correct</span>
                    ) : (
                      <span className="badge-danger">Incorrect</span>
                    )
                  ) : (
                    <span className="badge-surface">Unanswered</span>
                  )}
                  {qr.markedForReview && <span className="badge-accent">Marked</span>}
                </div>
                <span className={`text-sm font-semibold ${
                  qr.earnedMarks > 0 ? 'text-success-400' :
                  qr.earnedMarks < 0 ? 'text-danger-400' :
                  'text-surface-500'
                }`}>
                  {qr.earnedMarks > 0 ? '+' : ''}{qr.earnedMarks}
                </span>
              </div>

              {/* Question text */}
              <p className="text-surface-200 mb-4 leading-relaxed">{qr.question.questionText}</p>

              {/* Options review */}
              <div className="space-y-2 mb-4">
                {qr.question.options.map((opt, j) => {
                  const isSelected = qr.selectedOption === opt.id;
                  const isCorrectOpt = opt.id === qr.correctOption;

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${
                        isCorrectOpt
                          ? 'bg-success-700/15 border border-success-500/30'
                          : isSelected && !isCorrectOpt
                          ? 'bg-danger-700/15 border border-danger-500/30'
                          : 'bg-surface-800/30 border border-surface-700/20'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded text-xs font-semibold flex items-center justify-center ${
                        isCorrectOpt ? 'bg-success-700/40 text-success-400' :
                        isSelected ? 'bg-danger-700/40 text-danger-400' :
                        'bg-surface-700/40 text-surface-500'
                      }`}>
                        {isCorrectOpt ? '✓' : isSelected ? '✗' : String.fromCharCode(65 + j)}
                      </span>
                      <span className={`flex-1 text-sm ${
                        isCorrectOpt ? 'text-success-300' :
                        isSelected ? 'text-danger-300' :
                        'text-surface-400'
                      }`}>
                        {opt.text}
                      </span>
                      {isSelected && (
                        <span className="text-xs text-surface-500 flex-shrink-0">Your answer</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {qr.question.explanation && (
                <div className="p-3 rounded-lg bg-brand-600/10 border border-brand-500/15">
                  <p className="text-xs font-semibold text-brand-300 mb-1">💡 Explanation</p>
                  <p className="text-sm text-surface-300 leading-relaxed">{qr.question.explanation}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mt-3">
                {qr.question.week && <span className="text-xs text-surface-500">Week {qr.question.week}</span>}
                {qr.question.topic && <span className="text-xs text-surface-500">• {qr.question.topic}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="glass-card p-4 text-center">
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={handleRetake} className="btn-primary text-sm">🔁 Retake Quiz</button>
          <button onClick={handleHome} className="btn-secondary text-sm">🏠 Back Home</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, color, bgColor,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`p-4 rounded-xl ${bgColor} text-center`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-surface-400 mt-1">{icon} {label}</div>
    </div>
  );
}
