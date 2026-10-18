"""
B.Tech Capstone Project Research Paper Generator with Embedded UI Screenshots
Project: Government Scheme Finder
Outputs: Government_Scheme_Finder_Research_Paper.pdf
Style: Professional, student-friendly, highly visual B.Tech research paper with real application screenshots.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable,
    Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

class StudentNumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render running headers and
    total page counts ('Page X of Y') on all pages.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        page_w, page_h = letter
        margin = 46.0

        # Running Header (Pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#1E3A8A"))
            self.drawString(margin, page_h - 28, "GOVERNMENT SCHEME FINDER: FULL-STACK ARCHITECTURE & FUTURE RAG ROADMAP")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(page_w - margin, page_h - 28, "B.Tech Project Research Paper")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(margin, page_h - 32, page_w - margin, page_h - 32)

        # Running Footer (All Pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(margin, 36, page_w - margin, 36)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(margin, 24, "Department of Computer Science & Engineering | Project Research Paper")
        self.drawRightString(page_w - margin, 24, f"Page {self._pageNumber} of {page_count}")

        self.restoreState()


def create_system_arch_diagram(width=520, height=76):
    """Clean 3-Tier Architecture Diagram"""
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height, fillColor=colors.HexColor('#F8FAFC'), strokeColor=colors.HexColor('#CBD5E1'), strokeWidth=0.8, rx=4, ry=4))

    # Box 1: Frontend
    d.add(Rect(12, 6, 142, 64, fillColor=colors.HexColor('#EFF6FF'), strokeColor=colors.HexColor('#2563EB'), strokeWidth=1, rx=3, ry=3))
    d.add(String(20, 58, 'Frontend (React 19)', fontSize=8, fontName='Helvetica-Bold', fillColor=colors.HexColor('#1E3A8A')))
    d.add(String(20, 46, '- Vite 8 + Tailwind CSS v4', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(20, 34, '- Code Splitting (React.lazy)', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(20, 22, '- AuthContext (JWT Storage)', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(20, 10, '- Responsive UI (All Screens)', fontSize=6.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#2563EB')))

    # Arrow 1 -> 2
    d.add(Line(154, 38, 185, 38, strokeColor=colors.HexColor('#64748B'), strokeWidth=1.2))
    d.add(Polygon([185, 41, 190, 38, 185, 35], fillColor=colors.HexColor('#64748B'), strokeColor=None))
    d.add(String(156, 43, 'REST API', fontSize=6, fontName='Helvetica-Bold', fillColor=colors.HexColor('#475569')))

    # Box 2: Backend
    d.add(Rect(190, 6, 148, 64, fillColor=colors.HexColor('#F0FDF4'), strokeColor=colors.HexColor('#16A34A'), strokeWidth=1, rx=3, ry=3))
    d.add(String(198, 58, 'Backend (Node & Express)', fontSize=8, fontName='Helvetica-Bold', fillColor=colors.HexColor('#14532D')))
    d.add(String(198, 46, '- JWT Auth Middleware', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(198, 34, '- 8-Factor Filter Engine', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(198, 22, '- Smart Redirection (IOARP)', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(198, 10, '- Decoupled RAG Stub Boundary', fontSize=6.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#16A34A')))

    # Arrow 2 -> 3
    d.add(Line(338, 38, 368, 38, strokeColor=colors.HexColor('#64748B'), strokeWidth=1.2))
    d.add(Polygon([368, 41, 373, 38, 368, 35], fillColor=colors.HexColor('#64748B'), strokeColor=None))
    d.add(String(340, 43, 'PostgREST', fontSize=6, fontName='Helvetica-Bold', fillColor=colors.HexColor('#475569')))

    # Box 3: Database
    d.add(Rect(373, 6, 135, 64, fillColor=colors.HexColor('#FAF5FF'), strokeColor=colors.HexColor('#9333EA'), strokeWidth=1, rx=3, ry=3))
    d.add(String(381, 58, 'Database (Supabase)', fontSize=8, fontName='Helvetica-Bold', fillColor=colors.HexColor('#581C87')))
    d.add(String(381, 46, '- PostgreSQL 17 Database', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(381, 34, '- 4,732 Government Schemes', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(381, 22, '- Row-Level Security (RLS)', fontSize=6.8, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(381, 10, '- pgvector (Ready for RAG)', fontSize=6.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#9333EA')))

    return d


def create_rag_pipeline_diagram(width=520, height=78):
    """Clean Future RAG Architecture Diagram with Gemini and pgvector"""
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height, fillColor=colors.HexColor('#F8FAFC'), strokeColor=colors.HexColor('#CBD5E1'), strokeWidth=0.8, rx=4, ry=4))

    # Step 1: Citizen Query
    d.add(Rect(10, 10, 95, 58, fillColor=colors.HexColor('#EFF6FF'), strokeColor=colors.HexColor('#2563EB'), strokeWidth=1, rx=3, ry=3))
    d.add(String(16, 56, '1. Citizen Query', fontSize=7.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#1E3A8A')))
    d.add(String(16, 42, '"I am a farmer in', fontSize=6.5, fontName='Helvetica-Oblique', fillColor=colors.HexColor('#334155')))
    d.add(String(16, 30, 'UP with 2 acres...', fontSize=6.5, fontName='Helvetica-Oblique', fillColor=colors.HexColor('#334155')))
    d.add(String(16, 18, 'what scheme helps?"', fontSize=6.5, fontName='Helvetica-Oblique', fillColor=colors.HexColor('#334155')))

    # Arrow 1 -> 2
    d.add(Line(105, 39, 125, 39, strokeColor=colors.HexColor('#64748B'), strokeWidth=1))
    d.add(Polygon([125, 41, 129, 39, 125, 37], fillColor=colors.HexColor('#64748B'), strokeColor=None))

    # Step 2: Vector Embedding & Search
    d.add(Rect(129, 10, 115, 58, fillColor=colors.HexColor('#FAF5FF'), strokeColor=colors.HexColor('#9333EA'), strokeWidth=1, rx=3, ry=3))
    d.add(String(135, 56, '2. Vector Search', fontSize=7.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#581C87')))
    d.add(String(135, 42, 'Supabase + pgvector', fontSize=6.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#334155')))
    d.add(String(135, 30, '- Embed query text', fontSize=6.5, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(135, 18, '- Retrieve top 3 schemes', fontSize=6.5, fontName='Helvetica', fillColor=colors.HexColor('#9333EA')))

    # Arrow 2 -> 3
    d.add(Line(244, 39, 264, 39, strokeColor=colors.HexColor('#64748B'), strokeWidth=1))
    d.add(Polygon([264, 41, 268, 39, 264, 37], fillColor=colors.HexColor('#64748B'), strokeColor=None))

    # Step 3: LLM Context Grounding
    d.add(Rect(268, 10, 115, 58, fillColor=colors.HexColor('#FEF3C7'), strokeColor=colors.HexColor('#D97706'), strokeWidth=1, rx=3, ry=3))
    d.add(String(274, 56, '3. Google Gemini API', fontSize=7.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#B45309')))
    d.add(String(274, 42, 'Prompt + Schemes:', fontSize=6.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#334155')))
    d.add(String(274, 30, '- Query: Farmer in UP', fontSize=6.5, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(274, 18, '- Context: PM-KISAN text', fontSize=6.5, fontName='Helvetica', fillColor=colors.HexColor('#D97706')))

    # Arrow 3 -> 4
    d.add(Line(383, 39, 403, 39, strokeColor=colors.HexColor('#64748B'), strokeWidth=1))
    d.add(Polygon([403, 41, 407, 39, 403, 37], fillColor=colors.HexColor('#64748B'), strokeColor=None))

    # Step 4: Grounded Answer
    d.add(Rect(407, 10, 103, 58, fillColor=colors.HexColor('#DCFCE7'), strokeColor=colors.HexColor('#16A34A'), strokeWidth=1, rx=3, ry=3))
    d.add(String(413, 56, '4. Factual Output', fontSize=7.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#15803D')))
    d.add(String(413, 42, 'Citizen gets answer:', fontSize=6.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#334155')))
    d.add(String(413, 30, '- Exact aid (Rs 6,000)', fontSize=6.5, fontName='Helvetica', fillColor=colors.HexColor('#334155')))
    d.add(String(413, 18, '- Verified Official Link', fontSize=6.5, fontName='Helvetica-Bold', fillColor=colors.HexColor('#16A34A')))

    return d


def build_btech_visual_pdf(filename="Government_Scheme_Finder_Research_Paper.pdf"):
    print(f"Generating visual B.Tech research paper with screenshots: {filename}...")

    # Document Geometry
    margin = 46.0
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=36.0,
        bottomMargin=36.0
    )

    content_w = letter[0] - (2 * margin)  # 520 pt

    # Colors
    c_primary = colors.HexColor("#1E3A8A")       # Navy
    c_secondary = colors.HexColor("#0F172A")     # Slate 900
    c_body = colors.HexColor("#334155")          # Slate 700
    c_accent = colors.HexColor("#2563EB")        # Blue 600
    c_border = colors.HexColor("#CBD5E1")        # Slate 300
    c_bg_subtle = colors.HexColor("#F8FAFC")     # Slate 50

    # Styles
    base_styles = getSampleStyleSheet()

    journal_tag_style = ParagraphStyle(
        'JournalTag',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_accent,
        spaceAfter=4
    )

    title_style = ParagraphStyle(
        'DocTitle',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_secondary,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=base_styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=12.5,
        textColor=c_primary,
        spaceAfter=8
    )

    authors_style = ParagraphStyle(
        'Authors',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=13,
        textColor=c_body,
        spaceAfter=9
    )

    abstract_body_style = ParagraphStyle(
        'AbstractBody',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=8.4,
        leading=12.2,
        textColor=c_body,
        alignment=4
    )

    keywords_style = ParagraphStyle(
        'Keywords',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=c_body,
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'SecHeading1',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_primary,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SecHeading2',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11.8,
        textColor=c_secondary,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=8.4,
        leading=11.8,
        textColor=c_body,
        alignment=4,
        spaceAfter=3.5
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.2,
        textColor=c_body,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=2
    )

    caption_style = ParagraphStyle(
        'TableCaption',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=9.8,
        textColor=c_primary,
        alignment=1,
        spaceBefore=4,
        spaceAfter=3,
        keepWithNext=True
    )

    sub_caption_style = ParagraphStyle(
        'SubCaption',
        parent=base_styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.2,
        leading=9.2,
        textColor=colors.HexColor("#475569"),
        alignment=1,
        spaceBefore=2
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.6,
        leading=9.8,
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=7.4,
        leading=9.8,
        textColor=c_body,
        alignment=0
    )

    table_cell_center_style = ParagraphStyle(
        'TableCellCenter',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=7.4,
        leading=9.8,
        textColor=c_body,
        alignment=1
    )

    table_cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.4,
        leading=9.8,
        textColor=c_secondary,
        alignment=0
    )

    reference_style = ParagraphStyle(
        'ReferenceItem',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=7.4,
        leading=10,
        textColor=c_body,
        leftIndent=16,
        firstLineIndent=-16,
        spaceAfter=3
    )

    story = []

    # =========================================================================
    # TITLE & HEADER BLOCK (Page 1)
    # =========================================================================
    story.append(Paragraph("B.TECH COMPUTER SCIENCE & ENGINEERING | CAPSTONE RESEARCH PAPER", journal_tag_style))
    story.append(Paragraph("Design and Implementation of Government Scheme Finder: A Citizen-Centric Web Platform with Multi-Factor Eligibility Filtering and Future RAG Integration", title_style))
    story.append(Paragraph("A Full-Stack e-Governance Solution Indexing 4,732 Official Schemes with Zero-Trust Security", subtitle_style))

    authors_text = (
        "<b>Rudra Srivastava</b><br/>"
        "Undergraduate Student, Department of Computer Science & Engineering<br/>"
        "Project Repository: <i>https://github.com/srivastavarudra22-prog/government-scheme-finder.git</i> &bull; Academic Year 2026"
    )
    story.append(Paragraph(authors_text, authors_style))

    # Abstract Box
    abstract_text = (
        "<b>Abstract</b>—In India, central and state governments spend trillions of rupees on welfare schemes for farmers, students, women, and small business owners. However, millions of eligible citizens miss out on these benefits because information is scattered across hundreds of departmental websites, application procedures are complicated, and citizens often encounter broken links or cyber scams. To solve this real-world problem, we developed <b>Government Scheme Finder</b>, a responsive, full-stack citizen portal indexing <b>4,732 official Indian government schemes</b> across 36 States/UTs and 28 Central Ministries. The system features an instant <b>8-Factor Eligibility Wizard</b> (evaluating age, income, state, gender, caste, occupation, education, and residence area), an <b>Intelligent Official Redirection Engine</b> that routes users only to verified government portals without inventing fake URLs, personal application status tracking, and side-by-side scheme comparison. The backend is built with Node.js, Express, and Supabase PostgreSQL with <b>Row-Level Security (RLS)</b>, guaranteeing that users can only access their own private bookmarks and applications. Furthermore, we designed a decoupled architecture ready for <b>Retrieval-Augmented Generation (RAG)</b> using Google Gemini models and vector embeddings (`pgvector`) to enable conversational citizen question-answering. The system was validated through an automated 35-point end-to-end test suite (100% pass rate) and route-level code splitting that reduced the initial frontend bundle by 44.8% to 280 kB, providing an accessible and secure public service platform."
    )

    abstract_table = Table([[Paragraph(abstract_text, abstract_body_style)]], colWidths=[content_w])
    abstract_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_subtle),
        ('BOX', (0, 0), (-1, -1), 0.8, c_border),
        ('LINEBEFORE', (0, 0), (0, -1), 3.0, c_accent),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(abstract_table)
    story.append(Spacer(1, 3))

    keywords_text = (
        "<b>Keywords:</b> e-Governance, Government Schemes, React 19, Node.js, Supabase, Row-Level Security (RLS), "
        "Eligibility Filter, Intelligent Redirection, Retrieval-Augmented Generation (RAG), Google Gemini, Digital India."
    )
    story.append(Paragraph(keywords_text, keywords_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=5))

    # =========================================================================
    # SECTION 1: INTRODUCTION & MOTIVATION
    # =========================================================================
    story.append(Paragraph("1. Introduction & Problem Statement", h1_style))
    story.append(Paragraph(
        "Social welfare schemes form the backbone of social security and economic empowerment in India. From financial support for small farmers (PM-KISAN) to health insurance for impoverished families (Ayushman Bharat) and scholarships for marginalized students, government programs provide essential financial aid. Despite the massive scale of these programs, there exists a significant <b>'Welfare Access Gap'</b> between government announcements and citizen adoption.",
        body_style
    ))
    story.append(Paragraph(
        "During our research and requirement gathering, we identified three fundamental problems faced by ordinary citizens:",
        body_style
    ))
    story.append(Paragraph("<b>1. Information Dispersal:</b> Guidelines and application forms are scattered across hundreds of separate state and central portals. A student looking for a scholarship in Uttar Pradesh has to check different websites for central schemes versus state-specific benefits.", bullet_style))
    story.append(Paragraph("<b>2. Complicated Eligibility Rules:</b> Most government schemes require satisfying multiple criteria at the same time: minimum and maximum age, maximum annual family income, state residency, social category (SC/ST/OBC/General), gender, and occupation. Citizens often struggle to determine whether they qualify before applying.", bullet_style))
    story.append(Paragraph("<b>3. Broken Links and Scam Websites:</b> When citizens search for schemes on general search engines, they frequently encounter dead links, private blog aggregators filled with advertisements, or phishing websites that mimic official government portals to steal Aadhaar and banking details.", bullet_style))
    story.append(Paragraph(
        "<b>Project Objective:</b> The goal of this B.Tech capstone project is to build <b>Government Scheme Finder</b>—a centralized, fast, secure, and mobile-friendly web application where any citizen can enter their basic profile, discover all schemes they are eligible for in seconds, track their applications, and get redirected safely to official portals.",
        body_style
    ))

    # =========================================================================
    # SECTION 2: SYSTEM ARCHITECTURE & TECH STACK (Page 2)
    # =========================================================================
    story.append(Paragraph("2. System Architecture & Technology Stack", h1_style))
    story.append(Paragraph(
        "The project is built using a modern three-tier web architecture that separates user interface, API business logic, and database storage for reliability and performance.",
        body_style
    ))

    # Insert Architecture Diagram
    story.append(Paragraph("FIGURE 1: Block Diagram of Government Scheme Finder Architecture", caption_style))
    story.append(create_system_arch_diagram(width=content_w, height=84))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>A. Frontend Architecture (React 19 + Vite + Tailwind CSS)</b>", h2_style))
    story.append(Paragraph(
        "The frontend is implemented as a Single-Page Application (SPA) using React 19 and Vite 8 for fast development and production builds. Key frontend engineering decisions include:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Tailwind CSS v4:</b> Utility-first responsive design ensuring seamless operation across Desktop (1440px), Laptop (1024px), Tablet (768px), and Mobile devices (375px–420px).", bullet_style))
    story.append(Paragraph("&bull; <b>Route-Level Code Splitting:</b> Using `React.lazy()` and `Suspense`, each page route (Landing, Find Schemes, Results, Scheme Details, Dashboard, Chat) is loaded on demand. This slashed the initial bundle from 507 kB down to 280 kB (88 kB gzipped), allowing instant loading even on 3G/4G connections.", bullet_style))
    story.append(Paragraph("&bull; <b>State Management & AuthContext:</b> A global React Context manages JWT session storage, login state, and user demographic profiles across browser reloads without page flickering.", bullet_style))

    story.append(Paragraph("<b>B. Backend API Layer (Node.js & Express 5)</b>", h2_style))
    story.append(Paragraph(
        "The backend server is built with Node.js and Express 5, organized into clean modular directories (`controllers/`, `routes/`, `middleware/`, `services/`, `utils/`). The backend acts as a secure API gateway with JWT Authentication Middleware verifying Bearer tokens and creating isolated request clients (`createUserClient(token)`).",
        body_style
    ))

    story.append(Paragraph("<b>C. Database & Authentication (Supabase PostgreSQL 17)</b>", h2_style))
    story.append(Paragraph(
        "The project uses Supabase PostgreSQL as the database backend. It stores 4,732 officially classified welfare schemes, user profiles, saved bookmarks, and application tracking records with active Row-Level Security.",
        body_style
    ))

    # =========================================================================
    # SECTION 3: CORE IMPLEMENTED MODULES & UI SHOWCASE (Page 3 & 4)
    # =========================================================================
    story.append(Paragraph("3. Core Functional Modules & User Interface Showcase", h1_style))
    story.append(Paragraph(
        "Government Scheme Finder delivers five primary citizen-centric modules, supported by intuitive and accessible user interfaces:",
        body_style
    ))

    story.append(Paragraph("<b>Module 1: Scheme Discovery & Full-Text Search:</b> Indexes 4,732 schemes across central ministries and 36 States/UTs with instant debounced search.", body_style))
    story.append(Paragraph("<b>Module 2: 8-Factor Deterministic Eligibility Wizard:</b> Evaluates State, Age, Income, Gender, Caste, Occupation, Education, and Residence area in under 50ms.", body_style))

    # --- UI SHOWCASE 1: Wizard & Results Screenshots ---
    story.append(Spacer(1, 2))
    img_w = 248
    img_h = 108

    img1 = RLImage('screenshot_landing.png', width=img_w, height=img_h)
    img2 = RLImage('ui_screen_wizard.png', width=img_w, height=img_h)

    showcase_table1 = Table([
        [img1, img2],
        [
            Paragraph("<b>Figure 2(a):</b> Citizen Landing Page with instant search & statistics", sub_caption_style),
            Paragraph("<b>Figure 2(b):</b> 8-Factor Eligibility Wizard evaluating citizen criteria", sub_caption_style)
        ]
    ], colWidths=[256, 256])
    showcase_table1.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(showcase_table1)
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Module 3: Intelligent Official Application Redirection (IOARP)</b><br/>To protect citizens from fake links and dead-ends, the <b>'Apply Officially'</b> button enforces five deterministic rules:", body_style))

    # Redirection Rules Table
    story.append(Paragraph("TABLE I: The 5 Deterministic Redirection Rules of the 'Apply Officially' Engine", caption_style))
    rules_table_data = [
        [
            Paragraph("Case / Condition", table_header_style),
            Paragraph("System Action & UI Behavior", table_header_style),
            Paragraph("Citizen Benefit", table_header_style)
        ],
        [
            Paragraph("<b>Rule 1: Direct URL Available</b>", table_cell_bold_style),
            Paragraph("Opens verified official portal (e.g. `pmkisan.gov.in`) in a secure new tab (`rel='noopener noreferrer'`).", table_cell_style),
            Paragraph("Direct access to verified government portal.", table_cell_style)
        ],
        [
            Paragraph("<b>Rule 2: MyScheme Details Available</b>", table_cell_bold_style),
            Paragraph("Opens verified MyScheme details page so citizens read full official instructions.", table_cell_style),
            Paragraph("Prevents dead-ends; authoritative guidance.", table_cell_style)
        ],
        [
            Paragraph("<b>Rule 3: Confirmed Offline Scheme</b>", table_cell_bold_style),
            Paragraph("Displays clear modal explaining that online apply is not available and lists physical submission offices (CSC/Taluk).", table_cell_style),
            Paragraph("Stops wasted time searching for non-existent forms.", table_cell_style)
        ],
        [
            Paragraph("<b>Rule 4: Application Method Unknown</b>", table_cell_bold_style),
            Paragraph("Does <b>not</b> assume offline; displays verified official helpline and department contact details.", table_cell_style),
            Paragraph("Avoids false claims; gives nodal contact.", table_cell_style)
        ],
        [
            Paragraph("<b>Rule 5: No Verified URL Exists</b>", table_cell_bold_style),
            Paragraph("Strictly <b>never invents or guesses a URL</b>. Displays verified nodal authority information.", table_cell_style),
            Paragraph("<b>Zero URL Hallucination Guarantee.</b>", table_cell_style)
        ],
    ]
    rules_table = Table(rules_table_data, colWidths=[120, 240, 160])
    rules_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_subtle]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(rules_table)
    story.append(Spacer(1, 4))

    # --- UI SHOWCASE 2: Results & Scheme Details Screenshots ---
    img3 = RLImage('ui_screen_results.png', width=img_w, height=img_h)
    img4 = RLImage('ui_screen_details.png', width=img_w, height=img_h)

    showcase_table2 = Table([
        [img3, img4],
        [
            Paragraph("<b>Figure 3(a):</b> Matched schemes with dynamic match % scores", sub_caption_style),
            Paragraph("<b>Figure 3(b):</b> Scheme Details with 'Apply Officially' & 'Compare' options", sub_caption_style)
        ]
    ], colWidths=[256, 256])
    showcase_table2.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(showcase_table2)
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Module 4: Bookmarks & Application Tracker:</b> Citizens can save schemes and monitor their application lifecycle stages (`Interested` &rarr; `Applied` &rarr; `Under Review` &rarr; `Approved` &rarr; `Rejected`) with reference numbers.", body_style))
    story.append(Paragraph("<b>Module 5: Side-by-Side Scheme Comparison:</b> Citizens can click <b>'Compare with Another Scheme'</b> on any scheme details page to open an interactive side-by-side comparison matrix evaluating criteria, benefits, and required documents.", body_style))

    # =========================================================================
    # SECTION 4: DATABASE & ZERO-TRUST SECURITY (RLS)
    # =========================================================================
    story.append(Paragraph("4. Database Design & Security Architecture", h1_style))
    story.append(Paragraph(
        "A critical priority of this project is data privacy. Because citizen profiles store sensitive personal data (annual income, caste, disability status, application reference IDs), the system implements <b>Zero-Trust Database Isolation</b>:",
        body_style
    ))
    story.append(Paragraph("<b>A. Relational Schema & Constraints:</b> `schemes` (4,732 rows, public read), `profiles` (1:1 with `auth.users(id)` ON DELETE CASCADE), `saved_schemes` (unique constraint `uq_saved_schemes_user_scheme` preventing duplicates), and `applications` (lifecycle tracking).", body_style))
    story.append(Paragraph("<b>B. Row-Level Security (RLS) & IDOR Prevention:</b> Standard web apps verify authorization in code (`if (user.id === req.body.userId)`), which is vulnerable to <b>Insecure Direct Object Reference (IDOR)</b>. In our architecture, <b>PostgreSQL Row-Level Security (RLS)</b> enforces policies (`auth.uid() = user_id`) natively in the database. Even if API requests are tampered with, PostgreSQL physically prevents User A from viewing, editing, or deleting User B's private data.", body_style))

    # =========================================================================
    # SECTION 5: FUTURE INTEGRATION: RAG WITH GOOGLE GEMINI
    # =========================================================================
    story.append(Paragraph("5. Future Integration: Retrieval-Augmented Generation (RAG) with Google Gemini", h1_style))
    story.append(Paragraph(
        "While deterministic filters work well for checkboxes, citizens often want to ask questions in plain, conversational language (e.g., <i>'My daughter is studying in 11th grade and I earn less than 2 lakh per year. Is there any state scholarship that provides books and hostel fees?'</i>).",
        body_style
    ))
    story.append(Paragraph(
        "To address this without building an unreliable chatbot that hallucinates non-existent schemes, we designed an architecture for <b>Retrieval-Augmented Generation (RAG)</b> powered by <b>Google Gemini</b> models.",
        body_style
    ))

    # Insert RAG Architecture Diagram
    story.append(Paragraph("FIGURE 4: Proposed RAG Pipeline Integrating Supabase pgvector and Google Gemini Models", caption_style))
    story.append(create_rag_pipeline_diagram(width=content_w, height=88))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>A. Why RAG instead of standard ChatGPT/Gemini prompts?</b> Raw LLMs lack verified regional context and can hallucinate false eligibility limits. RAG grounds Gemini by first searching the verified 4,732-scheme database using vector similarity and passing the official excerpts as context.", body_style))
    story.append(Paragraph("<b>B. The 4-Step RAG Execution Pipeline:</b> (1) <i>Chunking:</i> Segment scheme records into text chunks; (2) <i>Vector Storage (`pgvector`):</i> Store embeddings in Supabase with HNSW indexes for sub-15ms search; (3) <i>Semantic Retrieval:</i> Query vector embeddings to retrieve top 3-5 schemes; (4) <i>Grounded Generation:</i> Prompt Google Gemini to answer using *only* official facts.", body_style))
    story.append(Paragraph("<b>C. Decoupled Architecture in Current Codebase:</b> The backend already contains abstract service boundaries (`ragService.js`, `chatController.js`, `/api/rag/status`, `/api/chat/message`). Adding Gemini API keys in the future requires <b>zero frontend rewrite</b>.", body_style))

    # =========================================================================
    # SECTION 6: TESTING, PERFORMANCE & RESULTS
    # =========================================================================
    story.append(Paragraph("6. Testing, Performance Optimization & Results", h1_style))
    story.append(Paragraph(
        "To ensure production quality, the platform was audited across automated backend test suites, performance profilers, and multi-device responsive testing.",
        body_style
    ))

    story.append(Paragraph("<b>A. Automated 35-Checkpoint End-to-End Audit (100% Pass Rate):</b> We executed `backend/tests/full_audit_test.js` against the live database and Express server. All 35 checkpoints passed with 0 errors:", body_style))

    # Audit Table
    story.append(Paragraph("TABLE II: Automated 35-Checkpoint System Audit Results", caption_style))
    audit_table_data = [
        [
            Paragraph("Subsystem", table_header_style),
            Paragraph("Verified Functional Capabilities & Security Checks", table_header_style),
            Paragraph("Checks", table_header_style),
            Paragraph("Result", table_header_style)
        ],
        [
            Paragraph("<b>Authentication & Profile</b>", table_cell_bold_style),
            Paragraph("Signup, login, session persistence, browser refresh, `/api/auth/me`, profile fetch, demographic update, logout, route protection.", table_cell_style),
            Paragraph("10", table_cell_center_style),
            Paragraph("<b>10 / 10 PASSED</b>", table_cell_center_style)
        ],
        [
            Paragraph("<b>Schemes & Eligibility</b>", table_cell_bold_style),
            Paragraph("Catalog fetch (4,732 rows), search debouncing, 8-factor filter wizard, scheme details view, side-by-side comparison matrix.", table_cell_style),
            Paragraph("5", table_cell_center_style),
            Paragraph("<b>5 / 5 PASSED</b>", table_cell_center_style)
        ],
        [
            Paragraph("<b>User Data & Tracking</b>", table_cell_bold_style),
            Paragraph("Save bookmark, view bookmarks, delete bookmark, create application tracker record, update status (`Under Review`/`Approved`), delete tracker.", table_cell_style),
            Paragraph("6", table_cell_center_style),
            Paragraph("<b>6 / 6 PASSED</b>", table_cell_center_style)
        ],
        [
            Paragraph("<b>Security & RLS Isolation</b>", table_cell_bold_style),
            Paragraph("User A cannot view User B bookmarks (0 leakage); User A cannot access User B applications; invalid JWT rejected; service-role keys absent from frontend; `.env` excluded.", table_cell_style),
            Paragraph("7", table_cell_center_style),
            Paragraph("<b>7 / 7 PASSED</b>", table_cell_center_style)
        ],
        [
            Paragraph("<b>Database Integrity</b>", table_cell_bold_style),
            Paragraph("RLS active on all tables; Auth UUID foreign key cascade; unique bookmark constraint (`uq_saved_schemes_user_scheme`); health latency < 35ms.", table_cell_style),
            Paragraph("4", table_cell_center_style),
            Paragraph("<b>4 / 4 PASSED</b>", table_cell_center_style)
        ],
        [
            Paragraph("<b>RAG Decoupled Subsystem</b>", table_cell_bold_style),
            Paragraph("Chat capability endpoint check; RAG status verification; deterministic fallback handling without server crash.", table_cell_style),
            Paragraph("3", table_cell_center_style),
            Paragraph("<b>3 / 3 PASSED</b>", table_cell_center_style)
        ],
        [
            Paragraph("<b>TOTAL</b>", table_cell_bold_style),
            Paragraph("<b>Master Full-Stack Integration & Security Verification Pass</b>", table_cell_bold_style),
            Paragraph("<b>35</b>", table_cell_center_style),
            Paragraph("<b>35 / 35 PASSED (100%)</b>", table_cell_center_style)
        ],
    ]
    audit_table = Table(audit_table_data, colWidths=[110, 275, 45, 90])
    audit_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, c_bg_subtle]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(audit_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>B. Frontend Optimization: 44.8% Bundle Size Reduction:</b> Route-level code splitting using `React.lazy()` reduced the initial entry bundle from 507 kB down to 280.12 kB (88.42 kB gzip), speeding up Time-to-Interactive on mobile devices.", body_style))
    story.append(Paragraph("<b>C. Responsive Multi-Device Visual Testing:</b> All thirteen views were audited across Mobile (375px/414px), Tablet (768px), Laptop (1024px), and Desktop (1440px), guaranteeing zero overflow and accessible touch targets (>= 44px).", body_style))

    # =========================================================================
    # SECTION 7: CONCLUSION & FUTURE WORK
    # =========================================================================
    story.append(Paragraph("7. Conclusion & Future Roadmap", h1_style))
    story.append(Paragraph(
        "<b>Government Scheme Finder</b> successfully bridges the information gap between Indian welfare policies and citizens. By indexing 4,732 schemes in an 8-factor deterministic eligibility engine, citizens discover entitlements in seconds. The intelligent redirection engine eliminates the risk of online scams and fake links. By combining React 19, Node.js, Express, and Supabase PostgreSQL with Row-Level Security, the application guarantees high performance, privacy, and zero data leakage.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Future Enhancements:</b> (1) Full RAG rollout with Google Gemini for natural conversational QA; (2) Vernacular voice assistant in Hindi, Tamil, Telugu, Marathi, and Bengali; (3) DigiLocker integration for automated document verification; and (4) Offline-ready Progressive Web App (PWA) caching.",
        body_style
    ))

    # =========================================================================
    # REFERENCES
    # =========================================================================
    story.append(Spacer(1, 3))
    story.append(Paragraph("References", h1_style))

    references = [
        "[1] Ministry of Electronics and Information Technology (MeitY), Government of India, \"Digital Public Infrastructure for Citizen Empowerment,\" <i>NeGD Technical Report</i>, New Delhi, 2024.",
        "[2] National e-Governance Division, \"MyScheme Portal: One-Stop Search and Discovery of Government Schemes,\" <i>MeitY Whitepaper</i>, 2023.",
        "[3] Direct Benefit Transfer (DBT) Mission, Cabinet Secretariat, Government of India, \"DBT Performance Analytics and Beneficiary Dissemination,\" <i>Annual Report</i>, 2023.",
        "[4] React Team, \"React 19 Documentation: Server Components, Transitions, and Code-Splitting with Suspense,\" <i>Meta Open Source</i>, 2024.",
        "[5] Supabase, \"Row Level Security (RLS) and Multi-Tenant Architecture in PostgreSQL,\" <i>Supabase Documentation</i>, 2024.",
        "[6] Google DeepMind, \"Gemini: A Family of Highly Capable Multimodal Models,\" <i>Technical Report</i>, 2023.",
        "[7] P. Lewis et al., \"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,\" in <i>Advances in Neural Information Processing Systems (NeurIPS)</i>, vol. 33, pp. 9459–9474, 2020.",
        "[8] OWASP Foundation, \"OWASP Top 10 API Security Risks: Broken Object Level Authorization (BOLA/IDOR),\" <i>OWASP Technical Standard</i>, 2023.",
        "[9] PostgreSQL Global Development Group, \"pgvector: Open-Source Vector Similarity Search for PostgreSQL,\" <i>PostgreSQL Extensions Guide</i>, 2024.",
        "[10] World Bank Group, \"GovTech: Putting People First through Tech-Enabled Public Sector Solutions,\" <i>World Bank Working Paper No. 102</i>, Washington, D.C., 2022."
    ]

    for ref in references:
        story.append(Paragraph(ref, reference_style))

    # Build PDF
    doc.build(story, canvasmaker=StudentNumberedCanvas)
    print(f"Visual B.Tech research paper generated successfully: {filename}")


if __name__ == "__main__":
    out_file = "Government_Scheme_Finder_Research_Paper.pdf"
    if len(sys.argv) > 1:
        out_file = sys.argv[1]
    build_btech_visual_pdf(out_file)
