import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDB({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_KEY || '',
    secretAccessKey: process.env.AWS_S3_SECRET || '',
  },
});

const ddbDocClient = DynamoDBDocument.from(client);

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get token balance from DynamoDB
    // For this example, we'll simulate a balance as if it were coming from DynamoDB
    // In a real implementation, you would query your database table
    
    // Mock implementation - in production replace with actual DynamoDB query
    let balance = 20000; // Default token amount for new users
    
    try {
      // This would be your actual DynamoDB query in production
      /*
      const result = await ddbDocClient.get({
        TableName: 'UserTokens',
        Key: {
          userId: userId,
        },
      });
      
      balance = result.Item?.balance || 20000;
      */
      
      // For demo purposes, generate a random balance between 5,000 and 18,000
      balance = Math.floor(Math.random() * 13000) + 5000;
      
    } catch (dbError) {
      console.error('Error fetching token balance from DynamoDB:', dbError);
      // Fall back to default balance if DB query fails
    }

    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error in token balance API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
} 