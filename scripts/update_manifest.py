import json

with open("question-bank/courses/psy-stress-health.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

pyq_count = len([q for q in questions if q.get("sourceType") == "pyq"])

weeks_dict = {}
for q in questions:
    if q.get("sourceType") == "weekly_quiz" and "week" in q:
        w = q["week"]
        if w not in weeks_dict:
            weeks_dict[w] = {"title": q.get("topic", "General"), "count": 0}
        weeks_dict[w]["count"] += 1

weekly_quiz_count = len(weeks_dict)

weeks = []
for w in sorted(weeks_dict.keys()):
    weeks.append({
        "week": w,
        "title": weeks_dict[w]["title"],
        "questionCount": weeks_dict[w]["count"]
    })

total_questions = len(questions)

with open("question-bank/manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

manifest["totalQuestions"] = total_questions
for c in manifest["courses"]:
    if c["id"] == "psy-stress-health":
        c["totalQuestions"] = total_questions
        c["pyqCount"] = pyq_count
        c["weeklyQuizCount"] = weekly_quiz_count
        c["weeks"] = weeks

with open("question-bank/manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print("Manifest updated successfully.")
