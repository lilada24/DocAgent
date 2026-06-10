"""Document chunking and JSON-based index storage for BM25 RAG.

Zero model downloads — uses BM25 keyword retrieval (no embeddings).
Chunks are stored as JSON files under data/rag/.
"""

import hashlib
import json
from pathlib import Path

from .parser import extract_text_from_file

# ── File filtering ────────────────────────────────────────────────────

_SKIP_PATTERNS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", ".idea", ".vscode",
    ".DS_Store", "Thumbs.db", "dist", "build", "target", ".next", ".nuxt",
    "vendor", "bower_components",
}
_SKIP_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp",
    ".mp3", ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv",
    ".xls", ".xlsx", ".ppt", ".pptx",
    ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".dat",
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ".pyc", ".pyo", ".class", ".o", ".obj",
    ".lock", ".sum",
}
_SUPPORTED_TEXT_EXTENSIONS = {".txt", ".md", ".pdf", ".doc", ".docx"}
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
_MAX_SOURCE_FILES = 50


# ── Helpers ───────────────────────────────────────────────────────────

def _get_index_name(project_path: str) -> str:
    """Derive a stable index name from project path."""
    digest = hashlib.md5(str(Path(project_path).resolve()).encode()).hexdigest()[:12]
    return f"rag_{digest}"


def _get_index_dir():
    """Get/create the index storage directory."""
    # 使用绝对路径，确保在任何工作目录下都能正常工作
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    idx_dir = Path(base_dir) / "data" / "rag"
    idx_dir.mkdir(parents=True, exist_ok=True)
    return idx_dir


def _get_index_path(project_path: str) -> Path:
    """Get the JSON file path for a project's index."""
    return _get_index_dir() / f"{_get_index_name(project_path)}.json"


# ── Chunking ──────────────────────────────────────────────────────────

def _chunk_text(text: str, source: str, chunk_size: int = 500, overlap: int = 100) -> list[dict]:
    """Split text into overlapping chunks on paragraph/line/sentence boundaries."""
    if not text or not text.strip():
        return []

    # Step 1: split on paragraphs
    paragraphs = text.split("\n\n")

    # Step 2: further split long paragraphs
    segments = []
    for para in paragraphs:
        if len(para) <= chunk_size:
            if para.strip():
                segments.append(para.strip())
        else:
            lines = para.split("\n")
            for line in lines:
                if len(line) <= chunk_size:
                    if line.strip():
                        segments.append(line.strip())
                else:
                    for i in range(0, len(line), chunk_size - overlap):
                        seg = line[i:i + chunk_size].strip()
                        if seg:
                            segments.append(seg)

    # Step 3: greedy merge small segments up to chunk_size
    chunks = []
    buffer = ""
    for seg in segments:
        if len(buffer) + len(seg) + 1 <= chunk_size:
            buffer = (buffer + "\n" + seg).strip() if buffer else seg
        else:
            if buffer:
                chunks.append(buffer)
            buffer = seg
    if buffer:
        chunks.append(buffer)

    # Step 4: build result
    result = []
    for idx, chunk in enumerate(chunks):
        result.append({
            "text": chunk,
            "source": source,
            "chunk_index": idx,
        })
    return result


# ── Source file reading ───────────────────────────────────────────────

def _read_source_files(project_path: str) -> list[dict]:
    """Scan project directory and read text content of source files."""
    base = Path(project_path).resolve()
    if not base.exists():
        return []

    files = []
    for entry in base.rglob("*"):
        if not entry.is_file():
            continue
        parts = set(entry.parts)
        if _SKIP_PATTERNS & parts:
            continue
        suffix = entry.suffix.lower()
        if suffix in _SKIP_EXTENSIONS:
            continue
        try:
            if entry.stat().st_size > _MAX_FILE_SIZE:
                continue
        except OSError:
            continue

        try:
            if suffix in _SUPPORTED_TEXT_EXTENSIONS:
                content = extract_text_from_file(entry)
            else:
                content = entry.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        if not content or not content.strip():
            continue

        rel_path = str(entry.relative_to(base))
        files.append({"path": rel_path, "content": content})

    files.sort(key=lambda f: len(f["content"]))
    return files[:_MAX_SOURCE_FILES]


# ── Public API ────────────────────────────────────────────────────────

def index_document(project_path: str, doc_content: str, force: bool = False) -> dict:
    """Index a project's document and source code into a JSON file.

    Returns dict with keys: status, chunks, index_file
    """
    index_path = _get_index_path(project_path)

    # Chunk the document
    doc_chunks = _chunk_text(doc_content, source="document")

    # Read and chunk source files
    source_files = _read_source_files(project_path)
    for sf in source_files:
        doc_chunks.extend(_chunk_text(sf["content"], source=sf["path"]))

    if not doc_chunks:
        # Still save an empty index so the file exists
        index_path.write_text("[]", encoding="utf-8")
        return {"status": "ok", "chunks": 0, "index_file": str(index_path)}

    # Save as JSON
    index_path.write_text(
        json.dumps(doc_chunks, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return {
        "status": "ok",
        "chunks": len(doc_chunks),
        "index_file": str(index_path),
    }
