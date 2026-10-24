import json
import re
import os

def parse_stress_pyqs():
    input_file = "nptel_pyq_stress.txt"
    course_json = "question-bank/courses/psy-stress-health.json"
    manifest_file = "question-bank/manifest.json"

    with open(input_file, "r", encoding="utf-8") as f:
        text = f.read()

    week_topics = {
        1: "Stress and Coping",
        2: "Stress, Health and Immunity",
        3: "Posttraumatic Growth, Coping and Hardiness",
        4: "Coping Strategies and Defense Mechanisms",
        5: "Stress Management and Mindfulness",
        6: "Mental Health and Flourishing",
        7: "Happiness and Subjective Well-Being",
        8: "Hedonic Adaptation and Sustainable Happiness",
        9: "EDM and EBM Machining",
        10: "VIA Classification, Character Strengths and Flow",
        11: "Self-Actualization and Self-Determination Theory",
        12: "Meaning in Life and Intrinsic Goals"
    }

    # Split by weeks
    week_blocks = re.split(r'={20,}\s*\n\s*WEEK\s+(\d+)\s*\n\s*={20,}', text)

    pyq_questions = []
    q_counter = 0

    for i in range(1, len(week_blocks), 2):
        week_num = int(week_blocks[i])
        block = week_blocks[i+1]
        
        q_splits = re.split(r'\n(?=\s*\d+\)\s*)', '\n' + block)
        
        for qs in q_splits:
            qs = qs.strip()
            if not qs or not re.match(r'^\d+\)', qs):
                continue
            
            lines = qs.split('\n')
            q_line = lines[0]
            m_q = re.match(r'^(\d+)\)\s*(.*)', q_line)
            q_num = int(m_q.group(1))
            q_text_init = m_q.group(2).strip()
            
            opt_start_idx = None
            for idx, line in enumerate(lines[1:], 1):
                if re.search(r'Options(\s*\(.*?\))?:', line, re.IGNORECASE):
                    opt_start_idx = idx
                    break
            
            correct_idx = None
            correct_text = None
            for idx, line in enumerate(lines[1:], 1):
                m_c = re.search(r'CORRECT(?:\s*\(.*?\))?:\s*(.*)', line, re.IGNORECASE)
                if m_c:
                    correct_idx = idx
                    correct_text = m_c.group(1).strip()
                    break
            
            # Build question text
            q_lines = [q_text_init]
            limit = opt_start_idx if opt_start_idx else (correct_idx if correct_idx else len(lines))
            for l in lines[1:limit]:
                if l.strip():
                    q_lines.append(l.strip())
            q_text = ' '.join(q_lines)
            
            # Build options
            raw_options = []
            if opt_start_idx and correct_idx and correct_idx > opt_start_idx:
                for l in lines[opt_start_idx+1:correct_idx]:
                    stripped = l.strip()
                    if stripped.startswith('-'):
                        raw_options.append(stripped.lstrip('-').strip())
                    elif stripped and raw_options:
                        raw_options[-1] += ' ' + stripped
            
            parsed_options = []
            for o_idx, opt_str in enumerate(raw_options):
                parsed_options.append({
                    'id': chr(ord('a') + o_idx),
                    'text': opt_str
                })
            
            # Match correct option
            correct_opt_id = None
            for opt in parsed_options:
                if opt['text'].strip().lower() == correct_text.strip().lower():
                    correct_opt_id = opt['id']
                    break
            
            explanation = 'Explanation not provided in source document.'
            if not correct_opt_id:
                if 'AND' in correct_text:
                    explanation = f'Source format is checkbox (MSQ). Marked options: {correct_text}'
                    correct_opt_id = None
                else:
                    for opt in parsed_options:
                        if correct_text.lower() in opt['text'].lower() or opt['text'].lower() in correct_text.lower():
                            correct_opt_id = opt['id']
                            break
            
            q_counter += 1
            q_id = f'PSY-PYQ-{q_counter:03d}'
            
            pyq_questions.append({
                'id': q_id,
                'courseId': 'psy-stress-health',
                'courseName': 'Psychology of Stress, Health and Well-Being',
                'week': week_num,
                'topic': week_topics.get(week_num, 'General'),
                'questionText': q_text,
                'options': parsed_options,
                'correctOption': correct_opt_id,
                'explanation': explanation,
                'sourceType': 'pyq'
            })

    print(f"Parsed {len(pyq_questions)} PYQ questions.")

    # Load existing questions in psy-stress-health.json
    with open(course_json, "r", encoding="utf-8") as f:
        existing_data = json.load(f)

    # Keep only weekly_quiz questions (filter out any previously added pyqs to avoid duplicates if re-run)
    weekly_questions = [q for q in existing_data if q.get("sourceType") == "weekly_quiz"]
    print(f"Existing weekly quiz questions count: {len(weekly_questions)}")

    combined_questions = weekly_questions + pyq_questions
    print(f"Total combined questions for psy-stress-health: {len(combined_questions)}")

    # Write to question-bank/courses/psy-stress-health.json
    with open(course_json, "w", encoding="utf-8") as f:
        json.dump(combined_questions, f, indent=2)

    # Also sync to apps/web/public/question-bank/courses/psy-stress-health.json
    web_course_json = "apps/web/public/question-bank/courses/psy-stress-health.json"
    if os.path.exists(os.path.dirname(web_course_json)):
        with open(web_course_json, "w", encoding="utf-8") as f:
            json.dump(combined_questions, f, indent=2)

    # Update manifest.json
    with open(manifest_file, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    for c in manifest["courses"]:
        if c["id"] == "psy-stress-health":
            c["totalQuestions"] = len(combined_questions)
            c["pyqCount"] = len(pyq_questions)
            c["weeklyQuizCount"] = len([w for w in c.get("weeks", [])])

    manifest["totalQuestions"] = sum(c["totalQuestions"] for c in manifest["courses"])

    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    web_manifest = "apps/web/public/question-bank/manifest.json"
    if os.path.exists(os.path.dirname(web_manifest)):
        with open(web_manifest, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

    print("Successfully updated course json and manifest files.")

if __name__ == "__main__":
    parse_stress_pyqs()
