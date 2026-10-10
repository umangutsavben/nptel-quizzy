/**
 * HomePage — Course Selection
 *
 * Displays available courses from the manifest in a card grid.
 * Lazy-loads the manifest on mount.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { QuestionBankManifest, CourseMeta } from '@nptel-quiz/question-schema';
import { fetchManifest } from '../lib/data-loader';

export default function HomePage() {
  const [manifest, setManifest] = useState<QuestionBankManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchManifest()
      .then(setManifest)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/40 via-surface-950 to-surface-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/8 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-400"></span>
            </span>
            Free &amp; Open Source
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="text-surface-50">NPTEL Quiz</span>
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              Practice Platform
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed">
            Master your NPTEL courses with weekly quiz practice and previous year questions.
            No signup. No tracking. Just practice.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#courses" className="btn-primary text-base">
              Start Practicing →
            </a>
            <a href="#download" className="btn-secondary text-base">
              📱 Download App
            </a>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section id="courses" className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-bold text-surface-50">Available Courses</h2>
          {manifest && (
            <span className="badge-brand">
              {manifest.courses.length} {manifest.courses.length === 1 ? 'course' : 'courses'}
            </span>
          )}
        </div>

        {loading && <LoadingGrid />}
        {error && <ErrorState message={error} />}
        {manifest && !loading && manifest.courses.length === 0 && <EmptyState />}
        {manifest && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {manifest.courses.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Download Section */}
      <section id="download" className="max-w-6xl mx-auto px-4 py-16">
        <div className="glass-card p-8 sm:p-12 text-center">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-surface-50 mb-3">Get the Android App</h2>
          <p className="text-surface-400 max-w-lg mx-auto mb-6">
            Practice offline on your phone. Same features, same questions — installable as an Android APK.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              className="btn-primary opacity-60 cursor-not-allowed"
              disabled
              title="APK build coming soon"
            >
              Download APK (Coming Soon)
            </button>
          </div>
          <div className="mt-6 text-sm text-surface-500 space-y-1">
            <p>Version: 1.0.0 • Android 8.0+</p>
            <p>You'll need to enable "Install from unknown sources" in your Android settings.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function CourseCard({ course, index }: { course: CourseMeta; index: number }) {
  const weeklyCount = course.weeks.reduce((sum, w) => sum + w.questionCount, 0);

  return (
    <Link
      to={`/course/${course.id}`}
      className="glass-card group p-6 hover:border-brand-500/40 transition-all duration-300 hover:shadow-glow animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
      id={`course-card-${course.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <svg className="w-5 h-5 text-surface-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-surface-100 mb-2 group-hover:text-brand-300 transition-colors leading-tight">
        {course.name}
      </h3>

      {course.description && (
        <p className="text-sm text-surface-400 mb-4 line-clamp-2">{course.description}</p>
      )}

      {course.instructor && (
        <p className="text-xs text-surface-500 mb-4">👤 {course.instructor}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto">
        <span className="badge-brand">{course.totalQuestions} questions</span>
        {course.pyqCount > 0 && <span className="badge-accent">{course.pyqCount} PYQs</span>}
        {course.weeks.length > 0 && (
          <span className="badge-surface">{course.weeks.length} weeks</span>
        )}
      </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-card p-6 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-surface-700/40 mb-4" />
          <div className="h-5 bg-surface-700/40 rounded w-3/4 mb-3" />
          <div className="h-4 bg-surface-700/30 rounded w-full mb-2" />
          <div className="h-4 bg-surface-700/30 rounded w-2/3 mb-4" />
          <div className="flex gap-2">
            <div className="h-6 bg-surface-700/30 rounded-full w-20" />
            <div className="h-6 bg-surface-700/30 rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="glass-card p-8 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-danger-400 mb-2">Failed to load courses</h3>
      <p className="text-surface-400">{message}</p>
      <button onClick={() => window.location.reload()} className="btn-secondary mt-4">
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card p-8 text-center">
      <div className="text-4xl mb-3">📭</div>
      <h3 className="text-lg font-semibold text-surface-300 mb-2">No courses available yet</h3>
      <p className="text-surface-400">Check back soon — courses are being added.</p>
    </div>
  );
}
