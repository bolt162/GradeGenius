// app/lib/rag/ragService.ts
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Pinecone } from '@pinecone-database/pinecone';
import { DocumentChunk, ContentType } from './types';
import { spendUserTokens } from '../dynamo';

// Define interfaces for Pinecone types
interface PineconeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata: {
    userId: string;
    fileKey: string;
    contentType: string;
    chunkIndex: number;
    content: string;
    timestamp: string;
    [key: string]: any;
  };
}

interface PineconeQueryResult {
  matches?: PineconeMatch[];
  namespace?: string;
  usage?: {
    readUnits: number;
  };
}

export class RAGService {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private index: any;

  constructor() {
    console.log('[RAGService] Initializing RAG service...');
    try {
      // Initialize Pinecone
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!
      });
      this.index = this.pinecone.Index('gradegenius');

      // Initialize OpenAI embeddings
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY!,
        modelName: 'text-embedding-ada-002'
      });

      // Initialize text splitter with appropriate chunk size and overlap
      this.textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
        separators: ['\n\n', '\n', ' ', '']
      });

      console.log('[RAGService] RAG service initialized successfully');
    } catch (error) {
      console.error('[RAGService] Error during initialization:', error);
      throw error;
    }
  }

  async processSubmission(
    submission: {
      content: string;
      type: ContentType;
      userId: string;
      fileKey: string;
    }
  ): Promise<void> {
    console.log('[RAGService] Starting submission processing:', {
      type: submission.type,
      userId: submission.userId,
      fileKey: submission.fileKey,
      contentLength: submission.content.length,
      isUrl: submission.content.startsWith('http'),
      firstLine: submission.content.split('\n')[0].substring(0, 100)
    });

    try {
      // No longer deleting existing vectors as requested

      // Split text into chunks
      const chunks = await this.textSplitter.splitText(submission.content);
      console.log('[RAGService] Split into chunks:', chunks.length);
      
      if (chunks.length > 0) {
        console.log('[RAGService] First chunk sample:', {
          length: chunks[0].length,
          sample: chunks[0].substring(0, 100),
          isUrl: chunks[0].startsWith('http')
        });
      }

      // Process chunks and create embeddings using OpenAI
      const embeddingPromises = chunks.map((chunk: string) => this.embeddings.embedQuery(chunk));
      const embeddings = await Promise.all(embeddingPromises);
      
      console.log('[RAGService] Generated embeddings for chunks');

      // Create pinecone vectors with deterministic IDs
      const vectors = chunks.map((chunk: string, i: number) => {
        // Create a deterministic ID based on userId, fileKey and chunk index
        const id = `${submission.userId}:${submission.fileKey}:${i}`;
        
        return {
          id,
          values: embeddings[i],
          metadata: {
            userId: submission.userId,
            fileKey: submission.fileKey,
            contentType: submission.type,
            chunkIndex: i,
            content: chunk,  // Store the text content in metadata
            timestamp: new Date().toISOString()
          }
        };
      });
      
      console.log('[RAGService] Prepared vectors for Pinecone:', {
        count: vectors.length,
        firstId: vectors.length > 0 ? vectors[0].id : '',
        firstMetadata: vectors.length > 0 ? JSON.stringify(vectors[0].metadata).substring(0, 100) : ''
      });

      // Upsert directly to Pinecone
      if (vectors.length > 0) {
        // Batch vectors in groups of 100 to avoid hitting upsert limits
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
          const batch = vectors.slice(i, i + batchSize);
          
          // Fix the upsert method format
          await this.index.upsert(
            batch,
            submission.type // namespace
          );
          
          console.log(`[RAGService] Upserted batch ${i/batchSize + 1} of ${Math.ceil(vectors.length/batchSize)}`);
        }
        
        console.log('[RAGService] Successfully stored all vectors in Pinecone');
      } else {
        console.log('[RAGService] No vectors to upsert');
      }

      console.log('[RAGService] Document processed successfully');

      try {
        // Deduct tokens (using a simple estimation)
        const tokenCost = Math.ceil(submission.content.length / 4); // Rough estimate: 1 token ≈ 4 chars
        console.log('[RAGService] Deducting tokens:', tokenCost);
        await spendUserTokens(submission.userId, tokenCost);
        console.log('[RAGService] Token deduction complete');
      } catch (error: any) {
        console.error('[RAGService] Error during token deduction:', error);
        // Don't throw here, as the main operation was successful
      }

    } catch (error) {
      console.error('[RAGService] Error processing submission:', error);
      throw error;
    }
  }

  async retrieveContext(
    query: string,
    options: {
      contentType: ContentType;
      userId: string;
      fileKey: string;
      topK?: number;
    }
  ): Promise<{
    chunks: DocumentChunk[];
    originalContent: string;
  }> {
    console.log('[RAGService] Starting context retrieval:', {
      queryLength: query.length,
      contentType: options.contentType,
      userId: options.userId,
      fileKey: options.fileKey,
      topK: options.topK
    });

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Query Pinecone directly
      const queryResult: PineconeQueryResult = await this.index.query({
        vector: queryEmbedding,
        topK: options.topK || 5,
        filter: {
          userId: options.userId,
          fileKey: options.fileKey,
          contentType: options.contentType
        },
        includeMetadata: true
      });
      
      console.log('[RAGService] Query results:', {
        numMatches: queryResult.matches ? queryResult.matches.length : 0,
        firstMatchScore: queryResult.matches && queryResult.matches.length > 0 ? queryResult.matches[0].score : null
      });

      // Convert Pinecone results to DocumentChunk format
      const chunks: DocumentChunk[] = (queryResult.matches || []).map((match: PineconeMatch) => ({
        content: match.metadata.content,
        metadata: {
          userId: options.userId,
          fileKey: options.fileKey,
          contentType: options.contentType,
          chunkIndex: match.metadata.chunkIndex || 0,
          timestamp: String(match.metadata.timestamp || new Date().toISOString()),
          score: match.score || 0
        }
      }));

      console.log('[RAGService] Formatted chunks:', {
        numChunks: chunks.length,
        firstChunkContent: chunks.length > 0 ? chunks[0].content.substring(0, 100) : '',
        isUrl: chunks.length > 0 ? chunks[0].content.startsWith('http') : false
      });

      // Combine chunks to form original content
      const originalContent = chunks.map(chunk => chunk.content).join('\n\n');
      
      console.log('[RAGService] Original content sample:', {
        length: originalContent.length,
        sample: originalContent.substring(0, 100),
        isUrl: originalContent.startsWith('http')
      });

      return {
        chunks,
        originalContent
      };
    } catch (error) {
      console.error('[RAGService] Error retrieving context:', error);
      throw error;
    }
  }
}