import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_KEY || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET || process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

// Create a document client to simplify working with items
const docClient = DynamoDBDocumentClient.from(client);

// Table name for user tokens
const USER_TOKENS_TABLE = process.env.DYNAMODB_USER_TOKENS_TABLE || 'GradeGenius-UserTokens';

// Initial tokens for new users
const INITIAL_TOKEN_AMOUNT = 20000;

/**
 * Get a user's token balance
 * @param userId The user's unique ID
 * @returns The user's token balance or null if an error occurred
 */
export async function getUserTokens(userId: string): Promise<number | null> {
  try {
    const command = new GetCommand({
      TableName: USER_TOKENS_TABLE,
      Key: { userId },
    });

    const response = await docClient.send(command);
    
    // If user doesn't exist in the table, initialize them with the default amount
    if (!response.Item) {
      await initializeUserTokens(userId);
      return INITIAL_TOKEN_AMOUNT;
    }
    
    return response.Item.tokens;
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return null;
  }
}

/**
 * Initialize a new user with default token amount
 * @param userId The user's unique ID
 * @returns Whether the initialization was successful
 */
export async function initializeUserTokens(userId: string): Promise<boolean> {
  try {
    const command = new PutCommand({
      TableName: USER_TOKENS_TABLE,
      Item: {
        userId,
        tokens: INITIAL_TOKEN_AMOUNT,
      },
      // Only create if it doesn't exist
      ConditionExpression: 'attribute_not_exists(userId)',
    });

    await docClient.send(command);
    return true;
  } catch (error) {
    // If error is a ConditionalCheckFailedException, user already exists (which is fine)
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ConditionalCheckFailedException') {
      return true;
    }
    console.error('Error initializing user tokens:', error);
    return false;
  }
}

/**
 * Add tokens to a user's balance
 * @param userId The user's unique ID
 * @param amount The amount of tokens to add
 * @returns The new token balance or null if an error occurred
 */
export async function addUserTokens(userId: string, amount: number): Promise<number | null> {
  if (amount <= 0) {
    return null;
  }

  try {
    // Ensure user exists in the table
    const currentTokens = await getUserTokens(userId);
    if (currentTokens === null) {
      return null;
    }

    const command = new UpdateCommand({
      TableName: USER_TOKENS_TABLE,
      Key: { userId },
      UpdateExpression: 'ADD tokens :amount',
      ExpressionAttributeValues: {
        ':amount': amount,
      },
      ReturnValues: 'UPDATED_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes?.tokens;
  } catch (error) {
    console.error('Error adding tokens:', error);
    return null;
  }
}

/**
 * Use tokens from a user's balance
 * @param userId The user's unique ID
 * @param amount The amount of tokens to use
 * @returns The new token balance or null if an error occurred (e.g., insufficient tokens)
 */
export async function useUserTokens(userId: string, amount: number): Promise<number | null> {
  if (amount <= 0) {
    return null;
  }

  try {
    // Check if user has enough tokens
    const currentTokens = await getUserTokens(userId);
    if (currentTokens === null || currentTokens < amount) {
      return null;
    }

    const command = new UpdateCommand({
      TableName: USER_TOKENS_TABLE,
      Key: { userId },
      UpdateExpression: 'ADD tokens :amount',
      ExpressionAttributeValues: {
        ':amount': -amount,
        ':minAmount': amount,
      },
      ConditionExpression: 'tokens >= :minAmount',
      ReturnValues: 'UPDATED_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes?.tokens;
  } catch (error) {
    console.error('Error using tokens:', error);
    return null;
  }
}

/**
 * Calculate token count for content
 * This is a simple estimation function - in a real-world scenario, 
 * you would use an actual tokenizer like tiktoken or similar
 * @param content Content to calculate tokens for
 * @returns Estimated token count
 */
export function calculateTokens(content: string): number {
  // Simple approximation - tokens are roughly ~4 characters on average
  // This is a very simplistic count - for production, use a proper tokenizer
  return Math.ceil(content.length / 4);
} 