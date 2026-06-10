"""RAG (Retrieval-Augmented Generation) module for DocAgent.

BM25-based keyword retrieval — zero model downloads, works instantly.
"""

from .indexer import index_document
from .qa import query_document

__all__ = ["index_document", "query_document"]
