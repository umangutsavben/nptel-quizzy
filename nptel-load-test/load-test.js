
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://nptel-quizzy.pages.dev';

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 1000 },
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/question-bank/manifest.json`],
    [
      'GET',
      `${BASE_URL}/question-bank/courses/psy-stress-health.json`,
    ],
  ]);

  check(responses[0], {
    'homepage returns 200': (r) => r.status === 200,
  });

  check(responses[1], {
    'manifest returns 200': (r) => r.status === 200,
  });

  check(responses[2], {
    'course questions return 200': (r) => r.status === 200,
  });

  sleep(1);
}




