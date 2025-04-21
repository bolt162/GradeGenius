// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient, ListTablesCommand, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Table name for user tokens
const USER_TOKENS_TABLE = process.env.DYNAMODB_USER_TOKENS_TABLE || 'GradeGenius-UserTokens';

// Initialize DynamoDB client
console.log('Initializing DynamoDB client with the following configuration:');
console.log('Region:', process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1');
console.log('Access Key ID length:', (process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '').length > 0 ? 'provided' : 'not provided');
console.log('Secret Access Key length:', (process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '').length > 0 ? 'provided' : 'not provided');

// Try using both regular and NEXT_PUBLIC_ prefixed env vars since Next.js often uses both
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || process.env.AWS_S3_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || process.env.AWS_S3_SECRET || '',
  }
});

async function main() {
  try {
    console.log('Checking DynamoDB connection...');
    
    // First, check if we can connect by listing tables
    const listCommand = new ListTablesCommand({});
    console.log('Sending ListTables command...');
    const { TableNames } = await client.send(listCommand);
    console.log('Connection successful!');
    console.log('Existing tables:', TableNames);
    
    // Check if our table exists
    if (TableNames.includes(USER_TOKENS_TABLE)) {
      console.log(`Table ${USER_TOKENS_TABLE} already exists. Checking details...`);
      
      // Get table details
      const describeCommand = new DescribeTableCommand({
        TableName: USER_TOKENS_TABLE
      });
      
      const tableDetails = await client.send(describeCommand);
      console.log('Table details:', JSON.stringify(tableDetails, null, 2));
      
      console.log('Table is ready for use.');
      return;
    }
    
    // Create the table if it doesn't exist
    console.log(`Table ${USER_TOKENS_TABLE} does not exist. Creating...`);
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
    
    await client.send(createTableCommand);
    console.log(`Table ${USER_TOKENS_TABLE} created successfully!`);
    
    // Wait for the table to be active
    console.log('Waiting for table to be active...');
    let tableActive = false;
    while (!tableActive) {
      const describeCommand = new DescribeTableCommand({
        TableName: USER_TOKENS_TABLE
      });
      
      const { Table } = await client.send(describeCommand);
      if (Table.TableStatus === 'ACTIVE') {
        tableActive = true;
        console.log('Table is now active and ready for use.');
      } else {
        console.log(`Table status: ${Table.TableStatus}. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
      }
    }
    
  } catch (error) {
    console.error('Error interacting with DynamoDB:', error);
    process.exit(1);
  }
}

main(); 