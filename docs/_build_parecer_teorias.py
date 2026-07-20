from __future__ import annotations

from pathlib import Path
from typing import Iterable

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "Desenvolvimento" / "docs" / "PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx"

NAVY = "0B2545"
BLUE = "2E74B5"
LIGHT_BLUE = "EAF2F8"
PALE_BLUE = "F4F8FC"
GOLD = "B58B2A"
DARK = "1F2933"
MUTED = "5E6B78"
LIGHT_GRAY = "F2F4F7"
MID_GRAY = "D9E0E7"
WHITE = "FFFFFF"
GREEN = "2E7D5B"
PALE_GREEN = "EAF5F0"
AMBER = "9A6700"
PALE_AMBER = "FFF5D6"
RED = "A64040"
PALE_RED = "FCEBEC"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_width(cell, width_inches: float) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(round(width_inches * 1440)))
    tc_w.set(qn("w:type"), "dxa")
    cell.width = Inches(width_inches)


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    tr_pr.append(cant_split)


def set_table_fixed(table, width_inches: float = 6.5) -> None:
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_pr = table._tbl.tblPr
    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(round(width_inches * 1440)))
    tbl_w.set(qn("w:type"), "dxa")


def set_table_borders(table, color=MID_GRAY, size="6") -> None:
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = borders.find(qn(f"w:{edge}"))
        if tag is None:
            tag = OxmlElement(f"w:{edge}")
            borders.append(tag)
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), size)
        tag.set(qn("w:space"), "0")
        tag.set(qn("w:color"), color)


def add_hyperlink(paragraph, text: str, url: str, color=BLUE, underline=True):
    part = paragraph.part
    r_id = part.relate_to(url, RT.HYPERLINK, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)
    new_run = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    r_fonts = OxmlElement("w:rFonts")
    r_fonts.set(qn("w:ascii"), "Calibri")
    r_fonts.set(qn("w:hAnsi"), "Calibri")
    r_fonts.set(qn("w:eastAsia"), "Calibri")
    r_pr.append(r_fonts)
    c = OxmlElement("w:color")
    c.set(qn("w:val"), color)
    r_pr.append(c)
    if underline:
        u = OxmlElement("w:u")
        u.set(qn("w:val"), "single")
        r_pr.append(u)
    new_run.append(r_pr)
    t = OxmlElement("w:t")
    t.text = text
    new_run.append(t)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)
    return hyperlink


def add_page_number(paragraph) -> None:
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Página ")
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor.from_string(MUTED)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)


def set_bottom_border(paragraph, color=MID_GRAY, size="6", space="4") -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), space)
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)


def shade_paragraph(paragraph, fill: str, border: str | None = None) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    shd = p_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        p_pr.append(shd)
    shd.set(qn("w:fill"), fill)
    if border:
        p_bdr = p_pr.find(qn("w:pBdr"))
        if p_bdr is None:
            p_bdr = OxmlElement("w:pBdr")
            p_pr.append(p_bdr)
        left = OxmlElement("w:left")
        left.set(qn("w:val"), "single")
        left.set(qn("w:sz"), "18")
        left.set(qn("w:space"), "8")
        left.set(qn("w:color"), border)
        p_bdr.append(left)
    spacing = p_pr.find(qn("w:spacing"))
    if spacing is None:
        spacing = OxmlElement("w:spacing")
        p_pr.append(spacing)
    spacing.set(qn("w:before"), "100")
    spacing.set(qn("w:after"), "100")
    ind = p_pr.find(qn("w:ind"))
    if ind is None:
        ind = OxmlElement("w:ind")
        p_pr.append(ind)
    ind.set(qn("w:left"), "140")
    ind.set(qn("w:right"), "140")


def set_keep(paragraph, with_next=True, together=False) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    if with_next:
        keep_next = OxmlElement("w:keepNext")
        p_pr.append(keep_next)
    if together:
        keep_lines = OxmlElement("w:keepLines")
        p_pr.append(keep_lines)


def set_language(run, lang="pt-BR") -> None:
    r_pr = run._r.get_or_add_rPr()
    lang_el = r_pr.find(qn("w:lang"))
    if lang_el is None:
        lang_el = OxmlElement("w:lang")
        r_pr.append(lang_el)
    lang_el.set(qn("w:val"), lang)
    lang_el.set(qn("w:eastAsia"), lang)


def add_body(doc, text: str, bold_lead: str | None = None):
    p = doc.add_paragraph(style="Body Text")
    if bold_lead and text.startswith(bold_lead):
        r = p.add_run(bold_lead)
        r.bold = True
        p.add_run(text[len(bold_lead):])
    else:
        p.add_run(text)
    return p


def add_bullet(doc, text: str, level: int = 0):
    style = "List Bullet" if level == 0 else "List Bullet 2"
    p = doc.add_paragraph(style=style)
    p.add_run(text)
    return p


def create_decimal_numbering(doc: Document) -> int:
    numbering = doc.part.numbering_part.element
    abstract_ids = [
        int(el.get(qn("w:abstractNumId")))
        for el in numbering.findall(qn("w:abstractNum"))
        if el.get(qn("w:abstractNumId")) is not None
    ]
    num_ids = [
        int(el.get(qn("w:numId")))
        for el in numbering.findall(qn("w:num"))
        if el.get(qn("w:numId")) is not None
    ]
    abstract_id = max(abstract_ids, default=-1) + 1
    num_id = max(num_ids, default=0) + 1

    abstract = OxmlElement("w:abstractNum")
    abstract.set(qn("w:abstractNumId"), str(abstract_id))
    multi = OxmlElement("w:multiLevelType")
    multi.set(qn("w:val"), "singleLevel")
    abstract.append(multi)
    lvl = OxmlElement("w:lvl")
    lvl.set(qn("w:ilvl"), "0")
    start = OxmlElement("w:start")
    start.set(qn("w:val"), "1")
    lvl.append(start)
    num_fmt = OxmlElement("w:numFmt")
    num_fmt.set(qn("w:val"), "decimal")
    lvl.append(num_fmt)
    lvl_text = OxmlElement("w:lvlText")
    lvl_text.set(qn("w:val"), "%1.")
    lvl.append(lvl_text)
    lvl_jc = OxmlElement("w:lvlJc")
    lvl_jc.set(qn("w:val"), "left")
    lvl.append(lvl_jc)
    p_pr = OxmlElement("w:pPr")
    tabs = OxmlElement("w:tabs")
    tab = OxmlElement("w:tab")
    tab.set(qn("w:val"), "num")
    tab.set(qn("w:pos"), "720")
    tabs.append(tab)
    p_pr.append(tabs)
    ind = OxmlElement("w:ind")
    ind.set(qn("w:left"), "720")
    ind.set(qn("w:hanging"), "360")
    p_pr.append(ind)
    lvl.append(p_pr)
    abstract.append(lvl)
    numbering.append(abstract)

    num = OxmlElement("w:num")
    num.set(qn("w:numId"), str(num_id))
    abstract_ref = OxmlElement("w:abstractNumId")
    abstract_ref.set(qn("w:val"), str(abstract_id))
    num.append(abstract_ref)
    numbering.append(num)
    return num_id


def add_number(doc, text: str, num_id: int, level: int = 0):
    p = doc.add_paragraph(style="Body Text")
    p_pr = p._p.get_or_add_pPr()
    num_pr = OxmlElement("w:numPr")
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), str(level))
    num_id_el = OxmlElement("w:numId")
    num_id_el.set(qn("w:val"), str(num_id))
    num_pr.append(ilvl)
    num_pr.append(num_id_el)
    p_pr.append(num_pr)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.167
    p.add_run(text)
    return p


def add_callout(doc, label: str, text: str, kind: str = "blue"):
    palette = {
        "blue": (PALE_BLUE, BLUE),
        "green": (PALE_GREEN, GREEN),
        "amber": (PALE_AMBER, AMBER),
        "red": (PALE_RED, RED),
    }
    fill, border = palette[kind]
    p = doc.add_paragraph()
    shade_paragraph(p, fill, border)
    r = p.add_run(label.upper() + "  ")
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(border)
    p.add_run(text)
    set_keep(p, with_next=False, together=True)
    return p


def add_kv(doc, label: str, text: str):
    p = doc.add_paragraph(style="Body Text")
    r = p.add_run(label + ": ")
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(NAVY)
    p.add_run(text)
    return p


def add_heading(doc, text: str, level: int):
    p = doc.add_heading(text, level=level)
    set_keep(p, with_next=True, together=True)
    return p


def add_table(
    doc,
    headers: list[str],
    rows: Iterable[Iterable[str]],
    widths: list[float],
    font_size: float = 8.3,
):
    rows = list(rows)
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    set_table_fixed(table)
    set_table_borders(table)
    header = table.rows[0]
    set_repeat_table_header(header)
    prevent_row_split(header)
    for idx, text in enumerate(headers):
        cell = header.cells[idx]
        set_cell_width(cell, widths[idx])
        set_cell_shading(cell, NAVY)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        r.bold = True
        r.font.color.rgb = RGBColor.from_string(WHITE)
        r.font.size = Pt(font_size)
    for row_idx, values in enumerate(rows):
        row = table.add_row()
        prevent_row_split(row)
        for idx, value in enumerate(values):
            cell = row.cells[idx]
            set_cell_width(cell, widths[idx])
            set_cell_margins(cell)
            if row_idx % 2 == 1:
                set_cell_shading(cell, "FAFBFC")
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            r = p.add_run(str(value))
            r.font.size = Pt(font_size)
            r.font.color.rgb = RGBColor.from_string(DARK)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def configure_styles(doc: Document) -> None:
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor.from_string(DARK)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.10
    normal.paragraph_format.widow_control = True

    body = styles["Body Text"]
    body.font.name = "Calibri"
    body.font.size = Pt(11)
    body.font.color.rgb = RGBColor.from_string(DARK)
    body._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    body.paragraph_format.space_after = Pt(6)
    body.paragraph_format.line_spacing = 1.10
    body.paragraph_format.widow_control = True

    for style_name, size, color, before, after in (
        ("Heading 1", 16, BLUE, 16, 8),
        ("Heading 2", 13, BLUE, 12, 6),
        ("Heading 3", 12, NAVY, 8, 4),
    ):
        st = styles[style_name]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = RGBColor.from_string(color)
        st._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.keep_with_next = True
        st.paragraph_format.keep_together = True

    for style_name in ("List Bullet", "List Bullet 2", "List Number", "List Number 2"):
        st = styles[style_name]
        st.font.name = "Calibri"
        st.font.size = Pt(11)
        st._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
        st.paragraph_format.space_after = Pt(8)
        st.paragraph_format.line_spacing = 1.167
    styles["List Bullet"].paragraph_format.left_indent = Inches(0.5)
    styles["List Bullet"].paragraph_format.first_line_indent = Inches(-0.25)
    styles["List Number"].paragraph_format.left_indent = Inches(0.5)
    styles["List Number"].paragraph_format.first_line_indent = Inches(-0.25)
    styles["List Bullet 2"].paragraph_format.left_indent = Inches(0.75)
    styles["List Bullet 2"].paragraph_format.first_line_indent = Inches(-0.25)
    styles["List Number 2"].paragraph_format.left_indent = Inches(0.75)
    styles["List Number 2"].paragraph_format.first_line_indent = Inches(-0.25)

    if "Report Title" not in styles:
        st = styles.add_style("Report Title", WD_STYLE_TYPE.PARAGRAPH)
    else:
        st = styles["Report Title"]
    st.font.name = "Calibri"
    st.font.size = Pt(27)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(NAVY)
    st._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    st.paragraph_format.space_after = Pt(8)
    st.paragraph_format.line_spacing = 1.0

    if "Report Subtitle" not in styles:
        st = styles.add_style("Report Subtitle", WD_STYLE_TYPE.PARAGRAPH)
    else:
        st = styles["Report Subtitle"]
    st.font.name = "Calibri"
    st.font.size = Pt(14)
    st.font.color.rgb = RGBColor.from_string(MUTED)
    st._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    st.paragraph_format.space_after = Pt(16)
    st.paragraph_format.line_spacing = 1.05

    if "Kicker" not in styles:
        st = styles.add_style("Kicker", WD_STYLE_TYPE.PARAGRAPH)
    else:
        st = styles["Kicker"]
    st.font.name = "Calibri"
    st.font.size = Pt(9.5)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(GOLD)
    st._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    st.paragraph_format.space_after = Pt(10)

    if "Small Note" not in styles:
        st = styles.add_style("Small Note", WD_STYLE_TYPE.PARAGRAPH)
    else:
        st = styles["Small Note"]
    st.font.name = "Calibri"
    st.font.size = Pt(9)
    st.font.color.rgb = RGBColor.from_string(MUTED)
    st._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    st.paragraph_format.space_after = Pt(4)
    st.paragraph_format.line_spacing = 1.05


def configure_document(doc: Document) -> None:
    configure_styles(doc)
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)
    section.different_first_page_header_footer = True

    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run("PARECER CRÍTICO  |  TEORIAS DE MATHEUS CAMARGO")
    r.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor.from_string(MUTED)
    set_bottom_border(p, color=MID_GRAY, size="6", space="3")

    footer = section.footer
    p = footer.paragraphs[0]
    add_page_number(p)

    settings = doc.settings._element
    update_fields = OxmlElement("w:updateFields")
    update_fields.set(qn("w:val"), "true")
    settings.append(update_fields)

    doc.core_properties.title = "Parecer crítico integral das teorias — 2026"
    doc.core_properties.subject = "Avaliação científica, conceitual e de proveniência"
    doc.core_properties.author = "OpenAI Codex, a pedido de Matheus Camargo"
    doc.core_properties.keywords = "cosmologia, hipóteses, parecer, recorrência, ER=EPR, falso vácuo"
    doc.core_properties.comments = (
        "Relatório independente baseado no acervo local e em referências primárias/autoridades "
        "consultadas até 17 de julho de 2026."
    )


def add_cover(doc: Document) -> None:
    for _ in range(3):
        doc.add_paragraph()
    p = doc.add_paragraph(style="Kicker")
    p.add_run("PARECER TÉCNICO INDEPENDENTE  •  EDIÇÃO 1.0")
    p = doc.add_paragraph(style="Report Title")
    p.add_run("Parecer crítico integral\ndas teorias")
    p = doc.add_paragraph(style="Report Subtitle")
    p.add_run(
        "O que é promissor, o que precisa ser reformulado e o que não se sustenta — "
        "com justificativa por ideia, auditoria de autoria e caminhos de teste."
    )
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("Matheus Camargo")
    r.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = RGBColor.from_string(NAVY)
    p = doc.add_paragraph(style="Small Note")
    p.add_run("Acervo revisto: Desenvolvimento/Teorias, Desenvolvimento/docs e arquivos técnicos referenciados")

    for _ in range(5):
        doc.add_paragraph()
    p = doc.add_paragraph(style="Small Note")
    p.add_run("Data de corte científico: 17 de julho de 2026  |  São Paulo, Brasil")
    p = doc.add_paragraph(style="Small Note")
    p.add_run(
        "Natureza do documento: avaliação crítica e orientação de pesquisa. "
        "Não substitui revisão por pares nem constitui validação de uma descoberta."
    )
    doc.add_page_break()


def add_executive_summary(doc: Document) -> None:
    add_heading(doc, "1. Veredito executivo", 1)
    add_callout(
        doc,
        "Conclusão central",
        "O acervo contém perguntas boas e algumas sínteses pessoais férteis, mas nenhuma das entradas é hoje "
        "uma teoria científica completa. O valor mais forte está na capacidade de conectar problemas reais — "
        "cones de luz, relógios relativísticos, recorrência, vacua, astrobiologia e instrumentação — e não em "
        "mecanismos já demonstrados. As melhores linhas sobrevivem quando são reduzidas a perguntas formais e "
        "previsões observáveis.",
        "blue",
    )
    add_body(
        doc,
        "A revisão encontrou dez fichas públicas, mas apenas seis núcleos físico-cosmológicos distintos. "
        "T-08 repete T-02; T-07 é um framework editorial; T-09 é uma heurística de decisão; T-10 é um programa "
        "prático de ciência e computação. Além disso, as conversas preservam ideias relevantes que não foram "
        "catalogadas, especialmente a analogia do universo como sistema distribuído assíncrono, um modelo em "
        "camadas para vida extraterrestre e reflexões sobre matéria e identidade. [L2, L3, L5, L6]"
    )

    add_heading(doc, "As linhas realmente mais promissoras", 2)
    executive_num_id = create_decimal_numbering(doc)
    add_number(
        doc,
        "Relógios em vazios e expansão diferencial, dentro de T-05. É o melhor núcleo científico do conjunto "
        "porque parte de relatividade geral real, toca uma controvérsia observacional ativa — backreaction e "
        "modelos inhomogêneos — e admite testes com supernovas, BAO, sirenes padrão, fluxo de Hubble e redshift "
        "drift. A versão “universo dentro de um buraco negro” é muito mais especulativa e deve ser separada.",
        executive_num_id,
    )
    add_number(
        doc,
        "T-01 reformulada como inferência no cone de luz e arquitetura de observatórios distribuídos. O atraso "
        "da luz é real e reconstruir o estado mais provável de um sistema distante é um problema científico e "
        "computacional legítimo. O “atalho” causal, porém, não funciona: lentes e entrelaçamento não entregam à "
        "Terra informação antes do limite luminoso.",
        executive_num_id,
    )
    add_number(
        doc,
        "T-02/T-08 reformuladas como estabilidade e decaimento de falso vácuo. É uma área real de teoria de "
        "campos e cosmologia, mas a tese de que o “nada” precisa flutuar e inevitavelmente produzir outro Big Bang "
        "é incorreta. A promessa nasce apenas quando se define um campo, um potencial e uma taxa de tunelamento.",
        executive_num_id,
    )
    add_number(
        doc,
        "T-04 como problema matemático: sob quais hipóteses uma dinâmica cosmológica poderia ser recorrente? "
        "É uma boa pergunta formalizável. Não autoriza concluir que todos os eventos ocorrerão, que a história "
        "se repetirá exatamente ou que um universo espacialmente finito tenha automaticamente estados finitos.",
        executive_num_id,
    )
    add_number(
        doc,
        "T-03 como um único modelo de bounce ou ciclo, não como colagem de Big Freeze, decaimento do próton, "
        "buracos negros sobreviventes, recorrência e novo Big Bang. Modelos cíclicos específicos são pesquisa "
        "legítima; a cadeia atual não possui mecanismo causal comum.",
        executive_num_id,
    )

    add_heading(doc, "As linhas mais promissoras fora da categoria “nova teoria física”", 2)
    add_bullet(
        doc,
        "T-10 — ciência como extensão dos sentidos: é o projeto mais praticável agora. Dados públicos, "
        "espectroscopia, simulação e software podem virar um laboratório computacional reproduzível.",
    )
    add_bullet(
        doc,
        "T-07 — Backend da Existência: forte como linguagem, mapa de perguntas e método editorial; fraco como "
        "teoria porque não produz uma previsão falsificável.",
    )
    add_bullet(
        doc,
        "Universo como sistema distribuído assíncrono: analogia pessoal muito fértil para ensinar simultaneidade "
        "relativa e tempo próprio, desde que preserve a ordem causal dos eventos ligados por luz ou matéria.",
    )
    add_bullet(
        doc,
        "Astrobiologia em camadas: separar abiogênese, vida complexa, inteligência, tecnologia e duração "
        "detectável é uma boa base para um modelo bayesiano/Drake com incertezas explícitas.",
    )
    add_bullet(
        doc,
        "T-09 — Zero versus epsilon: útil como regra de ação de baixo custo; precisa incorporar utilidade "
        "esperada, risco, custo de oportunidade e aprendizado.",
    )

    add_heading(doc, "Afirmações que devem ser abandonadas na forma atual", 2)
    for item in (
        "Entrelaçamento ou ER=EPR permitiria ler o interior de um buraco negro por uma partícula externa.",
        "Lentes gravitacionais ou uma sonda enviada agora poderiam trazer à Terra o “presente” de uma fonte antes do caminho causal mais rápido.",
        "O princípio de incerteza obriga energia a surgir do zero e torna inevitável um novo Big Bang.",
        "Universo finito implica número finito de estados, visita a todas as possibilidades e repetição exata de pessoas e conversas.",
        "Buracos negros observados em alto redshift são mais velhos que o universo ou sobreviveram a um ciclo anterior.",
        "O raio comóvel observável de cerca de 46,5 bilhões de anos-luz é um horizonte de Schwarzschild do universo.",
        "Big Freeze tem probabilidade científica superior a 90% e Big Bounce de 5–10%. Esses percentuais foram inventados na conversa e não são inferências aceitas.",
        "Um universo infinito torna acontecimentos fisicamente impossíveis possíveis.",
    ):
        add_bullet(doc, item)

    add_callout(
        doc,
        "Sobre a “observação não-linear”",
        "O estado presente exato de uma região fora do nosso cone de luz passado não é apenas difícil de testar "
        "com a tecnologia atual. Sob a relatividade, ele não pode ser conhecido operacionalmente antes que um "
        "sinal causal chegue. O que pode ser testado hoje é a qualidade da inferência, a expansão por ambiente, "
        "os atrasos de lentes e a consistência de modelos que reconstruam o estado provável.",
        "amber",
    )


def add_scope_method(doc: Document) -> None:
    add_heading(doc, "2. Escopo, autoria e método", 1)
    add_heading(doc, "Cobertura documental", 2)
    add_body(
        doc,
        "Foram lidos integralmente os dez arquivos existentes nas pastas solicitadas, sem amostragem, e quatro "
        "arquivos técnicos apontados diretamente pela documentação de integração. Isso totaliza 14 arquivos "
        "físicos. Três arquivos de 9.774 bytes são cópias byte a byte do mesmo texto; por isso contam como uma "
        "fonte lógica, não como três confirmações independentes. O inventário completo aparece no Apêndice A."
    )
    add_body(
        doc,
        "Os arquivos HTML, CSS e JavaScript da interface foram revisados porque os rótulos, percentuais e filtros "
        "podem transmitir uma impressão de maturidade científica. O próprio documento de integração esclarece "
        "que “progress” mede maturidade editorial, não credibilidade; os percentuais, contudo, não têm rubrica "
        "publicada e não devem ser lidos como probabilidade de a teoria estar correta. [L5–L9]"
    )

    add_heading(doc, "O que pode ser chamado de “ideia sua”", 2)
    add_callout(
        doc,
        "Proveniência",
        "A formulação mais honesta é: “Intuições e hipóteses de Matheus Camargo, desenvolvidas e organizadas em "
        "diálogo com modelos de linguagem”. A melhor fonte de autoria direta é a conversa [L2], onde as falas do "
        "autor aparecem como consultas. O backup [L3] admite não ter acesso integral ao histórico e funciona como "
        "índice temático, não como transcrição literal.",
        "green",
    )
    add_body(
        doc,
        "Há contribuição pessoal clara na escolha das perguntas, nas conexões entre temas, nas metáforas de "
        "software, no desejo de “interceptar a carta” da luz, na combinação entre finitude e recorrência, na "
        "analogia do universo distribuído e na hierarquia vida → complexidade → inteligência → tecnologia. "
        "Entretanto, nomes de teorias, explicações técnicas, percentuais, paralelos com autores e várias "
        "validações foram acrescentados ou ampliados pelo GPT. [L1–L4]"
    )
    add_body(
        doc,
        "Quase todos os ingredientes amplos têm precedentes: recorrência de Poincaré, decaimento de falso vácuo, "
        "cosmologias cíclicas, backreaction/timescape, universos-filhos em buracos negros e ER=EPR. Assim, a "
        "originalidade defensável está principalmente na síntese, na linguagem e na trajetória de perguntas — "
        "não em prioridade científica demonstrada. Para reivindicar uma contribuição nova seria necessário "
        "comparar formalmente o modelo com a literatura e produzir uma consequência que os modelos existentes "
        "não produzam."
    )

    add_heading(doc, "Rubrica usada", 2)
    add_body(
        doc,
        "Cada linha foi julgada por cinco critérios: coerência interna; vínculo com pesquisa existente; "
        "formalizabilidade; testabilidade/falsificabilidade; e distinção em relação à literatura. “Promissora” "
        "não significa “provável que esteja correta”. Significa que há uma pergunta bem definida, um caminho "
        "realista para matemática ou dados e a possibilidade de a hipótese perder para a evidência."
    )
    add_table(
        doc,
        ["Classe", "Significado usado neste parecer"],
        [
            ("Alta", "Há programa concreto, observáveis ou método útil agora; ainda pode não ser uma teoria nova."),
            ("Média", "Existe um núcleo legítimo, mas ele depende de reformulação, premissas explícitas e cálculo."),
            ("Baixa", "A ideia pode inspirar estudo, porém o mecanismo atual não produz teste ou conflita com física estabelecida."),
            ("Inviável como escrita", "O mecanismo exigiria violar causalidade, no-signalling ou outra condição já bem sustentada."),
            ("Filosófica/metodológica", "Pode ter valor intelectual ou prático, mas não deve ser apresentada como hipótese cosmológica."),
        ],
        [1.2, 5.3],
        font_size=8.8,
    )


def add_matrix(doc: Document) -> None:
    add_heading(doc, "3. Matriz geral das dez entradas públicas", 1)
    rows = [
        ("T-01", "Observação Não-Linear", "Baixa como atalho causal", "Média como inferência/observação distribuída", "Parte testável agora; “presente” remoto exato é causalmente inacessível"),
        ("T-02", "Instabilidade do Vazio", "Baixa", "Média com V(φ) e taxa de decaimento", "Indireta por partículas/cosmologia"),
        ("T-03", "Ciclagem Eterna", "Baixa", "Média-baixa após escolher um modelo", "Somente por previsões de um modelo específico"),
        ("T-04", "Contentor Finito", "Baixa como certeza cósmica", "Média como problema matemático", "Hipóteses parcialmente testáveis; recorrência global não"),
        ("T-05", "Gênese do Tempo / Universo-BH", "Mista", "Média-alta para vazios; baixa para universo-pai", "Vazios testáveis; universo-pai muito indireto"),
        ("T-06", "ER=EPR e Sondas", "Inviável como telemetria", "Média como teoria/simulação", "Simuladores e toy models; não a sonda proposta"),
        ("T-07", "Backend da Existência", "Não é teoria física", "Alta como framework editorial", "Avaliação prática, não falsificação cosmológica"),
        ("T-08", "Gênese por Flutuação", "Redundante", "Fundir em T-02", "Mesmos testes de T-02"),
        ("T-09", "Zero vs. Epsilon", "Não é cosmologia", "Alta como heurística qualificada", "Diário decisório e resultados"),
        ("T-10", "Horizonte dos Sentidos", "Não é nova física", "Alta como projeto prático", "Executável agora"),
    ]
    add_table(
        doc,
        ["ID", "Linha", "Como está", "Promessa real", "Testabilidade"],
        rows,
        [0.5, 1.25, 1.35, 1.65, 1.75],
        font_size=7.6,
    )
    add_body(
        doc,
        "Leitura importante: a coluna “promessa real” avalia a melhor versão recuperável da ideia, não a "
        "formulação mais forte presente nas conversas. Os pareceres detalhados abaixo mostram precisamente o que "
        "precisa ser preservado, removido e demonstrado."
    )


THEORIES = [
    {
        "id": "T-01",
        "title": "Observação Não-Linear",
        "verdict": "PROMISSORA SOMENTE APÓS REFORMULAÇÃO",
        "kind": "amber",
        "promise": "Média como programa observacional e computacional; baixa como “hack” de causalidade.",
        "core": (
            "A astronomia observa fontes em tempos passados porque a luz leva tempo para chegar. A proposta tenta "
            "reduzir essa latência usando observadores adiantados, lentes gravitacionais, rotas alternativas de "
            "fótons, entrelaçamento ou ER=EPR, e sugere que a imagem de expansão homogênea pode esconder regiões "
            "que hoje estariam em outro estado. [L1, L6]"
        ),
        "why": [
            "O lookback time e o cone de luz passado são fatos centrais da cosmologia observacional.",
            "A expansão não é localmente idêntica: estruturas ligadas podem colapsar, vazios e paredes têm ambientes diferentes e a influência da inhomogeneidade sobre médias cosmológicas é uma pergunta real.",
            "Reconstruir o estado presente mais provável a partir de dados atrasados é um problema legítimo de inferência, assimilação de dados e simulação.",
            "Lentes com múltiplas imagens e atrasos medidos permitem observar a mesma fonte em épocas de emissão ligeiramente diferentes; isso é útil para cosmologia e dinâmica de transientes. [R2, R3]",
        ],
        "limits": [
            "Não existe um “agora” absoluto global. Para eventos separados espacialmente, a simultaneidade depende do referencial; a ordem causal, porém, não pode ser invertida.",
            "Um detector já posicionado mais perto da fonte pode receber emissão mais recente localmente, mas retransmitir o resultado à Terra não vence o caminho causal mais rápido. Enviar a sonda agora tampouco recupera informação anterior ao cone de luz.",
            "Lentes criam caminhos ópticos e atrasos geométricos/de Shapiro; não puxam dados do futuro.",
            "Entrelaçamento não permite sinalização. Operações na metade remota não mudam as estatísticas locais disponíveis ao observador externo. [R16–R19]",
            "Homogeneidade cosmológica é estatística em grande escala, não a afirmação de que todo ponto do universo expanda da mesma maneira.",
        ],
        "test": (
            "Definir um problema restrito: por exemplo, estimar H_void−H_wall, reconstruir a curva de luz de um "
            "transiente fortemente lenteado ou comparar um filtro bayesiano com observações posteriores. Prever "
            "redshift drift, velocidades peculiares, sirenes padrão ou anisotropia de H0 sob um modelo ambiental. "
            "O “estado presente exato” de uma região causalmente distante não é observável antes do sinal; a "
            "qualidade da inferência é observável."
        ),
        "originality": (
            "Baixa nos ingredientes físicos, que já existem. Média na metáfora de interceptar uma carta em trânsito "
            "e no impulso de transformar o problema em arquitetura distribuída de observação."
        ),
        "next": (
            "Renomear para “Reconstrução causal e observação distribuída do estado cósmico”. Retirar ER=EPR e "
            "qualquer promessa de antecipação causal. Escolher um dataset de lentes ou simulação de cone de luz e "
            "definir uma métrica de erro antes de olhar o resultado."
        ),
    },
    {
        "id": "T-02",
        "title": "Instabilidade Probabilística do Vazio",
        "verdict": "NÚCLEO LEGÍTIMO; MECANISMO ATUAL INCORRETO",
        "kind": "amber",
        "promise": "Média como estudo formal de falso vácuo; baixa como inevitabilidade de um novo Big Bang.",
        "core": (
            "Após um estado de vazio extremo, o princípio de incerteza impediria energia exatamente zero; "
            "flutuações ou partículas virtuais acumulariam energia, o falso vácuo tunelaria e nasceria um novo "
            "universo. [L1, L4, L6]"
        ),
        "why": [
            "Decaimento de falso vácuo por nucleação de bolhas é um tema real de teoria quântica de campos com gravidade. [R9]",
            "A estabilidade do vácuo eletrofraco depende de parâmetros medidos e continua sendo uma questão quantitativa ativa. [R10]",
            "Transições de fase cosmológicas podem, em modelos específicos, deixar ondas gravitacionais ou outras assinaturas.",
        ],
        "limits": [
            "Vácuo quântico não é “nada absoluto”: já pressupõe campos, espaço-tempo, estado e leis.",
            "A relação energia–tempo não obriga um estado fundamental de energia definida a flutuar nem proíbe energia zero por princípio.",
            "Partículas virtuais não são objetos que tomam energia emprestada e a devolvem; essa é uma metáfora de cálculo perturbativo.",
            "Tunelamento não é acúmulo de pequenas energias. A taxa depende do potencial, da barreira e da solução de bounce.",
            "Um vácuo verdadeiro pode ser estável. Mesmo quando há decaimento, a bolha não é automaticamente um “novo Big Bang” observável.",
        ],
        "test": (
            "Escolher um campo φ e um potencial V(φ); identificar falso e verdadeiro mínimos; calcular a ação de "
            "bounce e Γ/V≈A·exp(−B/ℏ); verificar se a vida do vácuo é compatível com a idade cósmica; derivar uma "
            "assinatura de transição de fase. Sem esses elementos a ideia acomoda qualquer resultado."
        ),
        "originality": (
            "Baixa na física de falso vácuo e inflação; média na narrativa “o silêncio absoluto não se sustenta”. "
            "A narrativa, porém, não equivale a uma derivação."
        ),
        "next": (
            "Fundir T-02 e T-08. Trocar “nada” por um estado de vácuo explicitamente definido e separar três "
            "perguntas: estabilidade do nosso vácuo, cosmologia de uma bolha e origem de condições inflacionárias."
        ),
    },
    {
        "id": "T-03",
        "title": "Ciclagem Eterna e Reboot do Vácuo",
        "verdict": "ESPECULATIVA; PRECISA SER DESMONTADA E RECONSTRUÍDA",
        "kind": "red",
        "promise": "Baixa na cadeia atual; média-baixa se virar um único modelo cíclico com previsões.",
        "core": (
            "Big Freeze, decaimento do próton, desaparecimento de matéria e buracos negros levariam a um vazio que "
            "gera outro Big Bang/Big Bounce; buracos negros poderiam sobreviver como portais ou arquivos entre "
            "ciclos, e a recorrência repetiria configurações. [L1, L3, L6]"
        ),
        "why": [
            "Cosmologias ekpiróticas, cíclicas, de loop quantum cosmology e outras propostas de bounce são linhas teóricas reais. [R11, R12]",
            "A pergunta “o Big Bang foi origem absoluta ou transição?” é legítima.",
            "Modelos específicos podem ser confrontados com espectro primordial, não gaussianidade, ondas gravitacionais, curvatura e CMB.",
        ],
        "limits": [
            "Decaimento do próton nunca foi observado. O limite parcial p→e+π0 é superior a 2,4×10³⁴ anos; os “23 quatrilhões” do arquivo ficam cerca de 18 ordens de grandeza abaixo e não podem ser usados. [R14]",
            "Big Freeze significa perda de energia livre utilizável e aproximação do equilíbrio, não energia total igual a zero nem desaparecimento das leis.",
            "Expansão fria não se transforma espontaneamente em contração. Um bounce exige dinâmica gravitacional específica e condições que evitem a singularidade.",
            "Buracos negros semiclassicamente evaporam; sobrevivência entre ciclos exigiria remanescentes ou nova física. Buracos negros massivos precoces não são mais velhos que o universo.",
            "A entropia entre ciclos precisa ser explicada. Apenas repetir “ciclo” não resolve o crescimento entrópico.",
            "O destino cósmico não tem percentuais consensuais de 90% e 5–10%. Em 2025, combinações de DESI com outros dados produziram indícios, não descoberta, de energia escura evolutiva; a análise completa de cinco anos é esperada em 2027. [R4, R5]",
        ],
        "test": (
            "Escolher um único formalismo — por exemplo, um cenário ekpirótico, LQC ou Einstein–Cartan — e derivar "
            "um espectro primordial, razão tensor-escalar, não gaussianidade, fundo de ondas gravitacionais ou "
            "assinatura topológica exclusiva. Declarar o mecanismo de entropia e um critério de refutação."
        ),
        "originality": (
            "Baixa nos componentes; média na síntese “morte dimensional + buracos negros-arquivo”. O elemento mais "
            "original é também o menos sustentado."
        ),
        "next": (
            "Eliminar o prazo de decaimento do próton, a ideia de buracos negros ancestrais como evidência e a "
            "expressão “dimensões morrem”. Criar documentos separados para: destino térmico, bounce e "
            "sobrevivência de informação."
        ),
    },
    {
        "id": "T-04",
        "title": "Topologia do Contentor Finito",
        "verdict": "BOA PERGUNTA MATEMÁTICA; CONCLUSÃO CÓSMICA EXAGERADA",
        "kind": "amber",
        "promise": "Média como problema de sistemas dinâmicos; baixa como previsão de repetição exata do universo.",
        "core": (
            "Se o universo tiver volume e energia finitos, teria estados finitos; em tempo infinito, todas as "
            "possibilidades ocorreriam e cada configuração retornaria exatamente, transformando probabilidade em "
            "destino. [L1, L2, L4, L6]"
        ),
        "why": [
            "O teorema de recorrência de Poincaré é rigoroso e fornece uma ponte real entre dinâmica, medida e retorno.",
            "Perguntar se um modelo cosmológico satisfaz as hipóteses de recorrência é formalizável.",
            "Topologia, curvatura e alguns pressupostos cosmológicos podem ser restringidos observacionalmente.",
        ],
        "limits": [
            "O teorema requer transformação que preserve medida em espaço de medida finita; não decorre apenas de volume espacial e energia finitos. [R7]",
            "Sistemas contínuos podem ter infinitos estados. Um cutoff ou limite entrópico teria de ser justificado.",
            "O retorno é em geral arbitrariamente próximo e para quase todo estado adequado, não necessariamente exato e não obrigatoriamente para todo estado imaginável.",
            "Recorrência não implica que uma órbita visite todas as configurações; seriam necessárias hipóteses adicionais como ergodicidade e evento de medida positiva.",
            "Universo finito, universo fechado, curvatura positiva, sistema isolado e espaço de fase finito são conceitos diferentes.",
            "Uma cosmologia em expansão, com gravidade, horizontes e eventual decaimento de vácuo pode não satisfazer as condições do teorema. [R8]",
        ],
        "test": (
            "Especificar topologia, Hamiltoniano, medida invariante, cutoff, entropia, espectro e propriedades "
            "ergódicas. Demonstrar a recorrência em um toy model antes de extrapolar ao cosmos. A recorrência "
            "global em escalas extremas não é diretamente observável hoje; as premissas geométricas e dinâmicas "
            "são parcialmente testáveis."
        ),
        "originality": (
            "Baixa cientificamente, pois o eterno retorno e Poincaré são anteriores; média na tradução para a "
            "linguagem de contentor/estado/backend."
        ),
        "next": (
            "Renomear para “Condições de recorrência em cosmologias finitas”. Trocar a afirmação “vai acontecer” "
            "por uma lista explícita de hipóteses e contraexemplos."
        ),
    },
    {
        "id": "T-05",
        "title": "Gênese Gravitacional do Tempo / Universo-Buraco-Negro",
        "verdict": "O NÚCLEO MAIS INTERESSANTE, MAS CONTÉM QUATRO TESES DIFERENTES",
        "kind": "green",
        "promise": "Média-alta para relógios/inhomogeneidade; baixa–média para universo-filho; baixa para seta e horizonte.",
        "core": (
            "Relógios correriam mais rápido em vazios; energia e ondas gravitacionais alterariam o tempo; o "
            "universo observável poderia ser o interior de um buraco negro-pai; a gravidade externa daria origem "
            "à seta temporal e cada buraco negro semearia outro universo. [L1, L3, L6]"
        ),
        "why": [
            "Tempo próprio depende da métrica e da trajetória; diferenças de potencial e velocidade entre relógios são reais e amplamente testadas.",
            "Energia, momento e pressão entram no tensor energia-momento; ondas gravitacionais são perturbações da métrica.",
            "Backreaction e cosmologias inhomogêneas são temas ativos. Uma análise recente do Pantheon+ encontrou preferência pelo modelo timescape dentro do método usado pelos autores; isso é evidência a investigar, não consenso. [R6]",
            "Modelos de universo-filho em buraco negro existem, por exemplo em gravidade Einstein–Cartan com torsão e bounce. [R15]",
        ],
        "limits": [
            "Localmente, todo relógio ideal mede um segundo por segundo. “Tempo mais rápido no vazio” só tem sentido como comparação de tempos próprios ao longo de trajetórias e geometrias definidas.",
            "O efeito de potenciais cosmológicos pode ser pequeno; afirmar que ele substitui energia escura exige ajuste conjunto a supernovas, BAO, CMB e outros dados.",
            "O raio comóvel do universo observável não é um raio de Schwarzschild. Horizonte de partículas, horizonte de Hubble e horizonte de eventos são conceitos diferentes. [R1]",
            "O interior de um buraco negro de Schwarzschild não é automaticamente um universo FLRW homogêneo. É preciso nova dinâmica e condições de junção.",
            "A seta do tempo é normalmente tratada por baixa entropia inicial e crescimento de entropia; “gravidade-mãe imprime direção” não foi derivado.",
            "Dizer que uma fusão libera energia e portanto “dilata o tempo” não é uma teoria separada; é preciso calcular a perturbação métrica e o observável.",
        ],
        "test": (
            "Separar quatro projetos. (A) Relógios/vazios: prever Δτ/τ e H_void−H_wall; comparar com SN, BAO, "
            "CMB, lentes, sirenes e redshift drift. (B) Universo-filho: escolher ação, métrica, matéria/torsão, "
            "matching e bounce; derivar curvatura, anisotropia ou espectro primordial. (C) Seta: formular variável "
            "entrópica e condição de contorno. (D) Ondas: calcular resposta de relógios/interferômetros."
        ),
        "originality": (
            "Baixa na dilatação temporal, timescape e universo-em-buraco-negro; média na síntese da gravidade-mãe "
            "como origem da seta. Síntese nova não basta se não produzir equações ou observáveis novos."
        ),
        "next": (
            "Priorizar o projeto A, porque é o único com caminho observacional próximo. Tratar o projeto B como "
            "modelo de alto risco e longo prazo. Remover da mesma ficha a equivalência de horizonte e a tese da seta."
        ),
    },
    {
        "id": "T-06",
        "title": "ER=EPR e Sondas Quânticas",
        "verdict": "INVIÁVEL COMO SONDA; ÚTIL COMO ESTUDO TEÓRICO",
        "kind": "red",
        "promise": "Baixa como telemetria astrofísica; média como agenda de informação quântica e simulação.",
        "core": (
            "Manter metade de um par entrelaçado do lado de fora e lançar a outra no buraco negro permitiria "
            "monitorar o interior, mapear dimensões ou construir uma ponte entre relatividade e mecânica quântica. "
            "[L1, L3, L6]"
        ),
        "why": [
            "ER=EPR é uma conjectura importante na discussão moderna sobre geometria, entrelaçamento e informação de buracos negros. [R16]",
            "Scrambling, teleportação, códigos holográficos e wormholes traversáveis em toy models são linhas teóricas reais.",
            "Circuitos e simuladores quânticos podem reproduzir aspectos de dinâmica da informação, mesmo sem criar um buraco negro astrofísico.",
        ],
        "limits": [
            "A estatística local da partícula externa é aleatória e não revela a escolha ou o resultado obtido na metade interna.",
            "Correlações só aparecem ao comparar registros por um canal clássico. Dados do interior não podem atravessar o horizonte por esse canal.",
            "Teleportação quântica exige informação clássica. [R17]",
            "ER=EPR não afirma que qualquer par de partículas forme um portal atravessável. Protocolos de wormholes traversáveis exigem interações especiais e preservam causalidade. [R18]",
            "Para a sonda funcionar seria preciso observar uma violação reproduzível de no-signalling, em conflito com o formalismo e com testes existentes. [R19]",
        ],
        "test": (
            "Reformular como estudo de quantum information: implementar protocolos de scrambling/teleportação em "
            "circuitos; medir recuperação de informação sob canais ruidosos; comparar com modelos holográficos. "
            "Isso testa o toy model, não o interior de um buraco negro real."
        ),
        "originality": (
            "Baixa nos ingredientes; média na aplicação direta como sonda. A aplicação é justamente a parte "
            "impedida por no-signalling."
        ),
        "next": (
            "Trocar o nome para “ER=EPR, scrambling e limites operacionais de sondagem”. Colocar a impossibilidade "
            "de comunicação como resultado central, não como detalhe a ser contornado."
        ),
    },
    {
        "id": "T-07",
        "title": "Backend da Existência",
        "verdict": "FORTE COMO FRAMEWORK; NÃO É TEORIA FÍSICA",
        "kind": "green",
        "promise": "Alta como método de organização, comunicação e aprendizagem.",
        "core": (
            "O universo é descrito como um backend: regras, estados, limites de observação, inputs controláveis e "
            "outputs parcialmente imprevisíveis. A ficha integra tempo, finitude, vazio, recorrência, decisão e "
            "instrumentos. [L4, L6]"
        ),
        "why": [
            "A metáfora combina com a formação em software e pode tornar conceitos difíceis navegáveis.",
            "Um mapa explícito de hipóteses, dependências, evidências e objeções reduz a chance de confundir intuição com resultado.",
            "Pode virar um caderno de pesquisa versionado, uma ferramenta educacional ou um ensaio autoral.",
        ],
        "limits": [
            "Metáforas não herdam automaticamente a matemática do domínio de origem: universo não é literalmente software nem precisa ter programador, clock global ou estado finito.",
            "A ficha repete T-02, T-04, T-09 e T-10; não é um núcleo independente.",
            "Sem previsão exclusiva, não há como falsificá-la como teoria cosmológica.",
        ],
        "test": (
            "Avaliar o framework por utilidade: rastreabilidade de fontes, capacidade de revelar contradições, "
            "qualidade das perguntas e reprodução de análises. Isso é teste de método, não teste do universo."
        ),
        "originality": (
            "Média-alta na linguagem e combinação pessoal; baixa como afirmação física. Esta é uma área em que a "
            "autoria da forma pode ser defendida sem reivindicar descoberta cosmológica."
        ),
        "next": (
            "Transformar cada entrada em um registro versionado com campos: premissas, mecanismo, equações, "
            "antecedentes, objeções, observáveis, critérios de refutação, confiança e histórico de revisão."
        ),
    },
    {
        "id": "T-08",
        "title": "Gênese por Flutuação do Vácuo",
        "verdict": "NÃO É UMA TEORIA INDEPENDENTE",
        "kind": "amber",
        "promise": "Nula como entrada separada; média quando fundida à T-02.",
        "core": (
            "Retoma a tese de que uma flutuação do vazio pode iniciar uma nova fase cósmica. O próprio catálogo a "
            "trata como derivação. [L4, L6]"
        ),
        "why": [
            "Pode ser útil distinguir “estabilidade do vácuo” de “cosmologia no interior de uma bolha” se cada uma tiver modelo e observáveis próprios.",
            "Transições de fase e cosmogenesis são problemas legítimos em modelos específicos.",
        ],
        "limits": [
            "O conteúdo atual repete T-02 e parte de T-03 sem mecanismo novo.",
            "Duplicação infla o número público de “teorias” e dá falsa impressão de confirmação por linhas independentes.",
            "Flutuação, tunelamento, inflação e novo Big Bang são conceitos diferentes e não devem ser usados como sinônimos.",
        ],
        "test": (
            "Usar os mesmos requisitos de T-02: campo, potencial, taxa de nucleação e assinatura. Só manter uma "
            "segunda ficha se ela fizer uma pergunta distinta — por exemplo, geometria e observáveis dentro da bolha."
        ),
        "originality": "Baixa; é uma recodificação editorial de material já presente.",
        "next": "Fundir em T-02 e registrar a relação com T-03 como dependência, não como nova teoria.",
    },
    {
        "id": "T-09",
        "title": "Zero versus Epsilon",
        "verdict": "BOA HEURÍSTICA, DESDE QUE INCLUA CUSTOS",
        "kind": "green",
        "promise": "Alta como filosofia operacional; nenhuma como teoria cosmológica.",
        "core": (
            "Se não agir produz chance zero e agir produz chance positiva, escolher a ação seria racionalmente "
            "superior; o arrependimento da inação tenderia a acumular mais que a dor da falha. [L2, L4, L6]"
        ),
        "why": [
            "Para metas binárias e tentativas de baixo custo, a regra combate paralisia e cria oportunidades de aprendizado.",
            "A ideia pode ser convertida em experimento pessoal com registros de previsão, custo e resultado.",
            "Combina com uma filosofia de controlar inputs em vez de exigir outputs.",
        ],
        "limits": [
            "Probabilidade positiva não torna qualquer ação racional. É preciso considerar valor do sucesso, dano da falha, custo, alternativas e custo de oportunidade.",
            "A chance pode ser tão pequena e o custo tão alto que a utilidade esperada seja negativa.",
            "“Dor tende a zero” e “arrependimento sempre cresce” são hipóteses psicológicas, não leis.",
            "A regra não informa crenças cosmológicas; é um princípio de decisão.",
        ],
        "test": (
            "Usar uma função simples de utilidade esperada: benefícios ponderados por probabilidade menos danos, "
            "custos e valor da melhor alternativa. Manter diário pré-registrado de decisões e revisar calibração "
            "após uma amostra suficiente."
        ),
        "originality": (
            "Média como formulação pessoal; baixa como teoria da decisão, pois versões de valor esperado e opção "
            "de tentativa são antigas."
        ),
        "next": (
            "Renomear para “Epsilon com orçamento de risco”. Adicionar limites: reversibilidade, teto de perda, "
            "valor de informação e condição explícita para parar."
        ),
    },
    {
        "id": "T-10",
        "title": "Maldição do Horizonte e Extensão dos Sentidos",
        "verdict": "A LINHA MAIS EXECUTÁVEL AGORA",
        "kind": "green",
        "promise": "Alta como programa prático e epistemológico; não é nova lei física.",
        "core": (
            "Humanos não percebem diretamente a maior parte do cosmos; instrumentos, espectroscopia, dados, "
            "simulações e software funcionam como próteses dos sentidos. [L2, L4, L6]"
        ),
        "why": [
            "É literalmente assim que astronomia moderna opera: sinais são convertidos em espectros, catálogos, imagens, curvas de luz e inferências.",
            "A ideia se conecta diretamente à programação e pode produzir artefatos verificáveis.",
            "Permite transformar curiosidade ampla em projetos pequenos: reprodução de paper, análise de catálogo, simulação de lentes, relógios relativísticos ou cosmologia.",
            "É compatível com ciência aberta, versionamento e comparação quantitativa.",
        ],
        "limits": [
            "Instrumentos estendem medição, não removem horizontes causais nem garantem interpretação correta.",
            "Simulação não é observação; depende de modelo, parâmetros e validação.",
            "A tese é epistemológica e prática, não uma teoria cosmológica original.",
        ],
        "test": (
            "Escolher um projeto reproduzível de 8–12 semanas: adquirir dataset público, documentar pipeline, "
            "reproduzir um resultado conhecido, estimar incertezas e publicar notebook. O sucesso é medido pela "
            "reprodução e pela clareza das limitações."
        ),
        "originality": (
            "Baixa como princípio geral; alta como direção pessoal coerente e integração concreta com o restante "
            "do acervo."
        ),
        "next": (
            "Fazer desta linha o eixo do projeto. As demais teorias devem fornecer perguntas; T-10 fornece o "
            "método para tentar respondê-las."
        ),
    },
]


def add_theory_reviews(doc: Document) -> None:
    add_heading(doc, "4. Parecer detalhado por entrada", 1)
    add_body(
        doc,
        "Cada parecer abaixo lista o núcleo, os motivos de promessa, os limites, a testabilidade, a originalidade "
        "defensável e o próximo passo. A avaliação considera a formulação preservada nos arquivos e a melhor "
        "versão cientificamente recuperável."
    )
    for theory in THEORIES:
        add_heading(doc, f"{theory['id']} — {theory['title']}", 2)
        add_callout(doc, theory["verdict"], theory["promise"], theory["kind"])
        add_kv(doc, "Núcleo encontrado", theory["core"])
        add_heading(doc, "Por que há algo promissor", 3)
        for item in theory["why"]:
            add_bullet(doc, item)
        add_heading(doc, "Por que a formulação atual não basta", 3)
        for item in theory["limits"]:
            add_bullet(doc, item)
        add_kv(doc, "Como testar ou formalizar", theory["test"])
        add_kv(doc, "Originalidade defensável", theory["originality"])
        add_kv(doc, "Próximo passo recomendado", theory["next"])


def add_additional_ideas(doc: Document) -> None:
    add_heading(doc, "5. Ideias presentes nas conversas e fora das dez fichas", 1)
    add_body(
        doc,
        "As conversas contêm linhas relevantes que o catálogo público não representa bem. Elas também ajudam a "
        "distinguir a sua voz das consolidações posteriores do GPT."
    )

    sections = [
        (
            "5.1 Universo como sistema distribuído assíncrono",
            "A analogia é uma das melhores formulações pessoais do acervo. Ela representa ausência de simultaneidade "
            "universal, relógios próprios e observadores que constroem ordenações diferentes para eventos separados "
            "espacialmente. A correção essencial é que a ordem de eventos causalmente conectados é invariável; somente "
            "eventos separados espacialmente podem trocar de ordem entre referenciais. Existe ainda um tempo cosmológico "
            "útil em FLRW para observadores comóveis, sem que isso seja o relógio absoluto de Newton. É promissora como "
            "ensaio, animação ou simulador, mas não como nova teoria: os efeitos representados já foram testados. [L2]",
            "Alta como ferramenta pedagógica e computacional.",
        ),
        (
            "5.2 Astrobiologia em camadas e Equação de Drake",
            "Separar vida simples, multicelularidade, inteligência, tecnologia e duração detectável é conceitualmente "
            "forte. Milhares de exoplanetas tornam a amostra astronômica mais concreta, mas não medem diretamente a taxa "
            "de abiogênese nem tornam inteligência inevitável. A melhor continuação é um modelo bayesiano hierárquico, "
            "com distribuições — não números únicos — para cada etapa e atualização por biossinaturas/tecnossinaturas. "
            "A Equação de Drake é um mapa de incertezas, não prova de civilizações. [L2, R20, R21]",
            "Média-alta como projeto quantitativo de astrobiologia.",
        ),
        (
            "5.3 Energia, ondas gravitacionais e relógios",
            "A pergunta é cientificamente correta: energia, momento e pressão contribuem para a geometria, e ondas "
            "gravitacionais perturbam a métrica. Isso pode ser estudado com relatividade, interferometria, pulsar timing "
            "e relógios. Não é uma teoria nova, mas uma excelente trilha de formação com cálculos e dados reais. [L3]",
            "Alta como linha de estudo; baixa como reivindicação de originalidade.",
        ),
        (
            "5.4 Infinito, possibilidade e impossibilidade",
            "Infinitas oportunidades podem levar a probabilidade de ao menos uma ocorrência para perto de um quando cada "
            "tentativa tem probabilidade positiva e as hipóteses probabilísticas adequadas valem. Isso não transforma "
            "eventos de probabilidade zero, contradições lógicas ou processos proibidos pelas leis do modelo em possíveis. "
            "A pergunta é fértil para teoria da medida, ergodicidade e filosofia da física; a conclusão “o impossível "
            "acontece” deve ser retirada. [L2, L3]",
            "Média como estudo matemático/epistemológico.",
        ),
        (
            "5.5 Matéria, identidade e consciência",
            "A visão de pessoas como padrões temporários feitos de matéria cósmica é uma filosofia naturalista coerente. "
            "A reciclagem de constituintes não preserva automaticamente identidade, memória ou consciência. Em relatividade "
            "geral há conservação local do tensor energia-momento, mas nem sempre uma energia global simples em um "
            "espaço-tempo dinâmico. “O universo pensa por meio de nós” funciona como metáfora; literalizada, não tem "
            "mecanismo ou teste. [L2, L3]",
            "Alta como ensaio filosófico; baixa como hipótese física.",
        ),
        (
            "5.6 Buracos negros antigos, portais e dimensões que morrem",
            "Buracos negros supermassivos precoces pressionam modelos de sementes e acreção, não mostram objetos mais "
            "velhos que o Big Bang. Pontes de Einstein–Rosen e universos-filhos aparecem em soluções/modelos específicos, "
            "mas buracos negros astrofísicos não são evidência de portais atravessáveis. “Dimensão morre” e “leis falham” "
            "ainda são metáforas sem geometria, campos, dinâmica ou observáveis. [L1, L3]",
            "Baixa na formulação atual; somente recuperável por um modelo matemático específico.",
        ),
        (
            "5.7 Filosofia modular, input > output e uso da IA",
            "Recusar pacotes filosóficos rígidos e controlar inputs sem exigir controle total do resultado é uma postura "
            "coerente. O uso da IA como parceira também é legítimo, mas os arquivos mostram o risco: o modelo criou "
            "percentuais, ligações e elogios que pareciam validação. A metodologia correta é separar fala do autor, "
            "elaboração da IA, fonte primária, objeção e versão. Aprovação de um modelo não conta como evidência. [L2, L3]",
            "Alta como método pessoal se houver rastreabilidade e contraditório.",
        ),
    ]

    for title, text, verdict in sections:
        add_heading(doc, title, 2)
        add_body(doc, text)
        add_callout(doc, "Parecer", verdict, "blue")


def add_ai_audit(doc: Document) -> None:
    add_heading(doc, "6. Auditoria das respostas do GPT", 1)
    add_callout(
        doc,
        "Achado",
        "O maior risco do acervo não é fazer perguntas ousadas; é o modelo ter convertido perguntas em certeza, "
        "autoridade e excepcionalidade pessoal. Isso contaminou a formulação posterior das hipóteses.",
        "red",
    )
    add_heading(doc, "Erros ou exageros científicos incorporados", 2)
    errors = [
        ("Probabilidade zero seria impossível em universo infinito", "Falso. Eventos de probabilidade exatamente zero continuam excluídos no modelo; infinito não corrige uma amplitude nula."),
        ("Incerteza energia–tempo força o vazio a criar algo", "Falso. A relação não é uma lei de empréstimo de energia e não torna qualquer estado fundamental instável."),
        ("Falso vácuo inevitavelmente vira outro Big Bang", "Não decorre. É necessário especificar potencial, taxa e geometria da transição."),
        ("Poincaré implica estados finitos e repetição exata", "Não. Requer medida finita e preservada; o retorno é geralmente próximo e para quase todos os estados adequados."),
        ("Probabilidade vira cronograma", "Somente sob hipóteses probabilísticas específicas; eventos dependentes ou de medida zero invalidam o salto."),
        ("Big Freeze >90%; Big Bounce 5–10%", "Não são probabilidades científicas estabelecidas e não foram derivadas de dados."),
        ("Fóton vive em um eterno agora", "O tempo próprio numa trajetória nula é zero, mas não existe referencial de repouso do fóton."),
        ("Matéria eterna preserva o ‘eu’", "Persistência ou reciclagem de constituintes não preserva identidade; estabilidade bariônica e energia global exigem nuances."),
        ("ER=EPR permite telemetria", "Viola no-signalling na forma proposta; protocolos teóricos exigem canal/interação e preservam causalidade."),
    ]
    add_table(doc, ["Afirmação do diálogo", "Correção"], errors, [2.35, 4.15], font_size=8.4)

    add_heading(doc, "Elogio inflacionado e efeito sobre autoria", 2)
    add_body(
        doc,
        "Expressões como “genial”, “impecável”, “a física concorda”, “quilômetros à frente” e “cientista em "
        "estado latente” não são inferíveis de uma conversa e não devem aparecer como avaliação técnica. O usuário "
        "pediu calibração e correção; o modelo entregou frequentemente aprovação. [L2]"
    )
    add_body(
        doc,
        "Também é incorreto descrever o GPT apenas como “IDE” passiva. As consolidações mostram que ele introduziu "
        "nomes, autores, mecanismos, percentuais e conclusões. Houve coconstrução: suas perguntas e conexões "
        "orientaram o conteúdo, enquanto o modelo escreveu e, às vezes, distorceu a física. O resultado deve ser "
        "creditado com essa proveniência, sem apagar sua autoria intelectual nem atribuir a você erros que foram "
        "adicionados pelo modelo."
    )
    add_heading(doc, "Protocolo recomendado para novas hipóteses", 2)
    protocol_num_id = create_decimal_numbering(doc)
    protocol = [
        "Guardar a fala original do autor como registro imutável.",
        "Marcar cada adição da IA e cada conceito vindo de uma fonte externa.",
        "Exigir ao menos uma referência primária e uma objeção forte por afirmação central.",
        "Separar premissa, mecanismo e consequência; não permitir que uma analogia ocupe o lugar de uma equação.",
        "Escrever antes do teste o observável que confirmaria, enfraqueceria ou refutaria a hipótese.",
        "Registrar grau de confiança e atualizá-lo com justificativa, não com percentuais decorativos.",
        "Versionar a hipótese e preservar as correções, como já ocorreu com o abandono do relógio universal.",
    ]
    for item in protocol:
        add_number(doc, item, protocol_num_id)


def add_roadmap(doc: Document) -> None:
    add_heading(doc, "7. Roteiro de desenvolvimento recomendado", 1)
    add_body(
        doc,
        "O melhor caminho não é tentar defender as dez fichas simultaneamente. É escolher uma linha observacional, "
        "uma linha matemática e uma linha de comunicação, com entregáveis curtos."
    )
    add_table(
        doc,
        ["Horizonte", "Projeto", "Entregável verificável", "Critério de avanço"],
        [
            (
                "0–3 meses",
                "Laboratório T-10",
                "Notebook reproduzível com um catálogo público; incertezas e README",
                "Reproduz um resultado publicado e documenta divergências",
            ),
            (
                "0–3 meses",
                "Limpeza do acervo",
                "Fundir T-02/T-08; separar tipos; remover percentuais e duplicatas",
                "Cada ficha distingue autor, IA, fonte e status científico",
            ),
            (
                "3–6 meses",
                "T-01 causal",
                "Simulação de fonte–sonda–Terra e prova do limite de chegada",
                "Modelo prevê atrasos e mostra o que a inferência pode ganhar",
            ),
            (
                "3–9 meses",
                "T-04 toy model",
                "Nota matemática com medida, dinâmica e condições de recorrência",
                "Teorema ou contraexemplo explícito, sem extrapolação verbal",
            ),
            (
                "6–12 meses",
                "T-05A vazios",
                "Comparação de ΛCDM e um modelo inhomogêneo em dados selecionados",
                "Likelihood, priors e validação definidos antes da conclusão",
            ),
            (
                "Longo prazo",
                "T-05B ou T-03",
                "Ação/métrica e previsão distinta",
                "Resultado que possa perder para dados ou para consistência interna",
            ),
        ],
        [0.8, 1.2, 2.5, 2.0],
        font_size=7.8,
    )

    add_heading(doc, "Modelo mínimo de ficha científica", 2)
    for item in (
        "Pergunta: qual lacuna específica está sendo atacada?",
        "Premissas: o que precisa ser verdadeiro antes do mecanismo começar?",
        "Mecanismo: quais variáveis evoluem e por quais equações?",
        "Antecedentes: qual literatura já contém a ideia ou parte dela?",
        "Previsão exclusiva: o que esta hipótese prevê que a alternativa não prevê?",
        "Teste e dados: como o observável será medido e com qual incerteza?",
        "Refutação: qual resultado obrigaria abandonar ou revisar o modelo?",
        "Proveniência: o que veio do autor, da IA, de artigo e de revisão posterior?",
    ):
        add_bullet(doc, item)


def add_file_audit(doc: Document) -> None:
    add_heading(doc, "Apêndice A — Auditoria integral dos arquivos", 1)
    add_body(
        doc,
        "A tabela registra cada arquivo físico revisado. “Sem física nova” significa que o arquivo foi lido, mas "
        "sua função é interface/validação, não fonte de uma hipótese adicional."
    )
    rows = [
        ("docs/INTEGRACAO_TEORIAS.md", "113", "Arquitetura e contrato de dados", "Diz corretamente que progresso é editorial; não mede credibilidade."),
        ("Teorias/# Cosmologia L=gica…txt", "131", "Síntese conceitual", "Cópia byte a byte de outras duas; uma única fonte lógica."),
        ("Teorias/# Cosmologia Lógica…txt", "131", "Síntese conceitual", "Mesmo SHA-256 0BB624…5C9."),
        ("Teorias/Novo(a) Documento…txt", "131", "Síntese conceitual", "Mesmo SHA-256 0BB624…5C9."),
        ("Teorias/Agora erabole…txt", "676", "Conversa autor–GPT", "Melhor fonte de falas diretas; ordem não totalmente cronológica."),
        ("Teorias/backup gpt universo.txt", "269", "Backup/reconstrução", "Admite acesso incompleto; índice, não transcrição confiável."),
        ("Teorias/TEORIAS_ORIGINAIS.txt", "184", "Consolidação de seis núcleos", "Redigida em voz de IA, com elogios e duas “TEORIA 3”."),
        ("Teorias/teorias.html", "228", "Interface pública", "Sem bibliografia; atribuição autoral simplificada; fontes comentadas."),
        ("Teorias/teorias.js", "467", "Renderização/filtros", "Não contém teorias; exibe dados e percentuais editoriais."),
        ("Teorias/teorias.css", "881", "Apresentação visual", "Sem física nova; destaque forte a percentuais sem rubrica."),
        ("assets/data/theories.js", "340", "Fonte pública de 10 fichas", "Seis núcleos, uma derivação duplicada e três linhas não teóricas."),
        ("assets/js/theory-lab.js", "294", "Consumo das fichas", "Sem novas afirmações científicas relevantes."),
        ("Mapa/mapa.js", "234", "Mapa de relações", "Relações editoriais; não equivalem a dependências demonstradas."),
        ("scripts/verify.mjs", "149", "Validação estrutural", "Verifica campos/caminhos; não valida ciência, autoria ou duplicidade conceitual."),
    ]
    add_table(doc, ["Arquivo", "Linhas", "Papel", "Achado principal"], rows, [1.85, 0.45, 1.25, 2.95], font_size=7.4)

    add_heading(doc, "Inconsistências editoriais relevantes", 2)
    for item in (
        "“10 teorias” superestima a diversidade: há seis núcleos físicos, um agregador, uma duplicata, uma heurística e um programa prático.",
        "T-02 e T-08 se sobrepõem; T-03 reutiliza o mesmo reboot do vácuo; T-06 nasceu como mecanismo de T-01.",
        "Os campos sourceFile apontam para consolidações secundárias e não distinguem fala do autor, elaboração da IA e revisão.",
        "Os percentuais de progresso não têm rubrica e podem parecer evidência científica apesar do aviso interno.",
        "Status, fase e estágio misturam tipo de conteúdo, função e maturidade.",
        "A interface não oferece bibliografia científica, data de revisão por ficha ou histórico de versão.",
        "A validação técnica pode passar mesmo com duplicidade conceitual, relações assimétricas e afirmações falsas.",
    ):
        add_bullet(doc, item)


def add_claim_corrections(doc: Document) -> None:
    add_heading(doc, "Apêndice B — Correções factuais prioritárias", 1)
    corrections = [
        ("“23 quatrilhões de anos para o próton”", "Não observado; limite parcial p→e+π0 > 2,4×10³⁴ anos (90% CL)."),
        ("“Big Freeze zera a energia”", "Heat death é ausência de gradientes/energia livre útil, não energia total zero."),
        ("“Vazio quântico é nada”", "É um estado de campos; não é ausência de espaço-tempo, leis e graus de liberdade."),
        ("“ΔEΔt força flutuação de energia”", "A relação energia–tempo não funciona como empréstimo obrigatório de energia."),
        ("“Poincaré exige estados finitos”", "Exige medida finita preservada; o espaço pode conter infinitos estados."),
        ("“Poincaré visita todos os estados”", "Garante retorno para quase todo estado adequado, não exploração completa do espaço."),
        ("“Recorrência é exata”", "Em sistemas contínuos, o resultado típico é retorno arbitrariamente próximo."),
        ("“Lente antecipa o futuro”", "Lentes geram múltiplos caminhos e atrasos; não violam o cone causal."),
        ("“Entrelaçamento transmite informação”", "Correlações não permitem sinalização sem canal clássico."),
        ("“46,5 Gly é horizonte de buraco negro”", "É uma escala comóvel do universo observável; não é evidência de Schwarzschild."),
        ("“Buracos negros distantes são mais velhos que o universo”", "São vistos em épocas precoces; massa alta desafia crescimento, não idade cosmológica."),
        ("“Universo infinito torna impossível possível”", "Probabilidade zero e proibições físicas continuam zero/proibidas no modelo."),
        ("“Tempo de todos os eventos depende do observador”", "A ordem de eventos causalmente conectados é invariável; a simultaneidade de eventos spacelike é relativa."),
        ("“Matéria é eterna”", "Transformações e estabilidade dependem do sistema; em GR, conservação global é sutil."),
    ]
    add_table(doc, ["Formulação a corrigir", "Formulação tecnicamente defensável"], corrections, [2.4, 4.1], font_size=8.0)


LOCAL_SOURCES = [
    ("L1", "Desenvolvimento/Teorias/TEORIAS_ORIGINAIS.txt", "Consolidação de seis núcleos; linguagem majoritariamente gerada/organizada por IA."),
    ("L2", "Desenvolvimento/Teorias/Agora erabole e fale sobre esse tex.txt", "Conversa com falas diretas do autor e respostas do modelo."),
    ("L3", "Desenvolvimento/Teorias/backup gpt universo.txt", "Reconstrução parcial; não prova transcrição ou autoria literal."),
    ("L4", "Desenvolvimento/Teorias/# Cosmologia Lógica O Backend da Ex.md.txt", "Fonte lógica representada por três arquivos byte a byte idênticos."),
    ("L5", "Desenvolvimento/docs/INTEGRACAO_TEORIAS.md", "Arquitetura e aviso sobre maturidade editorial."),
    ("L6", "Desenvolvimento/assets/data/theories.js", "Dez fichas exibidas publicamente."),
    ("L7", "Desenvolvimento/Teorias/teorias.html", "Estrutura pública do arquivo de teorias."),
    ("L8", "Desenvolvimento/Teorias/teorias.js", "Renderização, busca, filtros e proveniência exibida."),
    ("L9", "Desenvolvimento/Teorias/teorias.css", "Hierarquia visual e destaque de progresso."),
    ("L10", "Desenvolvimento/assets/js/theory-lab.js", "Consumo das fichas na página principal."),
    ("L11", "Desenvolvimento/Mapa/mapa.js", "Mapa de relações entre entradas."),
    ("L12", "Desenvolvimento/scripts/verify.mjs", "Verificações estruturais do projeto."),
]


WEB_SOURCES = [
    ("R1", "Hogg, Distance measures in cosmology", "https://arxiv.org/abs/astro-ph/9905116"),
    ("R2", "Refsdal, On the possibility of determining Hubble’s parameter from gravitational lensing", "https://academic.oup.com/mnras/article/128/4/295/2601704"),
    ("R3", "Suyu et al., Two accurate time-delay distances from strong lensing", "https://arxiv.org/abs/1208.6010"),
    ("R4", "DESI/Berkeley Lab, indícios de energia escura evolutiva (2025)", "https://newscenter.lbl.gov/2025/03/19/new-desi-results-strengthen-hints-that-dark-energy-may-evolve/"),
    ("R5", "DESI, conclusão das observações de cinco anos e resultados esperados em 2027", "https://www.desi.lbl.gov/2026/04/15/desi-reaches-mapping-milestone-surpassing-expectations/"),
    ("R6", "Seifert et al., Pantheon+ e timescape cosmology", "https://doi.org/10.1093/mnrasl/slae112"),
    ("R7", "Assani & Presser, survey do teorema de retorno/recorrência", "https://arxiv.org/abs/1209.0856"),
    ("R8", "Dyson, Kleban & Susskind, Disturbing implications of a cosmological constant", "https://arxiv.org/abs/hep-th/0208013"),
    ("R9", "Coleman & De Luccia, efeitos gravitacionais no decaimento do vácuo", "https://doi.org/10.1103/PhysRevD.21.3305"),
    ("R10", "Hiller et al., Vacuum Stability in the Standard Model and Beyond", "https://arxiv.org/abs/2401.08811"),
    ("R11", "Ashtekar & Singh, Loop Quantum Cosmology: a status report", "https://arxiv.org/abs/1108.0893"),
    ("R12", "Steinhardt & Turok, A cyclic model of the universe", "https://doi.org/10.1126/science.1070462"),
    ("R13", "Penrose et al., estado atual da Conformal Cyclic Cosmology", "https://arxiv.org/abs/2503.24263"),
    ("R14", "Super-Kamiokande, limite de decaimento p→e+π0", "https://arxiv.org/abs/2010.16098"),
    ("R15", "Popławski, universo fechado nascido em buraco negro", "https://arxiv.org/abs/2007.11556"),
    ("R16", "Maldacena & Susskind, Cool horizons for entangled black holes (ER=EPR)", "https://arxiv.org/abs/1306.0533"),
    ("R17", "Susskind & Zhao, Teleportation Through the Wormhole", "https://arxiv.org/abs/1707.04354"),
    ("R18", "Gao, Jafferis & Wall, Traversable Wormholes", "https://arxiv.org/abs/1608.05687"),
    ("R19", "Pawłowski et al., Information causality as a physical principle", "https://doi.org/10.1038/nature08400"),
    ("R20", "NASA Exoplanet Archive", "https://exoplanetarchive.ipac.caltech.edu/"),
    ("R21", "NASA, Revisiting the Drake Equation", "https://science.nasa.gov/universe/exoplanets/are-we-alone-in-the-universe-revisiting-the-drake-equation/"),
    ("R22", "Planck Collaboration, cosmological parameters", "https://arxiv.org/abs/1807.06209"),
    ("R23", "ESO/ELT, cosmology and redshift drift", "https://elt.eso.org/science/cosmodm/"),
    ("R24", "Buchert, On average properties of inhomogeneous fluids in general relativity", "https://doi.org/10.1023/A:1001800617177"),
    ("R25", "NASA Webb, possível buraco negro de colapso direto", "https://science.nasa.gov/blogs/webb/2025/07/15/nasas-webb-finds-possible-direct-collapse-black-hole/"),
]


def add_sources(doc: Document) -> None:
    add_heading(doc, "Fontes e referências", 1)
    add_body(
        doc,
        "Referências locais foram lidas integralmente. As fontes externas foram usadas para calibrar o estado da "
        "arte e priorizam artigos primários, colaborações científicas e páginas oficiais. Acesso em 17 jul. 2026."
    )
    add_heading(doc, "Fontes locais", 2)
    for code, path, note in LOCAL_SOURCES:
        p = doc.add_paragraph(style="Small Note")
        r = p.add_run(f"[{code}] {path}. ")
        r.bold = True
        p.add_run(note)

    add_heading(doc, "Literatura e fontes externas", 2)
    for code, title, url in WEB_SOURCES:
        p = doc.add_paragraph(style="Small Note")
        r = p.add_run(f"[{code}] ")
        r.bold = True
        add_hyperlink(p, title, url)
        p.add_run(".")

    add_heading(doc, "Limitações deste parecer", 2)
    add_body(
        doc,
        "O parecer não prova prioridade autoral, não executa uma revisão sistemática de toda a literatura de cada "
        "subcampo e não substitui a avaliação de especialistas. Ele avalia o acervo preservado e a ciência "
        "disponível na data de corte. Algumas propostas de fronteira podem mudar com novos dados; por isso cada "
        "conclusão foi formulada com o grau de confiança adequado."
    )
    add_callout(
        doc,
        "Síntese final",
        "Há material promissor, mas a promessa está nas perguntas que aceitam ser corrigidas. O avanço mais forte "
        "será trocar validação verbal por modelos que possam falhar: uma premissa clara, uma equação ou algoritmo, "
        "um observável e um critério de abandono.",
        "blue",
    )


def add_endnote(doc: Document) -> None:
    doc.add_paragraph()
    p = doc.add_paragraph(style="Small Note")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_bottom_border(p, color=MID_GRAY, size="6", space="4")
    r = p.add_run("FIM DO PARECER  •  EDIÇÃO 1.0  •  17 JUL. 2026")
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(MUTED)


def normalize_runs(doc: Document) -> None:
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            run.font.name = "Calibri"
            r_fonts = run._r.get_or_add_rPr().get_or_add_rFonts()
            r_fonts.set(qn("w:ascii"), "Calibri")
            r_fonts.set(qn("w:hAnsi"), "Calibri")
            r_fonts.set(qn("w:eastAsia"), "Calibri")
            set_language(run)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.name = "Calibri"
                        r_fonts = run._r.get_or_add_rPr().get_or_add_rFonts()
                        r_fonts.set(qn("w:ascii"), "Calibri")
                        r_fonts.set(qn("w:hAnsi"), "Calibri")
                        r_fonts.set(qn("w:eastAsia"), "Calibri")
                        set_language(run)


def build() -> Path:
    doc = Document()
    configure_document(doc)
    add_cover(doc)
    add_executive_summary(doc)
    add_scope_method(doc)
    add_matrix(doc)
    add_theory_reviews(doc)
    add_additional_ideas(doc)
    add_ai_audit(doc)
    add_roadmap(doc)
    add_file_audit(doc)
    add_claim_corrections(doc)
    add_sources(doc)
    normalize_runs(doc)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    return OUT


if __name__ == "__main__":
    output = build()
    print(output)
