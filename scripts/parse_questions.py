import json
import re

with open("extracted_text.txt", "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]

# Load existing questions
db_path = "question-bank/courses/psy-stress-health.json"
with open(db_path, "r", encoding="utf-8") as f:
    existing_data = json.load(f)

# Filter out previously parsed questions (Q100 and above)
existing_data = [q for q in existing_data if not re.search(r'Q1\d{2}$', q["id"])]
existing_ids = set(q["id"] for q in existing_data)

parsed_questions = []

current_week = None
current_topic = None

i = 0
while i < len(lines):
    line = lines[i]
    
    # Check for Week
    m_week = re.match(r'^Week\s+(\d+)\s*:', line)
    if m_week:
        current_week = int(m_week.group(1))
        # Next line is usually the topic, but it could be Q1
        i += 1
        if i < len(lines):
            topic_line = lines[i]
            if re.match(r'^Q\d+\.\s+', topic_line):
                # It's a question, don't skip and set topic to General
                current_topic = "General"
                continue
            elif "–" in topic_line:
                current_topic = topic_line.split("–")[-1].strip()
            elif "-" in topic_line:
                current_topic = topic_line.split("-")[-1].strip()
            else:
                current_topic = topic_line
        i += 1
        continue
    
    # Check for Question
    m_q = re.match(r'^Q\d+\.\s+(.*)', line)
    if m_q:
        q_text = m_q.group(1)
        options = []
        correct_opt = None
        
        i += 1
        # Read options and correct answer
        while i < len(lines) and not re.match(r'^Q\d+\.\s+', lines[i]) and not re.match(r'^Week\s+\d+\s*:', lines[i]):
            opt_line = lines[i]
            
            # Check for correct answer
            m_ans = re.match(r'^Correct Answer:\s+([A-D])\.\s+', opt_line)
            if m_ans:
                correct_opt = m_ans.group(1).lower()
                i += 1
                continue
                
            # Check for option
            m_opt = re.match(r'^([A-D])\.\s+(.*)', opt_line)
            if m_opt:
                opt_id = m_opt.group(1).lower()
                opt_text = m_opt.group(2).strip()
                options.append({"id": opt_id, "text": opt_text})
            else:
                # Might be multi-line question text or option text
                # If we haven't seen any options yet, append to question text
                if not options and not correct_opt:
                    q_text += " " + opt_line
                elif options and not correct_opt:
                    # Append to last option
                    options[-1]["text"] += " " + opt_line
            
            i += 1
            
        if current_week is not None and len(options) >= 2 and correct_opt:
            q_idx = len([q for q in parsed_questions if q.get("week") == current_week]) + 1
            
            # generate unique ID
            base_id = f"PSY-W{current_week:02d}-Q{q_idx+100:03d}"
            while base_id in existing_ids:
                q_idx += 1
                base_id = f"PSY-W{current_week:02d}-Q{q_idx+100:03d}"
            
            existing_ids.add(base_id)
            
            new_q = {
                "id": base_id,
                "courseId": "psy-stress-health",
                "courseName": "Psychology of Stress, Health and Well-Being",
                "week": current_week,
                "topic": current_topic if current_topic else "General",
                "questionText": q_text,
                "options": options,
                "correctOption": correct_opt,
                "sourceType": "weekly_quiz"
            }
            parsed_questions.append(new_q)
            
        continue
    
    i += 1

print(f"Parsed {len(parsed_questions)} questions from docx.")

# Append to existing
existing_data.extend(parsed_questions)

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(existing_data, f, indent=2)

print(f"Total questions in DB: {len(existing_data)}")

# Count per week
from collections import Counter
counts = Counter(q.get("week") for q in parsed_questions)
for w in sorted(counts.keys()):
    print(f"Week {w}: {counts[w]} questions")

