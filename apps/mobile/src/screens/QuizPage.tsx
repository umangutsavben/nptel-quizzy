import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuiz } from '../lib/quiz-store';
import { getCurrentQuestion, getCurrentQuestionState, getSubmissionSummary } from '@nptel-quiz/quiz-core';
import type { Screen } from '../../App';

export default function QuizPage({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { state, selectOption, clearOption, toggleMark, next, previous, submit } = useQuiz();
  const { session } = state;
  const fastModeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session && state.status === 'idle') onNavigate('home');
    if (state.status === 'submitted') onNavigate('result');
    return () => {
      if (fastModeTimer.current) clearTimeout(fastModeTimer.current);
    };
  }, [session, state.status]);

  if (!session) return null;

  const question = getCurrentQuestion(session);
  const qState = getCurrentQuestionState(session);
  if (!question || !qState) return null;

  const revealAnswer = session.config.resultOnSpot && qState.selectedOption !== null;

  const handleSelect = (optId: string) => {
    if (session.config.resultOnSpot && qState.selectedOption === optId) return;
    selectOption(question.id, optId);
    
    if (session.config.fastMode) {
      if (fastModeTimer.current) clearTimeout(fastModeTimer.current);
      const delay = session.config.resultOnSpot ? 1200 : 300;
      fastModeTimer.current = setTimeout(() => {
        if (session.currentIndex < session.questions.length - 1) next();
      }, delay);
    }
  };

  const confirmSubmit = () => {
    const summary = getSubmissionSummary(session);
    Alert.alert(
      "Submit Quiz?",
      `Total: ${summary.total}\nAnswered: ${summary.answered}\nUnanswered: ${summary.unanswered}\nMarked for Review: ${summary.markedForReview}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: submit }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{session.config.title}</Text>
        <Text style={styles.progressText}>{session.currentIndex + 1} / {session.questions.length}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((session.currentIndex + 1) / session.questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.questionText}>{question.questionText}</Text>
          
          <View style={styles.options}>
            {question.options.map((opt, i) => {
              const isSelected = qState.selectedOption === opt.id;
              const isCorrect = opt.id === question.correctOption;
              
              let btnStyle: any = styles.optionBtn;
              let textStyle: any = styles.optionText;
              
              if (revealAnswer) {
                if (isCorrect) { btnStyle = [styles.optionBtn, styles.correctBtn]; textStyle = styles.correctText; }
                else if (isSelected && !isCorrect) { btnStyle = [styles.optionBtn, styles.incorrectBtn]; textStyle = styles.incorrectText; }
                else { btnStyle = [styles.optionBtn, { opacity: 0.5 }]; }
              } else if (isSelected) {
                btnStyle = [styles.optionBtn, styles.selectedBtn];
                textStyle = styles.selectedText;
              }

              return (
                <TouchableOpacity 
                  key={opt.id} 
                  style={btnStyle} 
                  onPress={() => handleSelect(opt.id)}
                  disabled={revealAnswer && session.config.fastMode}
                >
                  <View style={styles.optionCharBox}>
                    <Text style={[styles.optionChar, textStyle]}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[styles.optionText, textStyle, {flex: 1}]}>{opt.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {revealAnswer && question.explanation && (
            <View style={styles.explanation}>
              <Text style={styles.expTitle}>💡 Explanation</Text>
              <Text style={styles.expText}>{question.explanation}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => toggleMark(question.id)} style={styles.actionBtn}>
            <Text style={[styles.actionText, qState.markedForReview && { color: '#ffb74d' }]}>
              {qState.markedForReview ? '🔖 Marked' : '🏷️ Mark Review'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => clearOption(question.id)} style={styles.actionBtn} disabled={qState.selectedOption === null}>
            <Text style={[styles.actionText, qState.selectedOption === null && { opacity: 0.5 }]}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.navBtn, session.currentIndex === 0 && styles.navBtnDisabled]} onPress={previous} disabled={session.currentIndex === 0}>
          <Text style={styles.navText}>Prev</Text>
        </TouchableOpacity>
        {session.currentIndex < session.questions.length - 1 ? (
          <TouchableOpacity style={styles.navBtnPrimary} onPress={next}>
            <Text style={styles.navTextPrimary}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={confirmSubmit}>
            <Text style={styles.navTextPrimary}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#111827' },
  headerText: { color: '#e8eaed', fontWeight: 'bold' },
  progressText: { color: '#9aa0a6' },
  progressBar: { height: 4, backgroundColor: '#374151' },
  progressFill: { height: '100%', backgroundColor: '#5c7cfa' },
  content: { padding: 16 },
  card: { backgroundColor: '#111827', padding: 20, borderRadius: 16, marginBottom: 16 },
  questionText: { fontSize: 18, color: '#f0f4ff', marginBottom: 24, lineHeight: 28 },
  options: { gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  selectedBtn: { backgroundColor: 'rgba(92, 124, 250, 0.15)', borderColor: '#5c7cfa' },
  correctBtn: { backgroundColor: 'rgba(76, 175, 80, 0.15)', borderColor: '#4caf50' },
  incorrectBtn: { backgroundColor: 'rgba(244, 67, 54, 0.15)', borderColor: '#f44336' },
  optionCharBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionChar: { color: '#9aa0a6', fontWeight: 'bold' },
  optionText: { color: '#e8eaed', fontSize: 16 },
  selectedText: { color: '#91a7ff' },
  correctText: { color: '#81c784' },
  incorrectText: { color: '#e57373' },
  explanation: { marginTop: 20, padding: 16, backgroundColor: 'rgba(92, 124, 250, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(92, 124, 250, 0.2)' },
  expTitle: { color: '#91a7ff', fontWeight: 'bold', marginBottom: 8 },
  expText: { color: '#d3d6db', lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  actionBtn: { padding: 10 },
  actionText: { color: '#9aa0a6', fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#111827', borderTopWidth: 1, borderColor: '#374151', gap: 12 },
  navBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#374151', alignItems: 'center' },
  navBtnDisabled: { opacity: 0.5 },
  navBtnPrimary: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#5c7cfa', alignItems: 'center' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#4caf50', alignItems: 'center' },
  navText: { color: '#e8eaed', fontWeight: 'bold' },
  navTextPrimary: { color: 'white', fontWeight: 'bold' },
});
