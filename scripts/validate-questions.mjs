/**
 * Question Bank Validation Script
 *
 * Validates all question files against the schema.
 * Usage: node scripts/validate-questions.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// We inline validation logic here to avoid build dependency
function validateQuestion(q, index) {
  const errors = [];
  const id = typeof q?.id === 'string' ? q.id : `[index:${index}]`;

  if (!q || typeof q !== 'object') {
    errors.push({ questionId: id, field: `[${index}]`, message: 'Not an object', severity: 'error' });
    return errors;
  }

  const requiredStrings = ['id', 'courseId', 'courseName', 'questionText', 'correctOption', 'explanation'];
  for (const field of requiredStrings) {
    if (typeof q[field] !== 'string' || q[field].trim() === '') {
      errors.push({ questionId: id, field, message: `Required field missing or empty`, severity: 'error' });
    }
  }

  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push({ questionId: id, field: 'options', message: 'Must have at least 2 options', severity: 'error' });
  } else {
    const optionIds = new Set();
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      if (!opt || typeof opt.id !== 'string') {
        errors.push({ questionId: id, field: `options[${i}].id`, message: 'Missing option ID', severity: 'error' });
      } else {
        if (optionIds.has(opt.id)) {
          errors.push({ questionId: id, field: `options[${i}].id`, message: `Duplicate option ID: ${opt.id}`, severity: 'error' });
        }
        optionIds.add(opt.id);
      }
      if (typeof opt.text !== 'string' || opt.text.trim() === '') {
        errors.push({ questionId: id, field: `options[${i}].text`, message: 'Missing option text', severity: 'error' });
      }
    }
    if (typeof q.correctOption === 'string' && !optionIds.has(q.correctOption)) {
      errors.push({ questionId: id, field: 'correctOption', message: `References invalid option: ${q.correctOption}`, severity: 'error' });
    }
  }

  return errors;
}

// Load and validate manifest
console.log('🔍 Validating question bank...\n');

let manifest;
try {
  const manifestPath = resolve(rootDir, 'question-bank/manifest.json');
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  console.log(`✅ Manifest loaded: ${manifest.courses.length} course(s), v${manifest.version}`);
} catch (e) {
  console.error('❌ Failed to load manifest.json:', e.message);
  process.exit(1);
}

let totalErrors = 0;
let totalQuestions = 0;
let totalValid = 0;

for (const course of manifest.courses) {
  console.log(`\n📚 Course: ${course.name} (${course.id})`);
  console.log(`   File: ${course.questionFile}`);

  try {
    const filePath = resolve(rootDir, 'question-bank', course.questionFile);
    const questions = JSON.parse(readFileSync(filePath, 'utf-8'));

    if (!Array.isArray(questions)) {
      console.error(`   ❌ Question file is not an array`);
      totalErrors++;
      continue;
    }

    console.log(`   Questions found: ${questions.length}`);
    totalQuestions += questions.length;

    // Check for duplicate IDs
    const seenIds = new Set();
    let courseErrors = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const errors = validateQuestion(q, i);

      if (typeof q?.id === 'string') {
        if (seenIds.has(q.id)) {
          errors.push({ questionId: q.id, field: 'id', message: 'Duplicate question ID', severity: 'error' });
        }
        seenIds.add(q.id);
      }

      if (errors.length > 0) {
        courseErrors += errors.length;
        for (const err of errors) {
          console.error(`   ❌ [${err.questionId}] ${err.field}: ${err.message}`);
        }
      } else {
        totalValid++;
      }
    }

    totalErrors += courseErrors;

    if (courseErrors === 0) {
      console.log(`   ✅ All ${questions.length} questions valid`);
    } else {
      console.log(`   ⚠️  ${courseErrors} error(s) found`);
    }

    // Stats
    const weekly = questions.filter(q => q.sourceType === 'weekly_quiz').length;
    const pyq = questions.filter(q => q.sourceType === 'pyq').length;
    const weeks = new Set(questions.filter(q => q.week).map(q => q.week)).size;
    console.log(`   📊 Weekly: ${weekly} | PYQ: ${pyq} | Weeks: ${weeks}`);

    // Verify manifest counts
    if (course.totalQuestions !== questions.length) {
      console.warn(`   ⚠️  Manifest says ${course.totalQuestions} questions but file has ${questions.length}`);
    }

  } catch (e) {
    console.error(`   ❌ Failed to load: ${e.message}`);
    totalErrors++;
  }
}

console.log('\n' + '═'.repeat(50));
console.log(`Total questions: ${totalQuestions}`);
console.log(`Valid questions: ${totalValid}`);
console.log(`Total errors: ${totalErrors}`);
console.log('═'.repeat(50));

if (totalErrors > 0) {
  console.log('\n❌ Validation FAILED');
  process.exit(1);
} else {
  console.log('\n✅ Validation PASSED');
  process.exit(0);
}
