/**
 * Migration script to restructure grades in S3 bucket
 * 
 * This script migrates existing grades from the old structure:
 *   userId/grades/fileName-grade.json
 * 
 * To the new structure:
 *   username/grades/fileName-grade.json
 * 
 * Usage:
 * 1. Make sure AWS credentials are set in environment variables
 * 2. Run: node scripts/migrate-grades.js
 */

// Import AWS SDK
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-provider-ini');

// Configuration
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'gradegenius-assignments';
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to true to simulate without making changes

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_KEY || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET || process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Helper function to get username from Clerk user record
async function getUsernameFromUserId(userId) {
  // This would normally require a call to your user database
  // For the migration script, you might need to maintain a mapping of userIds to usernames
  
  // Placeholder implementation - replace with actual lookup
  console.log(`Looking up username for userId: ${userId}`);
  
  // You could implement one of the following approaches:
  // 1. Call Clerk API to get user info
  // 2. Load a pre-exported mapping file
  // 3. Use a database query
  
  // For now, we'll use userId as username
  return userId;
}

// Helper function to stream S3 response body to string
async function streamToString(stream) {
  if (!stream) return '';
  
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Function to migrate a single grade file
async function migrateGradeFile(gradeKey) {
  // Extract userId and fileName from the key
  const parts = gradeKey.split('/');
  const userId = parts[0];
  const fileName = parts[2]; // The filename with -grade.json suffix
  
  try {
    // Get username for the user
    const username = await getUsernameFromUserId(userId);
    
    // Skip if username is the same as userId
    if (username === userId) {
      console.log(`Skipping ${gradeKey} - username is the same as userId`);
      return { skipped: true, reason: 'username same as userId' };
    }
    
    // Define the new key with username
    const newGradeKey = `${username}/grades/${fileName}`;
    
    // Log the migration
    console.log(`Migrating grade: ${gradeKey} -> ${newGradeKey}`);
    
    if (!DRY_RUN) {
      // Get the existing file content
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: gradeKey,
      });
      
      const response = await s3Client.send(getCommand);
      const bodyContents = await streamToString(response.Body);
      const metadata = response.Metadata || {};
      
      // Create new file with the same content
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: newGradeKey,
        Body: bodyContents,
        ContentType: 'application/json',
        Metadata: {
          ...metadata,
          // Add migration metadata
          migratedFrom: gradeKey,
          migrationDate: new Date().toISOString()
        }
      });
      
      await s3Client.send(putCommand);
      
      // Delete the old file (optional - you might want to keep them during migration)
      // const deleteCommand = new DeleteObjectCommand({
      //   Bucket: BUCKET_NAME,
      //   Key: gradeKey,
      // });
      // await s3Client.send(deleteCommand);
    }
    
    return { 
      success: true, 
      oldKey: gradeKey, 
      newKey: newGradeKey 
    };
  } catch (error) {
    console.error(`Error migrating ${gradeKey}:`, error);
    return { 
      success: false, 
      oldKey: gradeKey, 
      error: error.message 
    };
  }
}

// Main migration function
async function migrateGrades() {
  console.log(`Starting migration ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  
  // Find all grade files in the old structure
  const results = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0
  };
  
  try {
    // List all objects in the bucket - this approach assumes a reasonable number of files
    // For very large buckets, you'd need to handle continuation tokens
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });
    
    const { Contents } = await s3Client.send(listCommand);
    
    if (!Contents || Contents.length === 0) {
      console.log('No files found in bucket');
      return;
    }
    
    // Filter for grade files in the old structure (userId/grades/*.json)
    const gradeFiles = Contents
      .map(item => item.Key)
      .filter(key => {
        const parts = key.split('/');
        return parts.length === 3 && parts[1] === 'grades' && parts[2].endsWith('-grade.json');
      });
    
    results.total = gradeFiles.length;
    console.log(`Found ${gradeFiles.length} grade files to migrate`);
    
    // Process each file
    for (const gradeKey of gradeFiles) {
      const result = await migrateGradeFile(gradeKey);
      
      if (result.skipped) {
        results.skipped++;
      } else if (result.success) {
        results.migrated++;
      } else {
        results.failed++;
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
  
  // Print summary
  console.log('\nMigration Summary:');
  console.log(`Total files: ${results.total}`);
  console.log(`Migrated: ${results.migrated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`${DRY_RUN ? '[DRY RUN - No actual changes were made]' : ''}`);
}

// Run the migration
migrateGrades().catch(console.error); 