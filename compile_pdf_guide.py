import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle

def markdown_to_pdf(input_md_path, output_pdf_path):
    print(f"Reading {input_md_path}...")
    with open(input_md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    PRIMARY = colors.HexColor("#0F172A")
    SECONDARY = colors.HexColor("#D97706")
    TEXT_COLOR = colors.HexColor("#1E293B")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=12,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_COLOR,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_COLOR,
        leftIndent=12,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F1F5F9"),
        borderPadding=5,
        spaceBefore=3,
        spaceAfter=3
    )

    story = []
    in_code_block = False
    code_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code_block:
                code_text = "<br/>".join(code_lines).replace(" ", "&nbsp;")
                story.append(Paragraph(code_text, code_style))
                story.append(Spacer(1, 3))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            safe_code_line = line.rstrip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            code_lines.append(safe_code_line)
            continue

        if not stripped:
            story.append(Spacer(1, 3))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(stripped[2:], title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceBefore=2, spaceAfter=6))
        elif stripped.startswith("## "):
            story.append(Paragraph(stripped[3:], h1_style))
            story.append(HRFlowable(width="100%", thickness=0.75, color=BORDER_COLOR, spaceBefore=1, spaceAfter=4))
        elif stripped.startswith("### "):
            story.append(Paragraph(stripped[4:], h2_style))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            clean_text = stripped[2:].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(f"• {clean_text}", bullet_style))
        else:
            safe_text = stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            safe_text = safe_text.replace("**", "<b>", 1)
            if "**" in safe_text:
                safe_text = safe_text.replace("**", "</b>", 1)
            story.append(Paragraph(safe_text, body_style))

    doc.build(story)
    print(f"Successfully generated PDF at: {output_pdf_path}")

if __name__ == "__main__":
    md_file = r"c:\Users\DELL\Desktop\Taaskr\Must Read Before Interview.md"
    pdf_root = r"c:\Users\DELL\Desktop\Taaskr\Must Read Before Interview.pdf"
    pdf_docs = r"c:\Users\DELL\Desktop\Taaskr\docs\Must Read Before Interview.pdf"
    
    markdown_to_pdf(md_file, pdf_root)
    markdown_to_pdf(md_file, pdf_docs)
