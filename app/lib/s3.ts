import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_KEY || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET || process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

// Use the bucket name from environment variables
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'gradegenius-assignments';

/**
 * Upload a file to S3
 * @param file File to upload
 * @param fileName Original file name
 * @param userId User ID to associate with the file
 * @param contentType MIME type of the file
 * @param username Optional username to use in the path instead of userId
 * @returns Object with file details
 */
export async function uploadFile(
  file: Buffer, 
  fileName: string, 
  userId: string, 
  contentType: string,
  username?: string
) {
  // Generate a unique file name to avoid collisions
  // Use username in the path if provided, otherwise use userId
  const folderName = username || userId;
  const fileKey = `${folderName}/${fileName}`;
  
  // Upload to S3
  const uploadParams = {
    Bucket: bucketName,
    Key: fileKey,
    Body: file,
    ContentType: contentType,
    Metadata: {
      userId,
      originalName: fileName,
      uploadDate: new Date().toISOString(),
    }
  };
  
  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return file details
    return {
      key: fileKey,
      name: fileName,
      url: `https://${bucketName}.s3.amazonaws.com/${fileKey}`,
      uploadDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Get a pre-signed URL for a file
 * @param fileKey The key of the file in S3
 * @returns Pre-signed URL
 */
export async function getFileUrl(fileKey: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    // Add CORS-related headers
    ResponseContentDisposition: `inline; filename="${encodeURIComponent(fileKey.split('/').pop() || '')}"`,
  });
  
  // URL expires in 1 hour
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * List files for a user
 * @param userId User ID or username to list files for
 * @param isUsername Whether the userId parameter is actually a username
 * @returns Array of file objects
 */
export async function listUserFiles(userId: string, isUsername: boolean = false) {
  const prefix = `${userId}/`;
  
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  
  try {
    const { Contents } = await s3Client.send(command);
    
    if (!Contents || Contents.length === 0) {
      return [];
    }
    
    // Filter out files from the grades subfolder
    const assignmentFiles = Contents.filter(item => {
      const key = item.Key || '';
      // Exclude files in the grades subfolder
      return !key.includes(`${userId}/grades/`);
    });
    
    if (assignmentFiles.length === 0) {
      return [];
    }
    
    // Map S3 objects to a more user-friendly format
    const files = await Promise.all(assignmentFiles.map(async (item) => {
      const key = item.Key || '';
      const urlExpiresIn = 3600; // 1 hour
      
      // Get the filename without the prefix and UUID
      const fileName = key.split('/').pop() || '';
      
      return {
        key,
        name: fileName,
        size: item.Size,
        lastModified: item.LastModified,
        url: await getFileUrl(key),
      };
    }));
    
    return files;
  } catch (error) {
    console.error('Error listing files from S3:', error);
    throw error;
  }
}

/**
 * Delete a file from S3
 * @param fileKey Key of the file to delete
 */
export async function deleteFile(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });
  
  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}

/**
 * Parse filename to extract original name from UUID format
 * @param filename Filename with UUID
 * @returns Original filename
 */
export function parseFilename(filename: string): string {
  // Format: [uuid]-[original-filename]
  const parts = filename.split('-');
  if (parts.length <= 1) return filename;
  
  // Remove the UUID part and join the rest
  return parts.slice(1).join('-');
}

/**
 * Store grading result in S3
 * @param fileKey Key of the file that was graded
 * @param userId User ID of the owner
 * @param gradeResult The grading result text
 * @param rubric The rubric used for grading
 * @param username Optional username to use in the path instead of userId
 * @returns Object with grade details
 */
export async function storeGradeResult(
  fileKey: string,
  userId: string,
  gradeResult: string,
  rubric: string,
  username?: string
) {
  // Extract the original filename from the fileKey
  const fileName = fileKey.split('/').pop() || 'unknown-file';
  
  // Get folder name (username takes precedence over userId)
  const folderName = username || fileKey.split('/')[0] || userId;
  
  // Create a grading result JSON
  const gradeData = {
    fileKey,
    rubric,
    gradeResult,
    timestamp: new Date().toISOString(),
    userId
  };
  
  // Create a grade key in the format: folderName/grades/originalFileName-grade.json
  const gradeKey = `${folderName}/grades/${fileName}-grade.json`;
  
  // Upload to S3
  const uploadParams = {
    Bucket: bucketName,
    Key: gradeKey,
    Body: JSON.stringify(gradeData, null, 2),
    ContentType: 'application/json',
    Metadata: {
      userId,
      originalFileKey: fileKey,
      gradeDate: new Date().toISOString(),
    }
  };
  
  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return grade details
    return {
      key: gradeKey,
      fileKey,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error storing grade result in S3:', error);
    throw error;
  }
}

/**
 * Get grade result for a file
 * @param fileKey The key of the original file
 * @param userId User ID of the owner
 * @param username Optional username to use in the path instead of userId
 * @returns Grade result object or null if not found
 */
export async function getGradeResult(fileKey: string, userId: string, username?: string) {
  // Extract the original filename from the fileKey
  const fileName = fileKey.split('/').pop() || 'unknown-file';
  
  // Get folder name from either:
  // 1. Provided username parameter
  // 2. First part of the fileKey (which should be the username/userId)
  // 3. Fall back to userId if all else fails
  const folderName = username || fileKey.split('/')[0] || userId;
  
  // Create the grade key
  const gradeKey = `${folderName}/grades/${fileName}-grade.json`;
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: gradeKey,
  });
  
  try {
    const response = await s3Client.send(command);
    
    // Convert stream to string
    const bodyContents = await streamToString(response.Body);
    
    // Parse the JSON
    return JSON.parse(bodyContents);
  } catch (error) {
    console.error('Error retrieving grade result from S3:', error);
    return null; // Grade not found
  }
}

/**
 * List all grades for a user
 * @param userId User ID to list grades for
 * @param username Optional username to use in the path instead of userId
 * @returns Array of grade objects
 */
export async function listUserGrades(userId: string, username?: string) {
  // Determine which folder name to use (username takes precedence)
  const folderName = username || userId;
  const prefix = `${folderName}/grades/`;
  
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  
  try {
    const { Contents } = await s3Client.send(command);
    
    if (!Contents || Contents.length === 0) {
      return [];
    }
    
    // Map S3 objects to grade objects
    const grades = await Promise.all(Contents.map(async (item) => {
      const key = item.Key || '';
      
      try {
        // Pass the username to getGradeResult to maintain consistency
        const gradeResult = await getGradeResult(
          key.replace(`${folderName}/grades/`, '').replace('-grade.json', ''), 
          userId,
          username
        );
        
        return {
          key,
          fileKey: gradeResult.fileKey,
          timestamp: gradeResult.timestamp,
          fileName: key.split('/').pop()?.replace('-grade.json', '') || '',
          lastModified: item.LastModified,
        };
      } catch (error) {
        console.error(`Error processing grade ${key}:`, error);
        return null;
      }
    }));
    
    // Filter out any null values from errors
    return grades.filter(Boolean);
  } catch (error) {
    console.error('Error listing grades from S3:', error);
    throw error;
  }
}

/**
 * Helper function to convert ReadableStream to string
 */
async function streamToString(stream: any): Promise<string> {
  if (!stream) return '';
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
} 