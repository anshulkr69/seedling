import os
import logging
from typing import List, Dict, Any
from drafting.vectorstore import FaissVectorStore
from drafting.data_loader import load_as_documents

logger = logging.getLogger("drafting.search")

class RAGSearch:
    def __init__(
        self,
        org_id: str,
        persist_dir: str = "faiss_store",
        embedding_model: str = "gemini-embedding-001",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        self.org_id = org_id
        self.vectorstore = FaissVectorStore(
            org_id=org_id,
            persist_dir=persist_dir,
            embedding_model=embedding_model,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        # Check if vectorstore is already built on disk, otherwise build it on-the-fly
        if not self.vectorstore.load():
            logger.info(f"Vector store not found for org {org_id}. Loading database documents to build index...")
            try:
                # Load profile and projects from Supabase
                documents = load_as_documents(org_id)
                # Build and persist the vector store
                self.vectorstore.build_from_documents(documents)
            except Exception as e:
                logger.error(f"Failed to build vector store on-the-fly for organization {org_id}: {e}")
                raise

    def retrieve_relevant_chunks(self, grant: Dict[str, Any], top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Uses grant details (title, description, cause areas) as a query to retrieve
        the top K most relevant text chunks from the organization's vector store.
        """
        # Construct query text combining the grant details
        title = grant.get("title", "")
        desc = grant.get("description", "")
        cause_areas = ", ".join(grant.get("cause_areas", []) or [])
        categories = ", ".join(grant.get("schedule_vii_categories", []) or [])
        
        query_parts = []
        if title:
            query_parts.append(f"Grant Title: {title}")
        if cause_areas:
            query_parts.append(f"Cause Areas: {cause_areas}")
        if categories:
            query_parts.append(f"Categories: {categories}")
        if desc:
            query_parts.append(f"Requirements & Description: {desc}")
            
        query_text = "\n".join(query_parts)
        
        logger.info(f"Performing similarity search for org {self.org_id} using grant details...")
        results = self.vectorstore.query(query_text, top_k=top_k)
        
        logger.info(f"Retrieved {len(results)} relevant chunks for grant matching.")
        return results
