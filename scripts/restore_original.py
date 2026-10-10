import json

# Load existing questions
db_path = "question-bank/courses/psy-stress-health.json"
with open(db_path, "r", encoding="utf-8") as f:
    existing_data = json.load(f)

# Keep only those with Q00 or PYQ
original_data = [q for q in existing_data if 'Q00' in q['id'] or 'PYQ' in q['id']]

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(original_data, f, indent=2)

print(f"Restored to {len(original_data)} original questions.")
