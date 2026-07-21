#!/usr/bin/env python3
"""
Convert AD_SCRIPTS.md to a professionally formatted DOCX document.
Preserves the course structure with modules, lessons, tables, visual cues, and formatted dialogue.
"""

import re
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def set_run_font(run, size=None, bold=None, italic=None, color=None):
    """Helper to set run font properties if run exists."""
    if run is None:
        return
    if size:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.font.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)


def create_styled_doc():
    doc = Document()

    # ── Page margins ──
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # ── Styles ──
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x1a, 0x1a, 0x2e)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.line_spacing = 1.15

    # ── Course Title Page ──
    for _ in range(6):
        doc.add_paragraph()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run('🎬 Bootskills Platform')
    run.bold = True
    run.font.size = Pt(36)
    run.font.color.rgb = RGBColor(0xbc, 0x92, 0x29)  # Gold

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run('Ad Video Creator Course')
    run.bold = True
    run.font.size = Pt(28)
    run.font.color.rgb = RGBColor(0x1a, 0x1a, 0x2e)

    doc.add_paragraph()

    desc = doc.add_paragraph()
    desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = desc.add_run('52 Ad Scripts  •  7 Modules  •  28 Minutes of Content')
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(0x66, 0x66, 0x80)

    desc2 = doc.add_paragraph()
    desc2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = desc2.add_run('Organized for On-Camera Spokesperson')
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor(0x88, 0x88, 0x99)

    doc.add_page_break()

    # ── Table of Contents ──
    doc.add_heading('Table of Contents', level=1)

    toc_modules = [
        ('Module 1', 'Platform-Wide Features', '5 lessons  •  ~3 min'),
        ('Module 2', 'Student Portal', '14 lessons  •  ~8.5 min'),
        ('Module 3', 'Trainer Portal', '5 lessons  •  ~3.5 min'),
        ('Module 4', 'Admin Portal', '9 lessons  •  ~6 min'),
        ('Module 5', 'Super Admin Portal', '7 lessons  •  ~4.5 min'),
        ('Module 6', 'Client Portal', '3 lessons  •  ~2 min'),
        ('Module 7', 'Quick Hits (15-Second Ads)', '9 lessons  •  ~2 min'),
    ]

    toc_table = doc.add_table(rows=len(toc_modules) + 1, cols=3)
    toc_table.style = 'Light Grid Accent 1'
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Header row
    headers = ['Module', 'Title', 'Overview']
    for i, hdr in enumerate(headers):
        cell = toc_table.rows[0].cells[i]
        cell.text = hdr
        for p in cell.paragraphs:
            p.runs[0].bold = True

    for i, (mod_num, mod_title, overview) in enumerate(toc_modules):
        row = toc_table.rows[i + 1]
        row.cells[0].text = mod_num
        row.cells[1].text = mod_title
        row.cells[2].text = overview

    doc.add_paragraph()

    # ── How to Use This Course ──
    doc.add_heading('How to Use This Course', level=2)

    howto = doc.add_table(rows=6, cols=2)
    howto.style = 'Light Grid Accent 1'
    howto.alignment = WD_TABLE_ALIGNMENT.CENTER

    howto_data = [
        ('Element', 'What To Do'),
        ('Modules', 'Film one module per recording session. Each module covers one user role.'),
        ('Lessons', 'Each lesson is a standalone video. Film them in order within a module.'),
        ('Duration', 'Full scripts (30-60s) for deep dives. Short clips (15s) for social media.'),
        ('Visuals', 'Each script tells you what to show on screen. Record your screen alongside your face.'),
        ('Key Terms', 'These appear as text overlays during editing.'),
    ]
    for i, (col1, col2) in enumerate(howto_data):
        row = howto.rows[i]
        row.cells[0].text = col1
        row.cells[1].text = col2
        for cell in row.cells:
            for p in cell.paragraphs:
                if p.runs and i == 0:
                    p.runs[0].bold = True

    doc.add_paragraph()

    doc.add_heading('Suggested Recording Order', level=3)
    order = [
        'Module 7 — Quick Hits (warm up with the shortest scripts)',
        'Module 1 — Platform Overview (set the stage)',
        'Module 2 — Student Portal (biggest audience)',
        'Module 3 — Trainer Portal',
        'Module 4 — Admin Portal',
        'Module 5 — Super Admin Portal',
        'Module 6 — Client Portal',
    ]
    for item in order:
        doc.add_paragraph(item, style='List Number')

    doc.add_page_break()
    return doc


def add_formatted_text(paragraph, text):
    """
    Add text with basic markdown formatting (**bold**, *italic*) to a DOCX paragraph.
    Returns the paragraph.
    """
    # Split on bold markers
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            content = part[2:-2]
            run = paragraph.add_run(content)
            run.bold = True
            run.font.size = Pt(11)
        elif part.startswith('*') and part.endswith('*') and len(part) > 1:
            content = part[1:-1]
            run = paragraph.add_run(content)
            run.font.italic = True
            run.font.size = Pt(11)
        else:
            run = paragraph.add_run(part)
            run.font.size = Pt(11)
    return paragraph


def parse_and_build_doc(doc):
    """Parse AD_SCRIPTS.md and build the DOCX content."""

    with open('AD_SCRIPTS.md', 'r') as f:
        lines = f.readlines()

    current_module = None
    current_lesson = None
    module_index = 0
    lesson_index = 0
    in_table = False
    in_visual_cues = False
    in_dialogue = False
    lesson_data = {}
    visual_lines = []
    dialogue_lines = []
    def flush_lesson():
        """Write the current lesson to the DOCX if we have data."""
        nonlocal current_lesson, lesson_data, visual_lines, dialogue_lines
        if current_lesson and lesson_data:
            lesson_data['Visual Cues'] = '\n'.join(visual_lines).strip()
            lesson_data['Dialogue'] = '\n'.join(dialogue_lines).strip()
            write_lesson(doc, current_lesson, lesson_data)
        current_lesson = None
        lesson_data = {}
        visual_lines = []
        dialogue_lines = []
        skip_lesson = False

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Module headings: ## Module N: Title
        module_match = re.match(r'^## (.+)$', line)
        if module_match:
            flush_lesson()
            current_module = module_match.group(1)
            module_index += 1
            lesson_index = 0
            in_table = False
            in_visual_cues = False
            in_dialogue = False
            doc.add_heading(current_module, level=1)
            # Skip module description lines (the italic text after module heading)
            while i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line.startswith('> **') or next_line.startswith('>'):
                    i += 1
                else:
                    break
            i += 1
            continue

        # Lesson headings: ### Lesson N.M — Title
        lesson_match = re.match(r'^### (.+)$', line)
        if lesson_match:
            flush_lesson()
            current_lesson = lesson_match.group(1)
            lesson_index += 1
            in_table = False
            in_visual_cues = False
            in_dialogue = False
            # Skip the inline info: | | | and |---|---|
            while i + 1 < len(lines) and (lines[i + 1].strip().startswith('| |') or lines[i + 1].strip().startswith('|--')):
                i += 1
            in_table = True
            i += 1
            continue

        # Table rows
        if in_table and stripped.startswith('|'):
            cells = [c.strip().rstrip(':').strip() for c in stripped.split('|') if c.strip()]
            if len(cells) >= 2:
                key = cells[0].replace('**', '').strip()
                value = cells[1].strip()
                if key == 'Script #':
                    lesson_data['Script'] = value
                elif key == 'Duration':
                    lesson_data['Duration'] = value
                elif key == 'Focus':
                    lesson_data['Focus'] = value
                elif key == 'Key Terms':
                    lesson_data['Key Terms'] = value
                elif key == 'Difficulty':
                    lesson_data['Difficulty'] = value
                elif key == 'Key Visual':
                    lesson_data['Key Visual'] = value
            i += 1
            continue
        elif in_table and not stripped.startswith('|'):
            in_table = False

        # Visual Cues section
        if stripped == '**Visual Cues:**':
            in_visual_cues = True
            in_dialogue = False
            i += 1
            continue

        if in_visual_cues:
            if stripped == '**Dialogue:**':
                in_visual_cues = False
                in_dialogue = True
                i += 1
                continue
            if stripped.startswith('- ') or stripped.startswith('* '):
                # Bullet item — clean up markdown link/arrow syntax
                cleaned = stripped[2:]
                cleaned = cleaned.replace('>', '→')
                cleaned = cleaned.replace('**', '')
                visual_lines.append('  •  ' + cleaned)
            elif stripped.startswith('**'):
                # Text overlay or bold label — keep it
                cleaned = stripped.replace('**', '')
                visual_lines.append('  ⬆  ' + cleaned)
            elif stripped:
                visual_lines.append(stripped)
            i += 1
            continue

        # Dialogue section
        if stripped == '**Dialogue:**':
            in_dialogue = True
            i += 1
            continue

        if in_dialogue:
            # End of dialogue is a "---" separator or next section
            if stripped == '---' or stripped.startswith('## ') or stripped.startswith('### '):
                in_dialogue = False
                continue
            # Clean blockquote markers
            cleaned = stripped
            if cleaned.startswith('> '):
                cleaned = cleaned[2:]
            elif cleaned == '>':
                cleaned = ''
            # Keep blank lines as paragraph separators
            dialogue_lines.append(cleaned)
            i += 1
            continue

        # Skip regular lines inside module/lesson that aren't parsed
        if current_lesson and not in_table and not in_visual_cues and not in_dialogue:
            if stripped == '---' or stripped == '':
                pass
            elif stripped.startswith('## '):
                pass  # Will be caught above
            elif lesson_match:
                pass  # Will be caught above

        i += 1

    # Flush last lesson
    flush_lesson()


def write_lesson(doc, lesson_title, data):
    """Write a formatted lesson entry including visual cues and dialogue."""

    # Determine if this is a quick hit (has Key Visual, no Focus/Duration)
    is_quick_hit = 'Key Visual' in data and 'Focus' not in data

    # Lesson heading
    h = doc.add_heading(lesson_title, level=2)
    # Add script number badge-like text
    script_num = data.get('Script', '')
    if is_quick_hit:
        run = h.add_run(f'  [{script_num}]')
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0xbc, 0x92, 0x29)
    else:
        duration = data.get('Duration', '')
        difficulty = data.get('Difficulty', '')
        run = h.add_run(f'  [{script_num}]  {duration}  |  {difficulty}')
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0x88, 0x88, 0x99)

    # Script info table
    if is_quick_hit:
        info_fields = [
            ('Script #', data.get('Script', '—')),
            ('Key Visual', data.get('Key Visual', '—')),
        ]
    else:
        info_fields = [
            ('Script #', data.get('Script', '—')),
            ('Duration', data.get('Duration', '—')),
            ('Focus', data.get('Focus', '—')),
            ('Key Terms', data.get('Key Terms', '—')),
            ('Difficulty', data.get('Difficulty', '—')),
        ]

    table = doc.add_table(rows=len(info_fields), cols=2)
    table.style = 'Light List Accent 1'
    table.alignment = WD_TABLE_ALIGNMENT.LEFT

    for i, (label, value) in enumerate(info_fields):
        row = table.rows[i]
        row.cells[0].text = label
        row.cells[1].text = value
        for cell in [row.cells[0], row.cells[1]]:
            for p in cell.paragraphs:
                if p.runs:
                    if label == 'Script #':
                        p.runs[0].bold = True
                        p.runs[0].font.size = Pt(12)

    doc.add_paragraph()

    # Visual Cues section
    visual_cues = data.get('Visual Cues', '').strip()
    key_visual = data.get('Key Visual', '').strip()

    if visual_cues or key_visual:
        p = doc.add_paragraph()
        run = p.add_run('🎬 PRODUCTION NOTES')
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0xbc, 0x92, 0x29)

        if key_visual:
            p2 = doc.add_paragraph()
            run = p2.add_run('Key Visual: ')
            run.bold = True
            run = p2.add_run(key_visual)
            run.font.italic = True

        if visual_cues:
            for vline in visual_cues.split('\n'):
                vline = vline.strip()
                if vline:
                    p3 = doc.add_paragraph(vline)
                    p3.paragraph_format.left_indent = Inches(0.3)
                    p3.paragraph_format.space_before = Pt(1)
                    p3.paragraph_format.space_after = Pt(1)
                    for run in p3.runs:
                        run.font.size = Pt(10)
                        run.font.color.rgb = RGBColor(0x55, 0x55, 0x70)

        doc.add_paragraph()

    # Dialogue heading
    p = doc.add_paragraph()
    run = p.add_run('🎤 SCRIPT')
    run.bold = True
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor(0x1a, 0x1a, 0x2e)

    # Dialogue content — add as formatted paragraphs
    dialogue = data.get('Dialogue', '').strip()
    # Split by blank lines to create paragraph breaks
    dialogue_paragraphs = re.split(r'\n\s*\n', dialogue)

    for dp in dialogue_paragraphs:
        dp = dp.strip()
        if not dp:
            continue
        p2 = doc.add_paragraph()
        p2.paragraph_format.left_indent = Inches(0.3)
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(2)
        add_formatted_text(p2, dp)

    # Separator
    doc.add_paragraph('—' * 40)

    # For quick hits, don't add page break (group them)
    # For full lessons, add page break
    if not is_quick_hit:
        doc.add_page_break()


def main():
    doc = create_styled_doc()
    parse_and_build_doc(doc)

    output_path = 'AD_SCRIPTS.docx'
    doc.save(output_path)

    size_kb = os.path.getsize(output_path) / 1024
    print(f'✅ DOCX created: {output_path}')
    print(f'   Size: {size_kb:.1f} KB')

    # Quick validation
    line_count = sum(1 for _ in open(output_path, 'rb'))
    print(f'   Lines: ~{line_count}')
    print()

    # Show summary
    with open('AD_SCRIPTS.md') as f:
        md = f.read()
    lesson_count = len(re.findall(r'^### Lesson', md, re.MULTILINE))
    module_count = len(re.findall(r'^##.*Module \d+', md, re.MULTILINE))
    print(f'📊 Summary:')
    print(f'   Modules: {module_count}')
    print(f'   Lessons: {lesson_count}')
    print(f'   File: AD_SCRIPTS.docx')


if __name__ == '__main__':
    main()
