import json

db_path = "question-bank/courses/psy-stress-health.json"
with open(db_path, "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if not q.get("explanation") or q.get("explanation").strip() == "":
        q["explanation"] = "Explanation not provided in source document."

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2)

print("Explanations added successfully.")
