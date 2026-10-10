import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import type { CourseMeta, Question, SourceType } from '@nptel-quiz/question-schema';
import { filterQuestions, type QuizConfig } from '@nptel-quiz/quiz-core';
import { DEFAULT_SCORING } from '@nptel-quiz/question-schema';
import { getCourse, fetchCourseQuestions } from '../lib/data-loader';
import { useQuiz } from '../lib/quiz-store';
import type { Screen } from '../../App';

export default function CoursePage({ onNavigate, courseId }: { onNavigate: (s: Screen) => void, courseId: string }) {
  const { startQuiz } = useQuiz();
  const [course, setCourse] = useState<CourseMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [quizType, setQuizType] = useState<'weekly_quiz' | 'pyq'>('weekly_quiz');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [fastMode, setFastMode] = useState(false);
  const [resultOnSpot, setResultOnSpot] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCourse(courseId).then(async c => {
      if (c) {
        setCourse(c);
        const qs = await fetchCourseQuestions(c);
        setQuestions(qs);
        if (c.weeks.length > 0) setSelectedWeek(c.weeks[0].week);
      }
      setLoading(false);
    });
  }, [courseId]);

  const filteredQuestions = useMemo(() => {
    if (quizType === 'pyq') return filterQuestions(questions, { sourceType: 'pyq' });
    if (quizType === 'weekly_quiz' && selectedWeek !== null) return filterQuestions(questions, { sourceType: 'weekly_quiz', week: selectedWeek });
    return filterQuestions(questions, { sourceType: 'weekly_quiz' });
  }, [questions, quizType, selectedWeek]);

  const handleStart = () => {
    if (!course || filteredQuestions.length === 0) return;
    const config: QuizConfig = {
      title: quizType === 'pyq' ? 'PYQ Practice' : `Weekly Quiz${selectedWeek ? ` — Week ${selectedWeek}` : ''}`,
      courseId: course.id,
      courseName: course.name,
      fastMode,
      resultOnSpot,
      timeLimit: null,
      scoring: DEFAULT_SCORING,
    };
    startQuiz(filteredQuestions, config);
    onNavigate('quiz');
  };

  if (loading || !course) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5c7cfa" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Courses</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{course.name}</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Practice Type</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.typeBtn, quizType === 'weekly_quiz' && styles.typeBtnActive]} onPress={() => setQuizType('weekly_quiz')}>
            <Text style={[styles.typeText, quizType === 'weekly_quiz' && styles.typeTextActive]}>Weekly Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, quizType === 'pyq' && styles.typeBtnActive]} onPress={() => setQuizType('pyq')}>
            <Text style={[styles.typeText, quizType === 'pyq' && styles.typeTextActive]}>PYQs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {quizType === 'weekly_quiz' && course.weeks.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Week</Text>
          <View style={styles.weeksGrid}>
            <TouchableOpacity style={[styles.weekBtn, selectedWeek === null && styles.weekBtnActive]} onPress={() => setSelectedWeek(null)}>
              <Text style={selectedWeek === null ? styles.weekTextActive : styles.weekText}>All</Text>
            </TouchableOpacity>
            {course.weeks.map(w => (
              <TouchableOpacity key={w.week} style={[styles.weekBtn, selectedWeek === w.week && styles.weekBtnActive]} onPress={() => setSelectedWeek(w.week)}>
                <Text style={selectedWeek === w.week ? styles.weekTextActive : styles.weekText}>W{w.week}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <View style={{flex: 1}}>
            <Text style={styles.settingLabel}>Fast Mode</Text>
            <Text style={styles.settingDesc}>Auto-advance after answering</Text>
          </View>
          <Switch value={fastMode} onValueChange={setFastMode} trackColor={{ true: '#5c7cfa' }} />
        </View>
        <View style={styles.settingRow}>
          <View style={{flex: 1}}>
            <Text style={styles.settingLabel}>Result on Spot</Text>
            <Text style={styles.settingDesc}>Show correctness immediately</Text>
          </View>
          <Switch value={resultOnSpot} onValueChange={setResultOnSpot} trackColor={{ true: '#5c7cfa' }} />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.startBtn, filteredQuestions.length === 0 && styles.startBtnDisabled]} 
        onPress={handleStart}
        disabled={filteredQuestions.length === 0}
      >
        <Text style={styles.startBtnText}>Start Quiz ({filteredQuestions.length} qs)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e17' },
  content: { padding: 20 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#9aa0a6', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f0f4ff', marginBottom: 24 },
  card: { backgroundColor: '#111827', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e8eaed', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
  typeBtnActive: { backgroundColor: 'rgba(92, 124, 250, 0.15)', borderColor: '#5c7cfa' },
  typeText: { color: '#9aa0a6', fontWeight: '500' },
  typeTextActive: { color: '#91a7ff', fontWeight: 'bold' },
  weeksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weekBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  weekBtnActive: { backgroundColor: 'rgba(92, 124, 250, 0.15)', borderColor: '#5c7cfa' },
  weekText: { color: '#9aa0a6' },
  weekTextActive: { color: '#91a7ff', fontWeight: 'bold' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  settingLabel: { color: '#f0f4ff', fontSize: 16, fontWeight: '500' },
  settingDesc: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  startBtn: { backgroundColor: '#5c7cfa', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  startBtnDisabled: { backgroundColor: '#374151', opacity: 0.5 },
  startBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
