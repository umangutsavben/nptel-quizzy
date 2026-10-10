import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { QuestionBankManifest, CourseMeta } from '@nptel-quiz/question-schema';
import { fetchManifest } from '../lib/data-loader';
import type { Screen } from '../../App';

export default function HomePage({ onNavigate }: { onNavigate: (s: Screen, p?: any) => void }) {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>NPTEL Quiz Prep</Text>
        <Text style={styles.subtitle}>Practice offline on your phone.</Text>
      </View>

      <Text style={styles.sectionTitle}>Available Courses</Text>

      {loading && <ActivityIndicator size="large" color="#5c7cfa" style={{ marginTop: 40 }} />}
      
      {error && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => { setLoading(true); fetchManifest().then(setManifest).catch(e=>setError(e.message)).finally(()=>setLoading(false)) }}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {manifest && manifest.courses.map((course: CourseMeta) => (
        <TouchableOpacity 
          key={course.id} 
          style={styles.card}
          onPress={() => onNavigate('course', { courseId: course.id })}
        >
          <Text style={styles.courseTitle}>{course.name}</Text>
          {course.instructor && <Text style={styles.courseInstructor}>👤 {course.instructor}</Text>}
          <View style={styles.badges}>
            <View style={styles.badge}><Text style={styles.badgeText}>{course.totalQuestions} qs</Text></View>
            {course.pyqCount > 0 && <View style={[styles.badge, styles.badgeAccent]}><Text style={styles.badgeAccentText}>{course.pyqCount} PYQs</Text></View>}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17' },
  content: { padding: 20 },
  header: { marginBottom: 30, marginTop: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#f0f4ff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#9aa0a6' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#e8eaed', marginBottom: 16 },
  card: { backgroundColor: '#111827', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  courseTitle: { fontSize: 18, fontWeight: '600', color: '#f0f4ff', marginBottom: 8 },
  courseInstructor: { fontSize: 14, color: '#9aa0a6', marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: 'rgba(92, 124, 250, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(92, 124, 250, 0.3)' },
  badgeText: { color: '#91a7ff', fontSize: 12, fontWeight: '600' },
  badgeAccent: { backgroundColor: 'rgba(255, 167, 38, 0.2)', borderColor: 'rgba(255, 167, 38, 0.3)' },
  badgeAccentText: { color: '#ffcc80', fontSize: 12, fontWeight: '600' },
  errorText: { color: '#ef5350', marginBottom: 10, textAlign: 'center' },
  button: { backgroundColor: '#374151', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#e8eaed', fontWeight: '600' }
});
