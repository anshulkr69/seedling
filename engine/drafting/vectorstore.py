import os
import faiss
import numpy as np
import pickle
import logging
from typing import List, Any, Dict
from drafting.embedding import EmbeddingPipeline

logger = logging.getLogger("drafting.vectorstore")

class FaissVectorStore:
    def __init__(
        self,
        org_id: str,
        persist_dir: str = "faiss_store",
        embedding_model: str = "text-embedding-004",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        self.org_id = org_id
        # Isolate the directory per organization to prevent data leaks between tenants
        self.persist_dir = os.path.join(persist_dir, org_id)
        os.makedirs(self.persist_dir, exist_ok=True)
        
        self.index = None
        self.metadata: List[Dict[str, Any]] = []
        self.embedding_model = embedding_model
        
        # Instantiate the embedding pipeline
        self.embedding_pipeline = EmbeddingPipeline(
            model_name=embedding_model,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

    def build_from_documents(self, documents: List[Any]):
        """
        Chunks the documents, generates embeddings, registers their metadata,
        adds them to the FAISS index, and persists the index.
        """
        logger.info(f"Building vector store for org {self.org_id} from {len(documents)} documents...")
        
        # 1. Chunk documents
        chunks = self.embedding_pipeline.chunk_documents(documents)
        if not chunks:
            logger.warning(f"No chunks created from documents for org {self.org_id}.")
            return
            
        # 2. Embed chunks
        embeddings = self.embedding_pipeline.embed_chunks(chunks)
        
        # 3. Create metadata dictionaries containing the text and original document metadata
        metadatas = []
        for chunk in chunks:
            meta = chunk.metadata.copy() if chunk.metadata else {}
            meta["text"] = chunk.page_content
            metadatas.append(meta)
            
        # 4. Add to the FAISS index
        self.add_embeddings(np.array(embeddings).astype('float32'), metadatas)
        
        # 5. Save index and metadata
        self.save()
        logger.info(f"Vector store successfully built and saved to {self.persist_dir}")

    def add_embeddings(self, embeddings: np.ndarray, metadatas: List[Any] = None):
        """
        Adds numerical embeddings to the FAISS index.
        """
        dim = embeddings.shape[1]
        if self.index is None:
            # L2 distance flat index
            self.index = faiss.IndexFlatL2(dim)
            
        self.index.add(embeddings)
        if metadatas:
            self.metadata.extend(metadatas)
        logger.info(f"Added {embeddings.shape[0]} vectors to FAISS index. Total index size: {self.index.ntotal}")

    def save(self):
        """
        Persists the FAISS index and metadata.
        """
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path = os.path.join(self.persist_dir, "metadata.pkl")
        
        faiss.write_index(self.index, faiss_path)
        with open(meta_path, "wb") as f:
            pickle.dump(self.metadata, f)
        logger.info(f"Saved FAISS index and metadata to {self.persist_dir}")

    def load(self) -> bool:
        """
        Loads the persisted FAISS index and metadata from disk.
        Returns True if successful, False otherwise.
        """
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path = os.path.join(self.persist_dir, "metadata.pkl")
        
        if not (os.path.exists(faiss_path) and os.path.exists(meta_path)):
            logger.warning(f"No persisted FAISS store found at {self.persist_dir}")
            return False
            
        try:
            self.index = faiss.read_index(faiss_path)
            with open(meta_path, "rb") as f:
                self.metadata = pickle.load(f)
            logger.info(f"Loaded FAISS index and metadata for org {self.org_id} from {self.persist_dir}")
            return True
        except Exception as e:
            logger.error(f"Error loading FAISS store: {e}")
            return False

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Performs vector similarity search.
        """
        if self.index is None:
            logger.warning("FAISS index is not initialized. Cannot perform search.")
            return []
            
        # Ensure correct dimensions and type
        query_vector = query_embedding.astype('float32')
        if len(query_vector.shape) == 1:
            query_vector = np.expand_dims(query_vector, axis=0)
            
        # Search index
        distances, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))
        
        results = []
        if len(indices) > 0:
            for idx, dist in zip(indices[0], distances[0]):
                if idx < 0 or idx >= len(self.metadata):
                    continue
                meta = self.metadata[idx]
                results.append({
                    "index": int(idx),
                    "distance": float(dist),
                    "metadata": meta
                })
        return results

    def query(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Embeds the query string and retrieves the most similar documents.
        """
        logger.info(f"Querying vector store for: '{query_text}'")
        # Generate embedding for the query
        query_emb = self.embedding_pipeline.embed_query(query_text)
        return self.search(query_emb, top_k=top_k)
