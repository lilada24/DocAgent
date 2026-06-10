"""BM25 keyword retrieval — zero model downloads, pure Python.

Implements the Okapi BM25 ranking function for retrieving relevant
document chunks based on keyword overlap with the query.
"""

import json
import math
import re
from collections import Counter

from .indexer import _get_index_path


# ── Tokenization ──────────────────────────────────────────────────────

# Simple regex: split on whitespace + Chinese punctuation, keep words/characters
_TOKEN_RE = re.compile(r"[一-鿿]|[a-zA-Z0-9]+|[^\s一-鿿\w]+")


def _tokenize(text: str) -> list[str]:
    """Tokenize text into words (English) and characters (Chinese).

    Chinese text is tokenized as individual characters since we don't
    have a Chinese word segmenter (jieba, etc.) in the stdlib.
    This gives decent results for keyword matching.
    """
    tokens = _TOKEN_RE.findall(text.lower())
    # Filter out pure punctuation/symbols (keep alphanumeric + Chinese chars)
    return [t for t in tokens if re.search(r"[一-鿿\w]", t)]


# ── BM25 Implementation ───────────────────────────────────────────────

class BM25:
    """Okapi BM25 ranker.

    Reference: https://en.wikipedia.org/wiki/Okapi_BM25
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self._corpus: list[list[str]] = []
        self._doc_len: list[int] = []
        self._avgdl: float = 0
        self._idf: dict[str, float] = {}
        self._doc_freq: Counter = Counter()
        self._N: int = 0

    def fit(self, documents: list[str]):
        """Build the BM25 index from a list of document strings."""
        self._corpus = [self._tokenize(doc) for doc in documents]
        self._doc_len = [len(tokens) for tokens in self._corpus]
        self._avgdl = sum(self._doc_len) / max(len(self._doc_len), 1)
        self._N = len(self._corpus)

        # Document frequency for each term
        self._doc_freq = Counter()
        for tokens in self._corpus:
            self._doc_freq.update(set(tokens))

        # IDF for each term
        self._idf = {}
        for term, freq in self._doc_freq.items():
            # Smooth IDF: log((N - df + 0.5) / (df + 0.5) + 1)
            self._idf[term] = math.log(
                (self._N - freq + 0.5) / (freq + 0.5) + 1
            )

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return _tokenize(text)

    def score(self, query: str) -> list[float]:
        """Score all documents against a query. Returns list of scores (one per doc)."""
        query_tokens = self._tokenize(query)
        scores = [0.0] * self._N

        for term in query_tokens:
            term_idf = self._idf.get(term, 0)
            if term_idf == 0:
                continue

            for i, doc_tokens in enumerate(self._corpus):
                tf = doc_tokens.count(term)
                if tf == 0:
                    continue
                doc_len = self._doc_len[i]
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * doc_len / self._avgdl)
                scores[i] += term_idf * numerator / denominator

        return scores

    def top_k(self, query: str, k: int = 5) -> list[tuple[int, float]]:
        """Return the top-k (doc_index, score) tuples, sorted by score descending."""
        scores = self.score(query)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        return [(idx, s) for idx, s in ranked if s > 0][:k]


# ── Public API ────────────────────────────────────────────────────────

def retrieve(project_path: str, question: str, top_k: int = 5) -> list[dict]:
    """Retrieve the most relevant chunks using BM25 keyword matching.

    Returns list of dicts: {text, source, score}
    """
    index_path = _get_index_path(project_path)

    if not index_path.exists():
        raise ValueError(
            f"No RAG index found for project: {project_path}. "
            "Please index the document first via POST /api/rag/index."
        )

    # Load chunks from JSON
    chunks = json.loads(index_path.read_text(encoding="utf-8"))
    if not chunks:
        return []

    # Build BM25 index
    doc_texts = [c["text"] for c in chunks]
    bm25 = BM25()
    bm25.fit(doc_texts)

    # Retrieve top-k
    results = bm25.top_k(question, k=top_k)

    return [
        {
            "text": chunks[idx]["text"],
            "source": chunks[idx].get("source", "unknown"),
            "score": round(score, 4),
        }
        for idx, score in results
    ]
