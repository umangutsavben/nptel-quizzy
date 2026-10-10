import json

db_path = "question-bank/courses/psy-stress-health.json"
with open(db_path, "r", encoding="utf-8") as f:
    questions = json.load(f)

# The exact 30 dummy IDs identified earlier
dummy_ids = [
    'PSY-W01-Q001', 'PSY-W01-Q002', 'PSY-W01-Q003', 'PSY-W01-Q004', 'PSY-W01-Q005',
    'PSY-W02-Q001', 'PSY-W02-Q002', 'PSY-W02-Q003', 'PSY-W02-Q004', 'PSY-W02-Q005',
    'PSY-W03-Q001', 'PSY-W03-Q002', 'PSY-W03-Q003', 'PSY-W03-Q004', 'PSY-W03-Q005',
    'PSY-W04-Q001', 'PSY-W04-Q002', 'PSY-W04-Q003', 'PSY-W04-Q004', 'PSY-W04-Q005',
    'PSY-PYQ-001', 'PSY-PYQ-002', 'PSY-PYQ-003', 'PSY-PYQ-004', 'PSY-PYQ-005',
    'PSY-PYQ-006', 'PSY-PYQ-007', 'PSY-PYQ-008', 'PSY-PYQ-009', 'PSY-PYQ-010'
]

filtered_questions = [q for q in questions if q['id'] not in dummy_ids]

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(filtered_questions, f, indent=2)

print(f"Removed {len(questions) - len(filtered_questions)} questions. {len(filtered_questions)} remain.")
