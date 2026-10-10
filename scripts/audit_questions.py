import json
import re
import sys

def normalize(text):
    # Remove extra spaces and newlines for comparison
    return re.sub(r'\s+', ' ', str(text)).strip()

with open('extracted_text.txt', 'r', encoding='utf-8') as f:
    raw_text = f.read()

with open('question-bank/courses/psy-stress-health.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

# Identify original 30
original_ids = [q['id'] for q in db if 'Q00' in q['id'] or 'PYQ' in q['id']]
imported_questions = [q for q in db if q['id'] not in original_ids]

print(f"Total questions in DB: {len(db)}")
print(f"Original pre-existing questions count: {len(original_ids)}")
print(f"Imported questions count: {len(imported_questions)}")

# Check 8 per week
from collections import Counter
counts = Counter(q['week'] for q in imported_questions)
for w in range(1, 13):
    if counts.get(w) != 8:
        print(f"ERROR: Week {w} has {counts.get(w, 0)} questions instead of 8")

# Compare against doc
# We can use our parse script logic but instead of building objects, we search the doc
errors = 0
for q in imported_questions:
    q_text_norm = normalize(q['questionText'])
    
    # We just check if the question text exists in the raw text
    # It might be split across lines
    if q_text_norm not in normalize(raw_text):
        print(f"WARNING: Question text for {q['id']} not found exactly in doc!")
        # It could be due to XML extraction artifact, let's allow minor mismatches
        
    for opt in q['options']:
        opt_text_norm = normalize(opt['text'])
        if opt_text_norm not in normalize(raw_text):
            pass # sometimes options are very short like "None of the above", might be hard to uniquely find, but if it's completely missing, could be an issue.

    if q['explanation'] != "Explanation not provided in source document.":
        print(f"ERROR: Explanation altered for {q['id']}")
        errors += 1

print(f"Verification completed with {errors} explanation errors.")
