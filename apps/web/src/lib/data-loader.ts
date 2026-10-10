/**
 * Data Loader — Fetches question bank manifest and course data
 *
 * Uses lazy loading: only fetches course question files when needed.
 * Caches fetched data in memory for the session.
 */

import type { QuestionBankManifest, CourseMeta, Question } from '@nptel-quiz/question-schema';

// In-memory cache for the current session
const courseQuestionsCache = new Map<string, Question[]>();
let manifestCache: QuestionBankManifest | null = null;

/**
 * Base URL for question bank files.
 * In development, these are served from the public directory.
 * In production, they're part of the static build.
 */
const QUESTION_BANK_BASE = '/question-bank';

/**
 * Fetch the question bank manifest.
 */
export async function fetchManifest(): Promise<QuestionBankManifest> {
  if (manifestCache) return manifestCache;

  const res = await fetch(`${QUESTION_BANK_BASE}/manifest.json`);
  if (!res.ok) {
    throw new Error(`Failed to load manifest: ${res.status} ${res.statusText}`);
  }
  const data: QuestionBankManifest = await res.json();
  manifestCache = data;
  return data;
}

/**
 * Fetch questions for a specific course.
 */
export async function fetchCourseQuestions(course: CourseMeta): Promise<Question[]> {
  const cached = courseQuestionsCache.get(course.id);
  if (cached) return cached;

  const res = await fetch(`${QUESTION_BANK_BASE}/${course.questionFile}`);
  if (!res.ok) {
    throw new Error(`Failed to load questions for ${course.name}: ${res.status}`);
  }
  const questions: Question[] = await res.json();
  courseQuestionsCache.set(course.id, questions);
  return questions;
}

/**
 * Get a course by ID from the manifest.
 */
export async function getCourse(courseId: string): Promise<CourseMeta | null> {
  const manifest = await fetchManifest();
  return manifest.courses.find(c => c.id === courseId) ?? null;
}

/**
 * Clear all cached data (useful when restarting or for testing).
 */
export function clearCache(): void {
  manifestCache = null;
  courseQuestionsCache.clear();
}
