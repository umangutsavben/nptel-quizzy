import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '1m', target: 3000 },
    { duration: '2m', target: 3000 },
    { duration: '30s', target: 5000 },
    { duration: '1m', target: 5000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
    'http_req_duration{type:html}': ['p(95)<200'],
    'http_req_duration{type:manifest}': ['p(95)<200'],
    'http_req_duration{type:course}': ['p(95)<300'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5173';

export default function () {
  group('Homepage Load', function () {
    const res = http.get(`${BASE_URL}/`, { tags: { type: 'html' } });
    check(res, { 'home page status is 200': (r) => r.status === 200 });
  });

  group('Manifest Load', function () {
    const res = http.get(`${BASE_URL}/question-bank/manifest.json`, { tags: { type: 'manifest' } });
    check(res, {
      'manifest status is 200': (r) => r.status === 200,
      'manifest is valid json': (r) => r.json('version') !== undefined,
    });
  });

  group('Course Load - Psychology', function () {
    const res = http.get(`${BASE_URL}/question-bank/courses/psy-stress-health.json`, { tags: { type: 'course' } });
    check(res, {
      'psy course status is 200': (r) => r.status === 200,
      'psy course loaded': (r) => r.json().length > 0,
    });
  });

  group('Course Load - Public Speaking', function () {
    const res = http.get(`${BASE_URL}/question-bank/courses/public-speaking.json`, { tags: { type: 'course' } });
    check(res, {
      'ps course status is 200': (r) => r.status === 200,
      'ps course loaded': (r) => r.json().length > 0,
    });
  });

  // Simulate think time. Since it's a static site, there is no server execution latency during quiz taking.
  sleep(3);
}
