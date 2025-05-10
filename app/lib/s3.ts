import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';

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
  // Store in the assignments subfolder
  const fileKey = `${folderName}/assignments/${fileName}`;
  
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
  // Look specifically in the assignments subfolder
  const prefix = `${userId}/assignments/`;
  
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  
  try {
    const { Contents } = await s3Client.send(command);
    
    if (!Contents || Contents.length === 0) {
      return [];
    }
    
    // Map S3 objects to a more user-friendly format
    const files = await Promise.all(Contents.map(async (item) => {
      const key = item.Key || '';
      const urlExpiresIn = 3600; // 1 hour
      
      // Get the filename without the prefix
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
  
  // Get folder name from the fileKey or fallback to parameters
  const parts = fileKey.split('/');
  // The folder name should be the first part of the path
  const folderName = username || (parts.length > 0 ? parts[0] : userId);
  
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
  
  // Get folder name from the fileKey or fallback to parameters
  const parts = fileKey.split('/');
  // The folder name should be the first part of the path
  const folderName = username || (parts.length > 0 ? parts[0] : userId);
  
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
        // Get the original filename from the grade file name
        const gradeFileName = key.split('/').pop() || '';
        // The original file name is the grade file name without the '-grade.json' suffix
        const originalFileName = gradeFileName.replace('-grade.json', '');
        
        // Construct the assignment file key in the new structure
        const assignmentFileKey = `${folderName}/assignments/${originalFileName}`;
        
        // Get the grade result
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        const response = await s3Client.send(getCommand);
        // Convert stream to string
        const bodyContents = await streamToString(response.Body);
        // Parse the JSON
        const gradeResult = JSON.parse(bodyContents);
        
        return {
          key,
          fileKey: assignmentFileKey, // Use the new assignment path structure
          timestamp: gradeResult.timestamp,
          fileName: originalFileName,
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
 * Get the actual content of a file from S3
 * @param fileKey The key of the file in S3
 * @returns The file content as a string
 */
export async function getFileContent(fileKey: string): Promise<string> {
  console.log('[S3] getFileContent called for file:', fileKey);
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });
  
  try {
    console.log('[S3] Sending GetObjectCommand to S3');
    const response = await s3Client.send(command);
    if (!response.Body) {
      console.error('[S3] No content found in S3 response');
      throw new Error('No content found in S3 response');
    }
    
    // Convert the readable stream to string
    console.log('[S3] Converting stream to string');
    const content = await streamToString(response.Body);
    console.log('[S3] Content retrieved successfully:', {
      contentLength: content.length,
      isUrl: content.startsWith('http'),
      contentSample: content.substring(0, 100)
    });
    return content;
  } catch (error) {
    console.error('[S3] Error getting file content from S3:', error);
    throw error;
  }
}

/**
 * Extract text content from document files (docx, doc)
 * @param fileKey The key of the file in S3
 * @returns The extracted text content from the document
 */
export async function getDocumentContent(fileKey: string): Promise<string> {
  console.log('[S3] getDocumentContent called for file:', fileKey);
  
  // Check if the file is a document type
  const isDocx = fileKey.toLowerCase().endsWith('.docx');
  const isDoc = fileKey.toLowerCase().endsWith('.doc');
  
  if (!isDocx && !isDoc) {
    console.log('[S3] File is not a document type, falling back to regular content retrieval');
    return getFileContent(fileKey);
  }
  
  try {
    // Get the raw file buffer from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });
    
    console.log('[S3] Sending GetObjectCommand to S3 for document');
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.error('[S3] No content found in S3 response');
      throw new Error('No content found in S3 response');
    }
    
    // Convert the stream to buffer
    console.log('[S3] Converting stream to buffer');
    const bodyContents = await streamToBuffer(response.Body);
    
    // Extract text from the document using mammoth
    console.log('[S3] Extracting text from document');
    let extractedText = '';
    
    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer: bodyContents });
      extractedText = result.value;
    } else {
      // For .doc files, we would need additional handling
      // This is a placeholder - consider using another library for .doc files
      console.warn('[S3] .doc format requires additional libraries');
      extractedText = "This document is in .doc format which requires conversion. Please convert to .docx for better results.";
    }
    
    console.log('[S3] Document content extracted successfully:', {
      contentLength: extractedText.length,
      contentSample: extractedText.substring(0, 100)
    });
    
    return extractedText;
  } catch (error) {
    console.error('[S3] Error extracting document content from S3:', error);
    throw error;
  }
}

// Helper function to convert stream to string
async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// Add the streamToBuffer helper function
async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Store a rubric in S3
 * @param userId User ID of the owner
 * @param rubricName Name of the rubric
 * @param rubricData The rubric data object
 * @param username Optional username to use in the path instead of userId
 * @returns Object with rubric details
 */
export async function storeRubric(
  userId: string,
  rubricName: string,
  rubricData: any,
  username?: string
) {
  // Get folder name (username takes precedence over userId)
  const folderName = username || userId;
  
  // Sanitize the rubric name for use in the filename
  const sanitizedRubricName = rubricName
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-{2,}/g, '-');
  
  // Create a rubric key in the format: folderName/rubrics/sanitizedRubricName.json
  const rubricKey = `${folderName}/rubrics/${sanitizedRubricName}.json`;
  
  // Prepare the full rubric data with metadata
  const fullRubricData = {
    ...rubricData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId
  };
  
  // Upload to S3
  const uploadParams = {
    Bucket: bucketName,
    Key: rubricKey,
    Body: JSON.stringify(fullRubricData, null, 2),
    ContentType: 'application/json',
    Metadata: {
      userId,
      rubricName,
      createdDate: new Date().toISOString(),
    }
  };
  
  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return rubric details
    return {
      key: rubricKey,
      name: rubricName,
      createdAt: fullRubricData.createdAt,
      updatedAt: fullRubricData.updatedAt,
    };
  } catch (error) {
    console.error('Error storing rubric in S3:', error);
    throw error;
  }
}

/**
 * Get a specific rubric
 * @param rubricKey The key of the rubric file or just the rubric name
 * @param userId User ID of the owner
 * @param username Optional username to use in the path instead of userId
 * @returns Rubric data object or null if not found
 */
export async function getRubric(rubricKey: string, userId: string, username?: string) {
  // Determine if we got a full S3 key or just a rubric name
  let fullRubricKey = rubricKey;
  
  // If rubricKey doesn't contain slashes, it's probably just the filename
  if (!rubricKey.includes('/')) {
    const folderName = username || userId;
    
    // Sanitize the rubric name for consistency
    const sanitizedRubricName = rubricKey
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-{2,}/g, '-');
      
    fullRubricKey = `${folderName}/rubrics/${sanitizedRubricName}.json`;
  }
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fullRubricKey,
  });
  
  try {
    const response = await s3Client.send(command);
    
    // Convert stream to string
    const bodyContents = await streamToString(response.Body);
    
    // Parse the JSON
    return JSON.parse(bodyContents);
  } catch (error) {
    console.error('Error retrieving rubric from S3:', error);
    return null; // Rubric not found
  }
}

/**
 * List all rubrics for a user
 * @param userId User ID to list rubrics for
 * @param username Optional username to use in the path instead of userId
 * @returns Array of rubric objects
 */
export async function listUserRubrics(userId: string, username?: string) {
  // Determine which folder name to use (username takes precedence)
  const folderName = username || userId;
  const prefix = `${folderName}/rubrics/`;
  
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  
  try {
    const { Contents } = await s3Client.send(command);
    
    if (!Contents || Contents.length === 0) {
      return [];
    }
    
    // Map S3 objects to rubric objects
    const rubrics = await Promise.all(Contents.map(async (item) => {
      const key = item.Key || '';
      
      try {
        // Get the filename without the folder prefix and .json extension
        const fileName = key.split('/').pop() || '';
        const rubricName = fileName.replace('.json', '');
        
        // Get the full rubric data
        const rubricData = await getRubric(key, userId, username);
        
        return {
          key,
          name: rubricData.name || rubricName, // Use data.name if available, otherwise filename
          classLevel: rubricData.classLevel,
          course: rubricData.course,
          specialization: rubricData.specialization,
          createdAt: rubricData.createdAt,
          updatedAt: rubricData.updatedAt,
          questionCount: rubricData.questions?.length || 0,
          lastModified: item.LastModified,
        };
      } catch (error) {
        console.error(`Error processing rubric ${key}:`, error);
        return null;
      }
    }));
    
    // Filter out any null values from errors
    return rubrics.filter(Boolean);
  } catch (error) {
    console.error('Error listing rubrics from S3:', error);
    throw error;
  }
}

/**
 * Update an existing rubric
 * @param rubricKey The key of the rubric file or just the rubric name
 * @param userId User ID of the owner
 * @param rubricData The updated rubric data
 * @param username Optional username to use in the path instead of userId
 * @returns Object with updated rubric details
 */
export async function updateRubric(
  rubricKey: string,
  userId: string,
  rubricData: any,
  username?: string
) {
  console.log('updateRubric called with params:', {
    rubricKey,
    newName: rubricData.name
  });
  
  // Determine if we got a full S3 key or just a rubric name
  let fullRubricKey = rubricKey;
  const folderName = username || userId;
  
  // If rubricKey doesn't contain slashes, it's probably just the filename
  if (!rubricKey.includes('/')) {
    // Sanitize the rubric name for consistency
    const sanitizedRubricName = rubricKey
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-{2,}/g, '-');
      
    fullRubricKey = `${folderName}/rubrics/${sanitizedRubricName}.json`;
  }
  
  try {
    // Try to get the existing rubric first to preserve creation date
    const existingRubric = await getRubric(fullRubricKey, userId, username);
    
    if (!existingRubric) {
      console.log(`No existing rubric found at ${fullRubricKey}, will create new one`);
    } else {
      console.log(`Found existing rubric: ${existingRubric.name}`);
    }
    
    // If the name has changed, we'll create a new file with the new name
    // and return the new key so the caller can delete the old one if needed
    let updatedRubricKey = fullRubricKey;
    let nameChanged = false;
    
    if (existingRubric && rubricData.name && existingRubric.name !== rubricData.name) {
      nameChanged = true;
      console.log(`Rubric name changed from "${existingRubric.name}" to "${rubricData.name}"`);
      
      // Generate a new key based on the new name
      const sanitizedNewName = rubricData.name
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, '-')
        .replace(/-{2,}/g, '-');
        
      updatedRubricKey = `${folderName}/rubrics/${sanitizedNewName}.json`;
      console.log(`Generated new rubric key based on new name: ${updatedRubricKey}`);
    }
    
    // Prepare the updated rubric data with metadata
    const updatedRubricData = {
      ...rubricData,
      createdAt: existingRubric?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId
    };
    
    // If the name changed, we'll write to the new location 
    const uploadParams = {
      Bucket: bucketName,
      Key: nameChanged ? updatedRubricKey : fullRubricKey,
      Body: JSON.stringify(updatedRubricData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        userId,
        rubricName: rubricData.name,
        updatedDate: new Date().toISOString(),
      }
    };
    
    console.log(`Uploading updated rubric to: ${uploadParams.Key}`);
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return updated rubric details with the key that was used
    return {
      key: nameChanged ? updatedRubricKey : fullRubricKey,
      name: rubricData.name,
      createdAt: updatedRubricData.createdAt,
      updatedAt: updatedRubricData.updatedAt,
    };
  } catch (error) {
    console.error('Error updating rubric in S3:', error);
    throw error;
  }
}

/**
 * Delete a rubric from S3
 * @param rubricKey The key of the rubric to delete or just the rubric name
 * @param userId User ID of the owner
 * @param username Optional username to use in the path instead of userId
 * @returns Boolean indicating success
 */
export async function deleteRubric(rubricKey: string, userId: string, username?: string) {
  // Determine if we got a full S3 key or just a rubric name
  let fullRubricKey = rubricKey;
  
  // If rubricKey doesn't contain slashes, it's probably just the filename
  if (!rubricKey.includes('/')) {
    const folderName = username || userId;
    
    // Sanitize the rubric name for consistency
    const sanitizedRubricName = rubricKey
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-{2,}/g, '-');
      
    fullRubricKey = `${folderName}/rubrics/${sanitizedRubricName}.json`;
  }
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fullRubricKey,
  });
  
  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting rubric from S3:', error);
    throw error;
  }
} 