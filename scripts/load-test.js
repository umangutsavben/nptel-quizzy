import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Load Testing Plan for NPTEL Quiz Prep
 * Target: 3,000 concurrent users (Stretch: 5,000)
 * 
 * To run locally:
 * 1. Install k6 (https://k6.io/)
 * 2. Run: k6 run scripts/load-test.js
 */

export const options = {
  stages: [
    { duration: '30s', target: 500 }, // Ramp up to 500 users
    { duration: '1m', target: 3000 }, // Ramp up to target 3,000 users
    { duration: '2m', target: 3000 }, // Stay at 3,000 users
    { duration: '30s', target: 5000 }, // Stretch to 5,000 users
    { duration: '1m', target: 5000 }, // Stay at 5,000 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // 95% of requests must complete within 200ms (we are testing static assets)
    http_req_duration: ['p(95)<200'],
    // Less than 1% of requests should fail
    http_req_failed: ['rate<0.01'],
  },
};

// Target base URL (update this to the deployed URL for real testing)
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5173';

export default function () {
  // 1. User visits the home page
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'home page status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 2. User loads the question bank manifest (lazy loaded)
  res = http.get(`${BASE_URL}/question-bank/manifest.json`);
  check(res, {
    'manifest status is 200': (r) => r.status === 200,
    'manifest is valid json': (r) => r.json('version') !== undefined,
  });
  sleep(1);

  // 3. User selects a course and loads its questions
  res = http.get(`${BASE_URL}/question-bank/courses/psy-stress-health.json`);
  check(res, {
    'course questions status is 200': (r) => r.status === 200,
    'course questions loaded': (r) => r.json().length > 0,
  });
  
  // Simulate time spent taking the quiz (during this time no server requests are made
  // because the app is fully static and runs in-memory on the client).
  sleep(3);
}
