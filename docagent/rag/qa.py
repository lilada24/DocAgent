"""End-to-end Q&A: BM25 retrieve → LLM answers with citations."""

from .retriever import retrieve

_QA_SYSTEM_PROMPT = """\
You are a helpful documentation assistant. Answer the user's question based \
ONLY on the provided document and code context below.

Rules:
1. If the context contains the answer, provide a clear, concise response.
2. Cite the source (e.g. "document" or the file path) when using specific information.
3. If the context does NOT contain enough information to answer the question, \
say "根据已有文档和代码，无法回答这个问题。" and suggest what additional \
information might help.
4. Answer in the same language as the user's question (Chinese or English).
5. Keep answers focused and avoid speculation beyond the provided context."""


def _build_prompt(chunks: list[dict], question: str) -> str:
    """Build the QA prompt with retrieved context chunks."""
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("source", "unknown")
        text = chunk.get("text", "")
        context_parts.append(f"[Chunk {i} — Source: {source}]\n{text}\n")

    context = "\n".join(context_parts)

    return f"""Context:
---
{context}
---

Question: {question}

Answer:"""


def query_document(project_path: str, question: str, llm, top_k: int = 5) -> dict:
    """Answer a question about a project using BM25-based RAG.

    Args:
        project_path: Absolute path to the project directory.
        question: The user's natural language question.
        llm: An instance of docagent.llm.LLM.
        top_k: Number of chunks to retrieve.

    Returns:
        dict with keys: answer, sources
    """
    chunks = retrieve(project_path, question, top_k=top_k)

    if not chunks:
        return {
            "answer": "No relevant content found in the indexed document. Please ensure the document has been indexed.",
            "sources": [],
        }

    prompt = _build_prompt(chunks, question)

    messages = [
        {"role": "system", "content": _QA_SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]
    response = llm.chat(messages=messages)

    # Deduplicate sources
    sources = []
    seen = set()
    for chunk in chunks:
        source = chunk.get("source", "unknown")
        if source not in seen:
            seen.add(source)
            sources.append({
                "source": source,
                "excerpt": chunk.get("text", "")[:200],
            })

    return {
        "answer": response.content.strip(),
        "sources": sources,
    }
