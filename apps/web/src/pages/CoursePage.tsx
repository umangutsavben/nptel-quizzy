/**
 * CoursePage — Quiz Configuration
 *
 * Allows selecting quiz type (PYQ / Weekly), week, and settings (Fast Mode, Result on Spot).
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { CourseMeta, Question, SourceType } from '@nptel-quiz/question-schema';
import { DEFAULT_SCORING } from '@nptel-quiz/question-schema';
import { filterQuestions, type QuizConfig } from '@nptel-quiz/quiz-core';
import { getCourse, fetchCourseQuestions } from '../lib/data-loader';
import { useQuiz } from '../lib/quiz-store';

type QuizType = 'weekly_quiz' | 'pyq';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { startQuiz } = useQuiz();

  const [course, setCourse] = useState<CourseMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz configuration state
  const [quizType, setQuizType] = useState<QuizType>('weekly_quiz');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [fastMode, setFastMode] = useState(false);
  const [resultOnSpot, setResultOnSpot] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    getCourse(courseId)
      .then(async (c) => {
        if (!c) {
          setError('Course not found');
          return;
        }
        setCourse(c);
        const qs = await fetchCourseQuestions(c);
        setQuestions(qs);
        // Default to first available week
        if (c.weeks.length > 0) {
          setSelectedWeek(c.weeks[0].week);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Filter questions based on current selection
  const filteredQuestions = useMemo(() => {
    if (quizType === 'pyq') {
      if (selectedWeek !== null) {
        return filterQuestions(questions, { sourceType: 'pyq' as SourceType, week: selectedWeek });
      }
      return filterQuestions(questions, { sourceType: 'pyq' as SourceType });
    }
    if (quizType === 'weekly_quiz' && selectedWeek !== null) {
      return filterQuestions(questions, { sourceType: 'weekly_quiz' as SourceType, week: selectedWeek });
    }
    if (quizType === 'weekly_quiz') {
      return filterQuestions(questions, { sourceType: 'weekly_quiz' as SourceType });
    }
    return [];
  }, [questions, quizType, selectedWeek]);

  const pyqCount = useMemo(
    () => questions.filter(q => q.sourceType === 'pyq').length,
    [questions]
  );
  const weeklyCount = useMemo(
    () => questions.filter(q => q.sourceType === 'weekly_quiz').length,
    [questions]
  );

  const handleStart = () => {
    if (filteredQuestions.length === 0) return;

    const weekTitle = selectedWeek !== null
      ? ` — Week ${selectedWeek}`
      : '';
    const typeLabel = quizType === 'pyq' ? 'PYQ Practice' : 'Weekly Quiz';

    const config: QuizConfig = {
      title: `${typeLabel}${weekTitle}`,
      courseId: course!.id,
      courseName: course!.name,
      fastMode,
      resultOnSpot,
      timeLimit: null,
      scoring: DEFAULT_SCORING,
    };

    startQuiz(filteredQuestions, config);
    navigate('/quiz');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-6 bg-surface-700/40 rounded w-48 mb-8" />
        <div className="glass-card p-8 space-y-6">
          <div className="h-8 bg-surface-700/40 rounded w-3/4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-surface-700/30 rounded-xl" />
            <div className="h-24 bg-surface-700/30 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-xl font-semibold text-danger-400 mb-2">
            {error || 'Course not found'}
          </h2>
          <Link to="/" className="btn-secondary mt-4 inline-flex">← Back to Courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-6">
        <Link to="/" className="hover:text-surface-200 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-surface-200">{course.name}</span>
      </nav>

      {/* Course Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-50 mb-2">{course.name}</h1>
        {course.instructor && (
          <p className="text-surface-400">👤 {course.instructor}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="badge-brand">{course.totalQuestions} questions</span>
          {pyqCount > 0 && <span className="badge-accent">{pyqCount} PYQs</span>}
          {weeklyCount > 0 && <span className="badge-surface">{weeklyCount} weekly</span>}
        </div>
      </div>

      {/* Quiz Type Selection */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Choose Practice Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuizTypeCard
            selected={quizType === 'weekly_quiz'}
            onClick={() => {
              setQuizType('weekly_quiz');
              setSelectedWeek(null);
            }}
            icon="📝"
            title="Practice Weekly Quiz"
            subtitle={weeklyCount > 0 ? `${weeklyCount} questions across ${course.weeks.length} weeks` : 'No weekly quiz questions available'}
            disabled={weeklyCount === 0}
          />
          <QuizTypeCard
            selected={quizType === 'pyq'}
            onClick={() => {
              setQuizType('pyq');
              setSelectedWeek(null);
            }}
            icon="📋"
            title="Practice PYQs"
            subtitle={pyqCount > 0 ? `${pyqCount} previous year questions` : 'No PYQ questions available'}
            disabled={pyqCount === 0}
          />
        </div>
      </div>

      {/* Week Selection */}
      {course.weeks.length > 0 && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-100">Select Week</h2>
            <span className="text-xs text-surface-400">
              {quizType === 'pyq' ? 'Previous year questions by week' : 'Assignment questions by week'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedWeek(null)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                selectedWeek === null
                  ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                  : 'bg-surface-800/60 border-surface-600/30 text-surface-300 hover:border-surface-500/50'
              }`}
            >
              <div>All Weeks</div>
              <div className="text-xs text-surface-500 mt-0.5">
                {quizType === 'pyq' ? `${pyqCount}q` : `${weeklyCount}q`}
              </div>
            </button>
            {course.weeks.map(w => {
              const weekCount = questions.filter(
                q => q.sourceType === quizType && q.week === w.week
              ).length;
              return (
                <button
                  key={w.week}
                  onClick={() => setSelectedWeek(w.week)}
                  disabled={weekCount === 0}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    selectedWeek === w.week
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                      : weekCount === 0
                      ? 'bg-surface-900/40 border-surface-800 text-surface-600 cursor-not-allowed opacity-50'
                      : 'bg-surface-800/60 border-surface-600/30 text-surface-300 hover:border-surface-500/50'
                  }`}
                >
                  <div>Week {w.week}</div>
                  <div className="text-xs text-surface-500 mt-0.5">{weekCount}q</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Quiz Settings</h2>
        <div className="space-y-4">
          <ToggleSetting
            id="fast-mode"
            label="Fast Mode"
            description="Auto-advance to the next question after selecting an answer"
            checked={fastMode}
            onChange={setFastMode}
          />
          <ToggleSetting
            id="result-on-spot"
            label="Result on Spot"
            description="Show whether your answer is correct immediately after selecting"
            checked={resultOnSpot}
            onChange={setResultOnSpot}
          />
        </div>
      </div>

      {/* Start Button */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-surface-300">
              {filteredQuestions.length > 0
                ? `${filteredQuestions.length} question${filteredQuestions.length !== 1 ? 's' : ''} ready`
                : 'No questions available for this selection'}
            </p>
            {filteredQuestions.length > 0 && (
              <p className="text-sm text-surface-500 mt-1">No time limit • Default scoring</p>
            )}
          </div>
          <button
            onClick={handleStart}
            disabled={filteredQuestions.length === 0}
            className="btn-primary text-lg px-8"
            id="start-quiz-btn"
          >
            Start Quiz →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function QuizTypeCard({
  selected, onClick, icon, title, subtitle, disabled,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  subtitle: string;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-5 rounded-xl text-left transition-all border ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-surface-800/30 border-surface-700/30'
          : selected
          ? 'bg-brand-600/15 border-brand-500/50 shadow-glow'
          : 'bg-surface-800/60 border-surface-600/30 hover:border-surface-500/50 cursor-pointer'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <h3 className={`font-semibold mt-2 ${selected ? 'text-brand-300' : 'text-surface-200'}`}>
        {title}
      </h3>
      <p className="text-sm text-surface-400 mt-1">{subtitle}</p>
    </button>
  );
}

function ToggleSetting({
  id, label, description, checked, onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-4 cursor-pointer group">
      <div className="pt-0.5">
        <div
          className={`relative w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-brand-600' : 'bg-surface-600'
          }`}
        >
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="sr-only"
            role="switch"
            aria-checked={checked}
          />
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
      <div>
        <div className="font-medium text-surface-200 group-hover:text-surface-100 transition-colors">
          {label}
        </div>
        <div className="text-sm text-surface-500">{description}</div>
      </div>
    </label>
  );
}
