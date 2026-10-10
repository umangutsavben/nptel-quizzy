import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import { QuizProvider } from './lib/quiz-store';

export default function App() {
  return (
    <QuizProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Route>
      </Routes>
    </QuizProvider>
  );
}
