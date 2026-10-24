import json
import re

with open('public_speaking_text.txt', 'r', encoding='utf-8') as f:
    lines = [line.strip() for line in f if line.strip()]

questions = []
current_week = None
q_idx = 0

i = 0
while i < len(lines):
    line = lines[i]
    
    # Check for Week
    m_week = re.match(r'^Week\s+(\d+)', line, re.IGNORECASE)
    if m_week:
        current_week = int(m_week.group(1))
        i += 1
        continue
    
    # Check for Question
    m_q = re.match(r'^(\d+)\.\s+(.*)', line)
    if m_q and current_week:
        q_text = m_q.group(2)
        options = []
        correct_option_text = None
        i += 1
        
        # Collect options until 'Accepted answer:' or next question or Week
        while i < len(lines):
            nxt_line = lines[i]
            if re.match(r'^Accepted answer:', nxt_line, re.IGNORECASE):
                correct_option_text = nxt_line.split(":", 1)[1].strip()
                i += 1
                break
            if re.match(r'^Week\s+(\d+)', nxt_line, re.IGNORECASE) or re.match(r'^(\d+)\.\s+', nxt_line):
                break
            options.append(nxt_line)
            i += 1
            
        q_idx += 1
        q_id = f"PUB-W{current_week:02d}-Q{q_idx:03d}"
        
        # Build options
        parsed_options = []
        correct_option_id = None
        
        # Sometimes accepted answer might just be missing (Week 12)
        # Or correct_option_text might match exactly
        
        for idx, opt_text in enumerate(options):
            opt_id = chr(97 + idx) # 'a', 'b', 'c', 'd'
            parsed_options.append({"id": opt_id, "text": opt_text})
            if correct_option_text and opt_text.lower() == correct_option_text.lower():
                correct_option_id = opt_id
        
        # Fallback matching for correct answer
        if correct_option_text and not correct_option_id:
            for idx, opt_text in enumerate(options):
                if correct_option_text.lower() in opt_text.lower() or opt_text.lower() in correct_option_text.lower():
                    correct_option_id = chr(97 + idx)
                    break
                    
        # Construct question object
        questions.append({
            "id": q_id,
            "courseId": "public-speaking",
            "courseName": "Public Speaking",
            "week": current_week,
            "topic": f"Assignment {current_week}",
            "questionText": q_text,
            "options": parsed_options,
            "correctOption": correct_option_id,
            "explanation": "Explanation not provided in source document.",
            "sourceType": "weekly_quiz"
        })
        continue
    
    i += 1

# Validation to ensure exactly 120 questions, 10 per week
from collections import Counter
c = Counter(q["week"] for q in questions)
print("Week counts:", c)
print("Total questions:", len(questions))

unverified = sum(1 for q in questions if q["correctOption"] is None)
print("Unverified questions (null correctOption):", unverified)

with open('question-bank/courses/public-speaking.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2)

print("Saved to question-bank/courses/public-speaking.json")
