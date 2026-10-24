import json

manifest_path = "question-bank/manifest.json"
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

with open("question-bank/courses/public-speaking.json", "r", encoding="utf-8") as f:
    ps_questions = json.load(f)

# Build course meta
weeks_dict = {}
for q in ps_questions:
    w = q["week"]
    if w not in weeks_dict:
        weeks_dict[w] = 0
    weeks_dict[w] += 1

weeks_meta = [{"week": w, "title": f"Assignment {w}", "questionCount": weeks_dict[w]} for w in sorted(weeks_dict.keys())]

new_course = {
  "id": "public-speaking",
  "name": "Public Speaking",
  "description": "Master your public speaking skills.",
  "instructor": "SWAYAM",
  "totalQuestions": len(ps_questions),
  "pyqCount": 0,
  "weeklyQuizCount": len(weeks_meta),
  "weeks": weeks_meta,
  "tags": ["public-speaking", "communication"],
  "questionFile": "courses/public-speaking.json"
}

# Add or update course
existing = next((c for c in manifest["courses"] if c["id"] == "public-speaking"), None)
if existing:
    manifest["courses"].remove(existing)
manifest["courses"].append(new_course)

manifest["totalQuestions"] = sum(c["totalQuestions"] for c in manifest["courses"])

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print("Manifest updated successfully.")
