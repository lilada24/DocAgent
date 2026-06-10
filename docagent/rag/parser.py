from pathlib import Path

import fitz
import docx

SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf", ".doc", ".docx"}


def extract_text_from_file(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported extension: {suffix}")

    if suffix in {".txt", ".md"}:
        return path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf":
        text = []
        with fitz.open(path) as doc:
            for page in doc:
                page_text = page.get_text()
                if page_text:
                    text.append(page_text)
        return "\n\n".join(text)

    if suffix == ".docx":
        document = docx.Document(path)
        paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)

    if suffix == ".doc":
        # DOC 解析在当前环境中不一定可用，建议优先使用 DOCX
        return ""

    return ""
