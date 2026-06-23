import os
import logging
from typing import List, Any
import numpy as np
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai
from config.settings import settings

logger = logging.getLogger("drafting.embedding")

class EmbeddingPipeline:
    def __init__(self, model_name: str = "gemini-embedding-001", chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.model_name = model_name
        
        api_key = settings.google_ai_studio_api_key or os.environ.get("GOOGLE_AI_STUDIO_API_KEY")
        if not api_key:
            logger.warning("GOOGLE_AI_STUDIO_API_KEY not found in settings or environment. Embedding pipeline may fail.")
            
        self.client = genai.Client(api_key=api_key)
        logger.info(f"Initialized Google GenAI embedding pipeline with model: {model_name}")

    def chunk_documents(self, documents: List[Any]) -> List[Any]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = splitter.split_documents(documents)
        logger.info(f"Split {len(documents)} documents into {len(chunks)} chunks.")
        return chunks

    def embed_chunks(self, chunks: List[Any]) -> np.ndarray:
        texts = [chunk.page_content for chunk in chunks]
        if not texts:
            return np.empty((0, 0), dtype=np.float32)
            
        logger.info(f"Generating Google GenAI embeddings for {len(texts)} chunks...")
        try:
            response = self.client.models.embed_content(
                model=self.model_name,
                contents=texts
            )
            # Extracted list of embeddings from response
            embeddings = [emb.values for emb in response.embeddings]
            emb_array = np.array(embeddings, dtype=np.float32)
            logger.info(f"Embeddings shape: {emb_array.shape}")
            return emb_array
        except Exception as e:
            logger.error(f"Failed to generate Google GenAI embeddings: {e}")
            raise e

    def embed_query(self, query_text: str) -> np.ndarray:
        logger.info(f"Generating Google GenAI embedding for query: '{query_text[:60]}...'")
        try:
            response = self.client.models.embed_content(
                model=self.model_name,
                contents=query_text
            )
            embedding = response.embeddings[0].values
            return np.array(embedding, dtype=np.float32)
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            raise e
