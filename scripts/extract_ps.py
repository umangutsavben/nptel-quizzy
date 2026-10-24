import xml.etree.ElementTree as ET

tree = ET.parse('/tmp/ps_docx/word/document.xml')
root = tree.getroot()
namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

text = []
for p in root.findall('.//w:p', namespaces):
    para_text = []
    for t in p.findall('.//w:t', namespaces):
        if t.text:
            para_text.append(t.text)
    joined_text = "".join(para_text).strip()
    if joined_text:
        text.append(joined_text)

with open('public_speaking_text.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(text))
print(f"Extracted {len(text)} lines to public_speaking_text.txt.")
