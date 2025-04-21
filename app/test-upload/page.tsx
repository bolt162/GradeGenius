'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function TestUploadPage() {
  const { user } = useUser();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadStatus('uploading');
    setUploadMessage('Uploading file...');
    setFileUrl(null);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      // Handle successful upload
      setUploadStatus('success');
      setUploadMessage('File uploaded successfully!');
      setFileUrl(data.file?.url || null);
      
      // Reset form
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to upload file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">S3 Upload Test</h1>
      
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl mb-4">Upload a file to S3</h2>
        
        <div className="mb-6">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={uploadStatus === 'uploading'}
          />
          <label 
            htmlFor="file-upload" 
            className={`w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 py-3 px-4 rounded-lg cursor-pointer ${
              uploadStatus === 'uploading' ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <Upload size={20} className="mr-2" />
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Select File to Upload'}
          </label>
        </div>
        
        {/* Upload Status Message */}
        {uploadStatus !== 'idle' && (
          <div className={`mb-4 p-3 rounded-md flex items-center ${
            uploadStatus === 'uploading' ? 'bg-blue-900/30 text-blue-200' : 
            uploadStatus === 'success' ? 'bg-green-900/30 text-green-200' : 
            'bg-red-900/30 text-red-200'
          }`}>
            {uploadStatus === 'uploading' ? (
              <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-200 border-t-transparent rounded-full"></div>
            ) : uploadStatus === 'success' ? (
              <CheckCircle size={20} className="mr-2 text-green-300" />
            ) : (
              <AlertCircle size={20} className="mr-2 text-red-300" />
            )}
            <span>{uploadMessage}</span>
          </div>
        )}
        
        {/* Show file URL on success */}
        {fileUrl && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">File Uploaded:</h3>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 break-all"
            >
              {fileUrl}
            </a>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-400">
          <p>User ID: {user?.id || 'Loading...'}</p>
          <p>This test page uploads directly to your configured S3 bucket.</p>
        </div>
      </div>
    </div>
  );
} 