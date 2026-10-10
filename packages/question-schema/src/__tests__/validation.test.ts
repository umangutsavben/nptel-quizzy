/**
 * Question Schema Validation Tests
 */

import { describe, it, expect } from 'vitest';
import { validateQuestion, validateQuestions, validateManifest } from '../validation.js';

describe('validateQuestion', () => {
  const validQuestion = {
    id: 'TEST-001',
    courseId: 'test-course',
    courseName: 'Test Course',
    questionText: 'What is 2+2?',
    options: [
      { id: 'a', text: '3' },
      { id: 'b', text: '4' },
      { id: 'c', text: '5' },
      { id: 'd', text: '6' },
    ],
    correctOption: 'b',
    explanation: 'Basic arithmetic: 2+2=4',
  };

  it('should pass for a valid question', () => {
    const errors = validateQuestion(validQuestion, 0);
    expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('should fail when id is missing', () => {
    const q = { ...validQuestion, id: '' };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'id' && e.severity === 'error')).toBe(true);
  });

  it('should fail when courseId is missing', () => {
    const q = { ...validQuestion, courseId: undefined };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'courseId' && e.severity === 'error')).toBe(true);
  });

  it('should fail when questionText is empty', () => {
    const q = { ...validQuestion, questionText: '  ' };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'questionText' && e.severity === 'error')).toBe(true);
  });

  it('should fail when options is not an array', () => {
    const q = { ...validQuestion, options: 'not-array' };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'options' && e.severity === 'error')).toBe(true);
  });

  it('should fail when fewer than 2 options', () => {
    const q = { ...validQuestion, options: [{ id: 'a', text: 'only one' }] };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'options' && e.severity === 'error')).toBe(true);
  });

  it('should fail when correctOption references invalid option ID', () => {
    const q = { ...validQuestion, correctOption: 'z' };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'correctOption' && e.severity === 'error')).toBe(true);
  });

  it('should fail when option has duplicate IDs', () => {
    const q = {
      ...validQuestion,
      options: [
        { id: 'a', text: 'One' },
        { id: 'a', text: 'Two' },
        { id: 'c', text: 'Three' },
      ],
    };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.message.includes('Duplicate option ID'))).toBe(true);
  });

  it('should warn for invalid difficulty', () => {
    const q = { ...validQuestion, difficulty: 'super-hard' };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'difficulty' && e.severity === 'warning')).toBe(true);
  });

  it('should warn for invalid sourceType', () => {
    const q = { ...validQuestion, sourceType: 'random' };
    const errors = validateQuestion(q, 0);
    expect(errors.some(e => e.field === 'sourceType' && e.severity === 'warning')).toBe(true);
  });

  it('should accept valid optional fields', () => {
    const q = {
      ...validQuestion,
      week: 1,
      topic: 'Basics',
      difficulty: 'easy',
      sourceType: 'pyq',
      marks: 2,
      negativeMarks: 0.5,
      tags: ['math'],
    };
    const errors = validateQuestion(q, 0);
    expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('should handle null input', () => {
    const errors = validateQuestion(null, 0);
    expect(errors.some(e => e.severity === 'error')).toBe(true);
  });
});

describe('validateQuestions', () => {
  const q1 = {
    id: 'Q1', courseId: 'c1', courseName: 'C1',
    questionText: 'Q?', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
    correctOption: 'a', explanation: 'Exp',
  };
  const q2 = { ...q1, id: 'Q2' };

  it('should detect duplicate question IDs', () => {
    const result = validateQuestions([q1, { ...q1 }]);
    expect(result.stats.duplicateIds).toBe(1);
    expect(result.valid).toBe(false);
  });

  it('should report stats correctly', () => {
    const result = validateQuestions([q1, q2]);
    expect(result.stats.totalQuestions).toBe(2);
    expect(result.stats.validQuestions).toBe(2);
    expect(result.stats.invalidQuestions).toBe(0);
    expect(result.valid).toBe(true);
  });

  it('should handle empty array', () => {
    const result = validateQuestions([]);
    expect(result.valid).toBe(true);
    expect(result.stats.totalQuestions).toBe(0);
  });
});

describe('validateManifest', () => {
  it('should pass for valid manifest', () => {
    const manifest = {
      version: '1.0.0',
      lastUpdated: '2024-01-01',
      totalQuestions: 10,
      courses: [{
        id: 'c1', name: 'Course 1', questionFile: 'courses/c1.json',
      }],
    };
    const errors = validateManifest(manifest);
    expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('should fail when version is missing', () => {
    const errors = validateManifest({ courses: [] });
    expect(errors.some(e => e.field === 'version')).toBe(true);
  });

  it('should detect duplicate course IDs', () => {
    const manifest = {
      version: '1.0', lastUpdated: 'x', totalQuestions: 0,
      courses: [
        { id: 'c1', name: 'A', questionFile: 'a.json' },
        { id: 'c1', name: 'B', questionFile: 'b.json' },
      ],
    };
    const errors = validateManifest(manifest);
    expect(errors.some(e => e.message.includes('Duplicate course ID'))).toBe(true);
  });

  it('should handle null input', () => {
    const errors = validateManifest(null);
    expect(errors.some(e => e.severity === 'error')).toBe(true);
  });
});
