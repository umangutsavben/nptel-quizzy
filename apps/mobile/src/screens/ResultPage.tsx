import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuiz } from '../lib/quiz-store';
import { getIncorrectQuestions } from '@nptel-quiz/quiz-core';
import type { Screen } from '../../App';

export default function ResultPage({ onNavigate }: { onNavigate: (s: Screen, p?: any) => void }) {
  const { state, startQuiz, reset } = useQuiz();
  const { result, session } = state;

  if (!result) return null;

  const incorrectQuestions = useMemo(() => getIncorrectQuestions(result), [result]);
  const scorePercent = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;

  const handleRetry = () => {
    if (incorrectQuestions.length === 0) return;
    startQuiz(incorrectQuestions, { ...result.config, title: `${result.config.title} — Retry` });
    onNavigate('quiz');
  };

  const handleRetake = () => {
    if (!session) return;
    startQuiz(session.questions, result.config);
    onNavigate('quiz');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Quiz Complete!</Text>
        <Text style={styles.subtitle}>{result.config.courseName}</Text>
        
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{result.score}</Text>
          <Text style={styles.maxScoreText}>/ {result.maxScore}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
            <Text style={[styles.statVal, { color: '#81c784' }]}>{result.correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
            <Text style={[styles.statVal, { color: '#e57373' }]}>{result.incorrect}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}>
            <Text style={[styles.statVal, { color: '#9aa0a6' }]}>{result.unanswered}</Text>
            <Text style={styles.statLabel}>Unanswered</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(92, 124, 250, 0.1)' }]}>
            <Text style={[styles.statVal, { color: '#91a7ff' }]}>{result.accuracy !== null ? `${result.accuracy.toFixed(0)}%` : 'N/A'}</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, incorrectQuestions.length === 0 && styles.btnDisabled]} onPress={handleRetry} disabled={incorrectQuestions.length === 0}>
          <Text style={styles.btnText}>Retry Incorrect ({incorrectQuestions.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSec} onPress={handleRetake}>
          <Text style={styles.btnSecText}>Retake Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSec} onPress={() => { reset(); onNavigate('course', { courseId: result.config.courseId }); }}>
          <Text style={styles.btnSecText}>Back to Course</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Question Review</Text>
      {result.questionResults.map((qr, i) => (
        <View key={qr.question.id} style={[styles.reviewCard, 
          !qr.isAnswered ? styles.revUnanswered : qr.isCorrect ? styles.revCorrect : styles.revIncorrect]}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
            <Text style={styles.revQNum}>Q{i + 1}</Text>
            <Text style={qr.earnedMarks > 0 ? styles.revScorePos : qr.earnedMarks < 0 ? styles.revScoreNeg : styles.revScoreZero}>
              {qr.earnedMarks > 0 ? '+' : ''}{qr.earnedMarks}
            </Text>
          </View>
          <Text style={styles.revQText}>{qr.question.questionText}</Text>
          
          <View style={{gap: 6}}>
            {qr.question.options.map((opt) => {
              const isSelected = qr.selectedOption === opt.id;
              const isCorrectOpt = opt.id === qr.correctOption;
              if (!isSelected && !isCorrectOpt) return null;
              
              return (
                <View key={opt.id} style={[styles.revOpt, isCorrectOpt ? styles.revOptCorrect : styles.revOptIncorrect]}>
                  <Text style={[styles.revOptText, isCorrectOpt ? {color: '#81c784'} : {color: '#e57373'}]}>
                    {isCorrectOpt ? '✓' : '✗'} {opt.text}
                  </Text>
                </View>
              );
            })}
          </View>
          
          {qr.question.explanation && (
             <View style={styles.revExp}>
               <Text style={styles.revExpTitle}>Explanation</Text>
               <Text style={styles.revExpText}>{qr.question.explanation}</Text>
             </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17' },
  content: { padding: 16 },
  card: { backgroundColor: '#111827', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f0f4ff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9aa0a6', marginBottom: 24, textAlign: 'center' },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: '#5c7cfa', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  scoreText: { fontSize: 36, fontWeight: 'bold', color: 'white' },
  maxScoreText: { fontSize: 16, color: '#9aa0a6' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  statBox: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 12, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#9aa0a6' },
  actions: { gap: 12, marginBottom: 24 },
  btn: { backgroundColor: '#5c7cfa', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#374151', opacity: 0.5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnSec: { backgroundColor: '#1f2937', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  btnSecText: { color: '#e8eaed', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 16 },
  reviewCard: { backgroundColor: '#111827', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4 },
  revUnanswered: { borderLeftColor: '#6b7280' },
  revCorrect: { borderLeftColor: '#4caf50' },
  revIncorrect: { borderLeftColor: '#f44336' },
  revQNum: { color: '#9aa0a6', fontWeight: 'bold' },
  revScorePos: { color: '#4caf50', fontWeight: 'bold' },
  revScoreNeg: { color: '#f44336', fontWeight: 'bold' },
  revScoreZero: { color: '#9aa0a6', fontWeight: 'bold' },
  revQText: { fontSize: 16, color: '#f0f4ff', marginBottom: 12 },
  revOpt: { padding: 10, borderRadius: 8, borderWidth: 1 },
  revOptCorrect: { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.3)' },
  revOptIncorrect: { backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: 'rgba(244, 67, 54, 0.3)' },
  revOptText: { fontSize: 14 },
  revExp: { marginTop: 12, padding: 12, backgroundColor: 'rgba(92, 124, 250, 0.1)', borderRadius: 8 },
  revExpTitle: { color: '#91a7ff', fontWeight: 'bold', fontSize: 12, marginBottom: 4 },
  revExpText: { color: '#d3d6db', fontSize: 13, lineHeight: 20 }
});
