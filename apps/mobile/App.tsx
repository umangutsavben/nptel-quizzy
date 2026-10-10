import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { QuizProvider } from './src/lib/quiz-store';
import HomePage from './src/screens/HomePage';
import CoursePage from './src/screens/CoursePage';
import QuizPage from './src/screens/QuizPage';
import ResultPage from './src/screens/ResultPage';

export type Screen = 'home' | 'course' | 'quiz' | 'result';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const navigate = (screen: Screen, params?: { courseId?: string }) => {
    if (params?.courseId) {
      setSelectedCourseId(params.courseId);
    }
    setCurrentScreen(screen);
  };

  return (
    <QuizProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e17" />
        <View style={styles.content}>
          {currentScreen === 'home' && <HomePage onNavigate={navigate} />}
          {currentScreen === 'course' && <CoursePage onNavigate={navigate} courseId={selectedCourseId!} />}
          {currentScreen === 'quiz' && <QuizPage onNavigate={navigate} />}
          {currentScreen === 'result' && <ResultPage onNavigate={navigate} />}
        </View>
      </SafeAreaView>
    </QuizProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e17',
  },
  content: {
    flex: 1,
  },
});
