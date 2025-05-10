// app/lib/rag/types.ts
export type ContentType = 'code' | 'essay' | 'research';

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  userId: string;
  fileKey: string;  // S3 file key
  contentType: ContentType;
  chunkIndex: number;
  timestamp: string;
  content?: string;  // Optional: The actual content of the chunk (stored in Document's pageContent)
  score?: number; // Optional score from Pinecone search results
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: ChunkMetadata;
}

export interface VectorStoreConfig {
  indexName: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  namespace: {
    code: string;
    essay: string;
    research: string;
  };
}