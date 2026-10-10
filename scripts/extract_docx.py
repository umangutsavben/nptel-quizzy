import xml.etree.ElementTree as ET

# Parse the document.xml
tree = ET.parse('/tmp/nptel_docx/word/document.xml')
root = tree.getroot()

# Namespaces in docx
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

with open('extracted_text.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(text))

print(f"Extracted {len(text)} lines.")
