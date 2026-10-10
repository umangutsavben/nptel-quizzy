import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { QuizProvider } from './lib/quiz-store';
import HomePage from './screens/HomePage';
import CoursePage from './screens/CoursePage';
import QuizPage from './screens/QuizPage';
import ResultPage from './screens/ResultPage';
export default function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const navigate = (screen, params) => {
        if (params?.courseId) {
            setSelectedCourseId(params.courseId);
        }
        setCurrentScreen(screen);
    };
    return (<QuizProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e17"/>
        <View style={styles.content}>
          {currentScreen === 'home' && <HomePage onNavigate={navigate}/>}
          {currentScreen === 'course' && <CoursePage onNavigate={navigate} courseId={selectedCourseId}/>}
          {currentScreen === 'quiz' && <QuizPage onNavigate={navigate}/>}
          {currentScreen === 'result' && <ResultPage onNavigate={navigate}/>}
        </View>
      </SafeAreaView>
    </QuizProvider>);
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
//# sourceMappingURL=App.js.map