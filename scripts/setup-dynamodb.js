const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || '',
  }
});

// Table name for user tokens
const USER_TOKENS_TABLE = process.env.DYNAMODB_USER_TOKENS_TABLE || 'GradeGenius-UserTokens';

async function main() {
  try {
    // Check if table already exists
    const listCommand = new ListTablesCommand({});
    const { TableNames } = await client.send(listCommand);
    
    if (TableNames.includes(USER_TOKENS_TABLE)) {
      console.log(`Table ${USER_TOKENS_TABLE} already exists, skipping creation.`);
      return;
    }
    
    // Create the table
    const createTableCommand = new CreateTableCommand({
      TableName: USER_TOKENS_TABLE,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST' // On-demand capacity
    });
    
    console.log(`Creating table ${USER_TOKENS_TABLE}...`);
    await client.send(createTableCommand);
    console.log(`Table ${USER_TOKENS_TABLE} created successfully!`);
    
  } catch (error) {
    console.error('Error setting up DynamoDB:', error);
    process.exit(1);
  }
}

main(); 