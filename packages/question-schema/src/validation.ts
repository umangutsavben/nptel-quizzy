/**
 * Question Bank Validation
 *
 * Validates question data against the schema with detailed error reporting.
 */

import type { Question, QuestionBankManifest, CourseMeta } from './types.js';

export interface ValidationError {
  questionId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: {
    totalQuestions: number;
    validQuestions: number;
    invalidQuestions: number;
    courses: number;
    duplicateIds: number;
  };
}

/**
 * Validate a single question object.
 */
export function validateQuestion(q: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const qObj = q as Record<string, unknown>;

  if (!qObj || typeof qObj !== 'object') {
    errors.push({ field: `[${index}]`, message: 'Question is not an object', severity: 'error' });
    return errors;
  }

  const id = typeof qObj.id === 'string' ? qObj.id : `[index:${index}]`;

  // Required string fields
  const requiredStrings: Array<[string, string]> = [
    ['id', 'Question ID'],
    ['courseId', 'Course ID'],
    ['courseName', 'Course Name'],
    ['questionText', 'Question Text'],
    ['correctOption', 'Correct Option'],
    ['explanation', 'Explanation'],
  ];

  for (const [field, label] of requiredStrings) {
    if (typeof qObj[field] !== 'string' || (qObj[field] as string).trim() === '') {
      errors.push({
        questionId: id,
        field,
        message: `${label} is required and must be a non-empty string`,
        severity: 'error',
      });
    }
  }

  // Options validation
  if (!Array.isArray(qObj.options)) {
    errors.push({
      questionId: id,
      field: 'options',
      message: 'Options must be an array',
      severity: 'error',
    });
  } else {
    if (qObj.options.length < 2) {
      errors.push({
        questionId: id,
        field: 'options',
        message: 'Question must have at least 2 options',
        severity: 'error',
      });
    }

    const optionIds = new Set<string>();
    for (let i = 0; i < qObj.options.length; i++) {
      const opt = qObj.options[i] as Record<string, unknown>;
      if (!opt || typeof opt !== 'object') {
        errors.push({
          questionId: id,
          field: `options[${i}]`,
          message: 'Option must be an object',
          severity: 'error',
        });
        continue;
      }
      if (typeof opt.id !== 'string' || opt.id.trim() === '') {
        errors.push({
          questionId: id,
          field: `options[${i}].id`,
          message: 'Option ID is required',
          severity: 'error',
        });
      } else {
        if (optionIds.has(opt.id)) {
          errors.push({
            questionId: id,
            field: `options[${i}].id`,
            message: `Duplicate option ID: ${opt.id}`,
            severity: 'error',
          });
        }
        optionIds.add(opt.id);
      }
      if (typeof opt.text !== 'string' || opt.text.trim() === '') {
        errors.push({
          questionId: id,
          field: `options[${i}].text`,
          message: 'Option text is required',
          severity: 'error',
        });
      }
    }

    // Validate correctOption references a valid option
    if (typeof qObj.correctOption === 'string' && optionIds.size > 0) {
      if (!optionIds.has(qObj.correctOption)) {
        errors.push({
          questionId: id,
          field: 'correctOption',
          message: `Correct option "${qObj.correctOption}" does not match any option ID. Valid IDs: ${[...optionIds].join(', ')}`,
          severity: 'error',
        });
      }
    }
  }

  // Optional field validations
  if (qObj.week !== undefined && (typeof qObj.week !== 'number' || qObj.week < 1)) {
    errors.push({
      questionId: id,
      field: 'week',
      message: 'Week must be a positive number',
      severity: 'error',
    });
  }

  if (qObj.difficulty !== undefined) {
    if (!['easy', 'medium', 'hard'].includes(qObj.difficulty as string)) {
      errors.push({
        questionId: id,
        field: 'difficulty',
        message: 'Difficulty must be "easy", "medium", or "hard"',
        severity: 'warning',
      });
    }
  }

  if (qObj.sourceType !== undefined) {
    if (!['pyq', 'weekly_quiz', 'practice'].includes(qObj.sourceType as string)) {
      errors.push({
        questionId: id,
        field: 'sourceType',
        message: 'Source type must be "pyq", "weekly_quiz", or "practice"',
        severity: 'warning',
      });
    }
  }

  if (qObj.marks !== undefined && (typeof qObj.marks !== 'number' || qObj.marks < 0)) {
    errors.push({
      questionId: id,
      field: 'marks',
      message: 'Marks must be a non-negative number',
      severity: 'warning',
    });
  }

  if (qObj.negativeMarks !== undefined && (typeof qObj.negativeMarks !== 'number' || qObj.negativeMarks < 0)) {
    errors.push({
      questionId: id,
      field: 'negativeMarks',
      message: 'Negative marks must be a non-negative number',
      severity: 'warning',
    });
  }

  return errors;
}

/**
 * Validate an array of questions, checking for duplicates and cross-referencing.
 */
export function validateQuestions(questions: unknown[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const seenIds = new Map<string, number>();
  let validCount = 0;
  let invalidCount = 0;
  const courseIds = new Set<string>();
  let duplicateCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const errs = validateQuestion(questions[i], i);
    const questionErrors = errs.filter(e => e.severity === 'error');
    const questionWarnings = errs.filter(e => e.severity === 'warning');

    // Track duplicate IDs
    const qObj = questions[i] as Record<string, unknown>;
    if (typeof qObj?.id === 'string') {
      const prevIndex = seenIds.get(qObj.id);
      if (prevIndex !== undefined) {
        duplicateCount++;
        questionErrors.push({
          questionId: qObj.id,
          field: 'id',
          message: `Duplicate question ID. First seen at index ${prevIndex}`,
          severity: 'error',
        });
      } else {
        seenIds.set(qObj.id, i);
      }

      if (typeof qObj.courseId === 'string') {
        courseIds.add(qObj.courseId);
      }
    }

    allErrors.push(...questionErrors);
    allWarnings.push(...questionWarnings);

    if (questionErrors.length === 0) {
      validCount++;
    } else {
      invalidCount++;
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    stats: {
      totalQuestions: questions.length,
      validQuestions: validCount,
      invalidQuestions: invalidCount,
      courses: courseIds.size,
      duplicateIds: duplicateCount,
    },
  };
}

/**
 * Validate the question bank manifest.
 */
export function validateManifest(manifest: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const m = manifest as Record<string, unknown>;

  if (!m || typeof m !== 'object') {
    errors.push({ field: 'manifest', message: 'Manifest must be an object', severity: 'error' });
    return errors;
  }

  if (typeof m.version !== 'string') {
    errors.push({ field: 'version', message: 'Version is required', severity: 'error' });
  }

  if (typeof m.lastUpdated !== 'string') {
    errors.push({ field: 'lastUpdated', message: 'Last updated date is required', severity: 'error' });
  }

  if (typeof m.totalQuestions !== 'number') {
    errors.push({ field: 'totalQuestions', message: 'Total questions count is required', severity: 'error' });
  }

  if (!Array.isArray(m.courses)) {
    errors.push({ field: 'courses', message: 'Courses must be an array', severity: 'error' });
    return errors;
  }

  const courseIds = new Set<string>();
  for (let i = 0; i < m.courses.length; i++) {
    const course = m.courses[i] as Record<string, unknown>;
    if (!course || typeof course !== 'object') {
      errors.push({ field: `courses[${i}]`, message: 'Course must be an object', severity: 'error' });
      continue;
    }

    if (typeof course.id !== 'string' || course.id.trim() === '') {
      errors.push({ field: `courses[${i}].id`, message: 'Course ID is required', severity: 'error' });
    } else if (courseIds.has(course.id)) {
      errors.push({ field: `courses[${i}].id`, message: `Duplicate course ID: ${course.id}`, severity: 'error' });
    } else {
      courseIds.add(course.id);
    }

    if (typeof course.name !== 'string' || course.name.trim() === '') {
      errors.push({ field: `courses[${i}].name`, message: 'Course name is required', severity: 'error' });
    }

    if (typeof course.questionFile !== 'string' || course.questionFile.trim() === '') {
      errors.push({ field: `courses[${i}].questionFile`, message: 'Question file path is required', severity: 'error' });
    }
  }

  return errors;
}
