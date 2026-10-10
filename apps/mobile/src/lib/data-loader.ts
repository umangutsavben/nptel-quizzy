/**
 * Mobile Data Loader — Fetches question bank manifest and course data
 */
import type { QuestionBankManifest, CourseMeta, Question } from '@nptel-quiz/question-schema';
import { Platform } from 'react-native';

// In production, this would be the actual deployed URL (e.g. https://nptel-quiz.pages.dev/question-bank)
// For local testing on Android emulator, 10.0.2.2 points to localhost.
const BASE_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:5173/question-bank' : 'http://localhost:5173/question-bank')
  : 'https://nptel-quiz-demo.pages.dev/question-bank';

const courseQuestionsCache = new Map<string, Question[]>();
let manifestCache: QuestionBankManifest | null = null;

export async function fetchManifest(): Promise<QuestionBankManifest> {
  if (manifestCache) return manifestCache;

  const res = await fetch(`${BASE_URL}/manifest.json`);
  if (!res.ok) {
    throw new Error(`Failed to load manifest: ${res.status}`);
  }
  const data: QuestionBankManifest = await res.json();
  manifestCache = data;
  return data;
}

export async function fetchCourseQuestions(course: CourseMeta): Promise<Question[]> {
  const cached = courseQuestionsCache.get(course.id);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/${course.questionFile}`);
  if (!res.ok) {
    throw new Error(`Failed to load questions for ${course.name}: ${res.status}`);
  }
  const questions: Question[] = await res.json();
  courseQuestionsCache.set(course.id, questions);
  return questions;
}

export async function getCourse(courseId: string): Promise<CourseMeta | null> {
  const manifest = await fetchManifest();
  return manifest.courses.find(c => c.id === courseId) ?? null;
}

export function clearCache(): void {
  manifestCache = null;
  courseQuestionsCache.clear();
}
