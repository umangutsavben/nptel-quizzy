import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { QuizProvider } from './lib/quiz-store';

const HomePage = lazy(() => import('./pages/HomePage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));

export default function App() {
  return (
    <QuizProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Route>
        </Routes>
      </Suspense>
    </QuizProvider>
  );
}
